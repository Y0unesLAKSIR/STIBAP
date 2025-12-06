"""
Database connection and operations
"""
from supabase import create_client, Client
from config import settings
from typing import List, Dict, Optional, Any, Union
import json
import ast
import logging
import mimetypes
import tempfile
import zipfile
import time
import re
from pathlib import Path
from datetime import datetime
from postgrest import APIError

logger = logging.getLogger(__name__)

COURSE_CONTENT_BUCKET = "course_content"

_slug_pattern = re.compile(r"[^a-z0-9]+")


def _slugify_value(value: Optional[str], default: str = "course") -> str:
    base = value.strip().lower() if value else default
    slug = _slug_pattern.sub('-', base).strip('-')
    return slug or default


def _normalize_supabase_result(result: Union[str, Dict, None]) -> Optional[Dict]:
    """Try to normalize Supabase RPC responses (including APIError payloads)."""
    if result is None:
        return None

    if isinstance(result, dict):
        return result

    if isinstance(result, str):
        # Try JSON first
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            pass

        # Fallback to Python literal (APIError string repr)
        try:
            literal = ast.literal_eval(result)
            if isinstance(literal, dict):
                return literal
        except Exception:
            pass

    return None


class Database:
    """Supabase database wrapper"""
    
    def __init__(self):
        supabase_key = settings.supabase_service_role_key or settings.supabase_key
        self.client: Client = create_client(
            settings.supabase_url,
            supabase_key
        )
    
    # Session/User helpers
    def get_user_by_session(self, session_token: str) -> Optional[Dict[str, Any]]:
        """Resolve current user from a session token via Supabase RPC."""
        try:
            response = self.client.rpc('verify_session', {
                'p_session_token': session_token
            }).execute()
            result = _normalize_supabase_result(response.data)
            if not result or not result.get('success'):
                return None
            return result.get('user')
        except Exception as e:
            logger.error(f"get_user_by_session failed: {e}")
            return None

    # Categories
    async def get_all_categories(self) -> List[Dict]:
        """Get all categories with hierarchy"""
        response = self.client.table('categories').select('*').execute()
        return response.data
    
    async def get_main_categories(self) -> List[Dict]:
        """Get top-level categories (no parent)"""
        response = self.client.table('categories')\
            .select('*')\
            .is_('parent_id', 'null')\
            .execute()
        return response.data
    
    async def get_subcategories(self, parent_id: str) -> List[Dict]:
        """Get subcategories of a parent category"""
        response = self.client.table('categories')\
            .select('*')\
            .eq('parent_id', parent_id)\
            .execute()
        return response.data
    
    # Difficulty Levels
    async def get_difficulty_levels(self) -> List[Dict]:
        """Get all difficulty levels"""
        response = self.client.table('difficulty_levels')\
            .select('*')\
            .order('level')\
            .execute()
        return response.data
    
    # Courses
    async def get_all_courses(self) -> List[Dict]:
        """Get all active courses"""
        response = self.client.table('courses')\
            .select('*, category:categories(*), difficulty:difficulty_levels(*)')\
            .eq('is_active', True)\
            .execute()
        return response.data
    
    async def get_courses_by_category(self, category_id: str) -> List[Dict]:
        """Get courses in a specific category"""
        response = self.client.table('courses')\
            .select('*, category:categories(*), difficulty:difficulty_levels(*)')\
            .eq('category_id', category_id)\
            .eq('is_active', True)\
            .execute()
        return response.data
    
    async def get_course_by_id(self, course_id: str) -> Optional[Dict]:
        """Get a specific course"""
        response = self.client.table('courses')\
            .select('*, category:categories(*), difficulty:difficulty_levels(*)')\
            .eq('id', course_id)\
            .single()\
            .execute()
        return response.data
    
    # User Preferences
    async def get_user_preferences(self, user_id: str) -> Optional[Dict]:
        """Get user preferences"""
        response = self.client.table('user_preferences')\
            .select('*')\
            .eq('user_id', user_id)\
            .execute()
        return response.data[0] if response.data else None
    
    async def create_user_preferences(self, user_id: str, preferences: Dict) -> Dict:
        """Create user preferences"""
        data = {
            'user_id': user_id,
            **preferences
        }
        response = self.client.table('user_preferences')\
            .insert(data)\
            .execute()
        return response.data[0]
    
    async def update_user_preferences(self, user_id: str, preferences: Dict) -> Dict:
        """Update user preferences"""
        response = self.client.table('user_preferences')\
            .update(preferences)\
            .eq('user_id', user_id)\
            .execute()
        return response.data[0]
    
    async def complete_onboarding(self, user_id: str) -> Dict:
        """Mark onboarding as completed"""
        response = self.client.table('user_preferences')\
            .update({'onboarding_completed': True})\
            .eq('user_id', user_id)\
            .execute()
        return response.data[0]
    
    # User Course Progress
    async def get_user_progress(self, user_id: str) -> List[Dict]:
        """Get all course progress for a user"""
        response = self.client.table('user_course_progress')\
            .select('*, course:courses(*)')\
            .eq('user_id', user_id)\
            .execute()
        return response.data
    
    async def update_course_progress(
        self, 
        user_id: str, 
        course_id: str, 
        progress: Dict
    ) -> Dict:
        """Update course progress"""
        # Check if progress exists
        existing = self.client.table('user_course_progress')\
            .select('*')\
            .eq('user_id', user_id)\
            .eq('course_id', course_id)\
            .execute()
        
        if existing.data:
            response = self.client.table('user_course_progress')\
                .update(progress)\
                .eq('user_id', user_id)\
                .eq('course_id', course_id)\
                .execute()
        else:
            # Insert new
            data = {
                'user_id': user_id,
                'course_id': course_id,
                **progress
            }
            response = self.client.table('user_course_progress')\
                .insert(data)\
                .execute()

        return response.data[0]

    # Course consumption: outline & per-unit progress
    async def get_course_outline(self, course_id: str) -> Dict[str, Any]:
        """Return course info with modules and units (including full unit content)."""
        # Course
        course_resp = self.client.table('courses').select('*').eq('id', course_id).single().execute()
        course = course_resp.data if course_resp and course_resp.data else None
        if not course:
            return {}
        # Modules
        modules_resp = self.client.table('course_modules')\
            .select('*')\
            .eq('course_id', course_id)\
            .order('order_index', desc=False)\
            .execute()
        modules = modules_resp.data or []
        module_ids = [m['id'] for m in modules]
        units_by_module: Dict[str, List[Dict[str, Any]]] = {m['id']: [] for m in modules}
        if module_ids:
            units_resp = self.client.table('course_units')\
                .select('*')\
                .in_('module_id', module_ids)\
                .order('order_index', desc=False)\
                .execute()
            for u in (units_resp.data or []):
                units_by_module.setdefault(u['module_id'], []).append(u)
        # Attach units to modules
        outline_modules = []
        for m in modules:
            outline_modules.append({
                **m,
                'units': units_by_module.get(m['id'], [])
            })
        return {
            'course': course,
            'modules': outline_modules
        }

    async def get_user_course_progress(self, user_id: str, course_id: str) -> Dict[str, Any]:
        """Compute totals, completed units and roll-up status for a course."""
        # Modules for course
        modules_resp = self.client.table('course_modules')\
            .select('id')\
            .eq('course_id', course_id)\
            .execute()
        module_ids = [m['id'] for m in (modules_resp.data or [])]
        total_units = 0
        unit_ids: List[str] = []
        if module_ids:
            units_resp = self.client.table('course_units')\
                .select('id')\
                .in_('module_id', module_ids)\
                .order('order_index', desc=False)\
                .execute()
            unit_ids = [u['id'] for u in (units_resp.data or [])]
            total_units = len(unit_ids)
        # Completed units
        completed_resp = self.client.table('user_unit_progress')\
            .select('unit_id')\
            .eq('user_id', user_id)\
            .eq('course_id', course_id)\
            .execute()
        completed_ids = [row['unit_id'] for row in (completed_resp.data or [])]
        # Roll-up row
        rollup_resp = self.client.table('user_course_progress')\
            .select('*')\
            .eq('user_id', user_id)\
            .eq('course_id', course_id)\
            .execute()
        rollup = rollup_resp.data[0] if rollup_resp.data else None
        percentage = int((len(completed_ids) / total_units) * 100) if total_units > 0 else 0
        status = rollup['status'] if rollup else ('not_started' if percentage == 0 else ('completed' if percentage == 100 else 'in_progress'))
        return {
            'total_units': total_units,
            'completed_unit_ids': completed_ids,
            'percentage': percentage,
            'status': status,
            'rollup': rollup
        }

    async def complete_unit(self, user_id: str, course_id: str, unit_id: str) -> Dict[str, Any]:
        """Mark a unit as completed for the user and update course progress."""
        # Validate unit and module
        unit_resp = self.client.table('course_units').select('id,module_id').eq('id', unit_id).single().execute()
        unit = unit_resp.data if unit_resp and unit_resp.data else None
        if not unit:
            return {'success': False, 'error': 'Unit not found'}
        module_resp = self.client.table('course_modules').select('id,course_id').eq('id', unit['module_id']).single().execute()
        module = module_resp.data if module_resp and module_resp.data else None
        if not module or module['course_id'] != course_id:
            return {'success': False, 'error': 'Unit does not belong to course'}
        # Upsert user_unit_progress (idempotent)
        existing = self.client.table('user_unit_progress')\
            .select('id')\
            .eq('user_id', user_id)\
            .eq('unit_id', unit_id)\
            .execute()
        if existing.data:
            self.client.table('user_unit_progress')\
                .update({'completed_at': 'now()'})\
                .eq('id', existing.data[0]['id'])\
                .execute()
        else:
            self.client.table('user_unit_progress')\
                .insert({
                    'user_id': user_id,
                    'course_id': course_id,
                    'module_id': module['id'],
                    'unit_id': unit_id
                })\
                .execute()
        # Recompute progress and update roll-up
        summary = await self.get_user_course_progress(user_id, course_id)
        status = 'completed' if summary['percentage'] == 100 else 'in_progress'
        update = {
            'status': status,
            'progress_percentage': summary['percentage']
        }
        if status == 'in_progress':
            update['started_at'] = datetime.utcnow().isoformat()
        if status == 'completed':
            update['completed_at'] = datetime.utcnow().isoformat()
        rollup = await self.update_course_progress(user_id, course_id, update)
        return {'success': True, 'progress': summary, 'rollup': rollup}
    # Course import helpers
    def _prepare_modules(
        self,
        modules: Optional[List[Dict[str, Any]]],
        root_path: Path,
        course_slug: str
    ) -> List[Dict[str, Any]]:
        """Load module manifests/units from archive structure and upload related assets."""

        prepared: List[Dict[str, Any]] = []
        if not modules:
            return prepared

        modules_root = root_path / 'modules'

        for index, module in enumerate(modules, start=1):
            module_copy = dict(module)
            module_copy.setdefault('order_index', index)
            module_copy['slug'] = module_copy.get('slug') or _slugify_value(
                module_copy.get('title'),
                f'module-{index}'
            )

            module_dir = modules_root / module_copy['slug']
            module_manifest_path = module_dir / 'module.json'
            units_raw: List[Dict[str, Any]] = []

            if module_manifest_path.exists():
                try:
                    with open(module_manifest_path, 'r', encoding='utf-8') as module_file:
                        module_manifest = json.load(module_file)
                    # Respect module.json structure: prefer explicit module_slug/slug from manifest
                    manifest_slug = module_manifest.get('module_slug') or module_manifest.get('slug')
                    if manifest_slug:
                        module_copy['slug'] = manifest_slug
                        module_dir = modules_root / module_copy['slug']  # update dir to reflect slug from manifest
                    module_copy.setdefault('title', module_manifest.get('title'))
                    module_copy.setdefault('description', module_manifest.get('description'))
                    module_copy['order_index'] = module_copy.get('order_index') or module_manifest.get('order_index', index)
                    units_raw = module_manifest.get('units') or []
                except Exception as module_error:
                    logger.error(f"Failed to load module manifest {module_manifest_path}: {module_error}")
            else:
                units_raw = module_copy.get('units') or []

            prepared_units: List[Dict[str, Any]] = []

            for unit_index, unit in enumerate(units_raw, start=1):
                unit_copy = dict(unit)
                unit_copy.setdefault('order_index', unit_index)
                unit_copy['slug'] = unit_copy.get('slug') or _slugify_value(
                    unit_copy.get('title'),
                    f'unit-{unit_index}'
                )

                # Load unit content with preference: explicit file > default markdown file > inline body
                unit_content = unit_copy.get('content') or {}
                content_file_ref = unit_content.get('file')
                default_md = module_dir / 'units' / f"{unit_copy['slug']}.md"

                if content_file_ref:
                    content_path = module_dir / content_file_ref
                    if content_path.exists():
                        try:
                            unit_copy['content'] = {
                                'format': unit_content.get('format', 'markdown'),
                                'body': content_path.read_text(encoding='utf-8')
                            }
                        except Exception as content_error:
                            logger.error(f"Failed to read unit content file {content_path}: {content_error}")
                    else:
                        logger.error(f"Unit content file missing: {content_path}")
                elif default_md.exists():
                    try:
                        unit_copy['content'] = {
                            'format': 'markdown',
                            'body': default_md.read_text(encoding='utf-8')
                        }
                    except Exception as default_content_error:
                        logger.error(f"Failed to read default unit markdown {default_md}: {default_content_error}")
                else:
                    # Fallback to inline body if provided
                    body = unit_content.get('body') if unit_content else None
                    if body is not None:
                        unit_copy['content'] = {
                            'format': unit_content.get('format', 'markdown'),
                            'body': body
                        }

                unit_assets: List[Dict[str, Any]] = []
                for asset in unit_copy.get('assets') or []:
                    file_ref = asset.get('file')
                    asset_path = module_dir / file_ref if file_ref else None
                    storage_path = None
                    file_size = None
                    content_type = None

                    if asset_path and asset_path.exists():
                        relative_path = str(Path(file_ref)).replace('\\', '/') if file_ref else asset_path.name
                        storage_key = f"assets/{course_slug}/{relative_path}"
                        uploaded_path = self._upload_file_to_storage(asset_path, storage_key)
                        if uploaded_path:
                            storage_path = uploaded_path
                            file_size = asset_path.stat().st_size
                            content_type = mimetypes.guess_type(str(asset_path))[0]
                        else:
                            logger.error(f"Failed to upload asset {asset_path} for module {module_copy['slug']}")
                    elif file_ref:
                        logger.error(f"Asset file missing in archive: {module_dir / file_ref}")

                    if storage_path:
                        unit_assets.append({
                            'file_name': asset.get('file_name') or (Path(file_ref).name if file_ref else None),
                            'storage_path': storage_path,
                            'file_type': content_type,
                            'file_size_bytes': file_size,
                            'metadata': asset.get('metadata') or {}
                        })

                unit_copy['assets'] = unit_assets
                prepared_units.append(unit_copy)

            module_copy['units'] = prepared_units
            prepared.append(module_copy)

        return prepared

    def _prepare_additional_assets(
        self,
        assets: Optional[List[Dict[str, Any]]],
        root_path: Path,
        course_slug: str
    ) -> List[Dict[str, Any]]:
        prepared: List[Dict[str, Any]] = []
        if not assets:
            return prepared

        for asset in assets:
            file_ref = asset.get('file')
            if not file_ref:
                continue

            asset_path = root_path / file_ref
            if not asset_path.exists():
                logger.error(f"Referenced asset does not exist in archive: {file_ref}")
                continue

            relative_path = str(Path(file_ref)).replace('\\', '/')
            storage_key = f"assets/{course_slug}/{relative_path}"
            uploaded_path = self._upload_file_to_storage(asset_path, storage_key)
            if not uploaded_path:
                continue

            prepared.append({
                'file_name': asset.get('file_name') or Path(file_ref).name,
                'storage_path': uploaded_path,
                'file_type': mimetypes.guess_type(str(asset_path))[0],
                'file_size_bytes': asset_path.stat().st_size,
                'metadata': asset.get('metadata') or {},
                'module_slug': asset.get('module_slug'),
                'unit_slug': asset.get('unit_slug')
            })

        return prepared

    def _upload_file_to_storage(self, local_path: Path, destination: str) -> Optional[str]:
        try:
            bucket = self.client.storage.from_(COURSE_CONTENT_BUCKET)
            normalized_dest = destination.replace('\\', '/')
            with open(local_path, 'rb') as file_handle:
                file_bytes = file_handle.read()
            options = {
                'contentType': mimetypes.guess_type(str(local_path))[0] or 'application/octet-stream',
                'upsert': 'true'
            }
            bucket.upload(normalized_dest, file_bytes, options)
            return normalized_dest
        except Exception as storage_error:
            logger.error(f"Storage upload failed for {local_path}: {storage_error}")
            return None

    def _upload_directory_to_storage(self, root_path: Path, base_prefix: str) -> None:
        """Recursively upload an entire directory to storage preserving structure.
        Skips the archive's manifest file name 'course.json' at root (it is metadata),
        otherwise uploads all files including markdown, images, etc.
        """
        if not root_path.exists() or not root_path.is_dir():
            return

        for p in root_path.rglob('*'):
            if p.is_file():
                try:
                    rel = p.relative_to(root_path)
                    # Skip root-level course.json manifest; all other files are uploaded
                    if str(rel).replace('\\', '/') == 'course.json':
                        continue
                    rel_str = str(rel).replace('\\', '/')
                    dest = f"{base_prefix}/{rel_str}"
                    self._upload_file_to_storage(p, dest)
                except Exception as e:
                    logger.error(f"Failed to upload file {p} from directory sync: {e}")

    def _verify_admin_session(self, session_token: str) -> Dict[str, Any]:
        """Ensure the session token belongs to an admin user."""
        try:
            response = self.client.rpc('verify_session', {
                'p_session_token': session_token
            }).execute()
            result = _normalize_supabase_result(response.data)
            if not result or not result.get('success'):
                return {'success': False, 'error': result.get('error', 'Invalid session')}

            user = result.get('user') or {}
            if user.get('role') not in {'admin', 'superadmin'}:
                return {'success': False, 'error': 'Unauthorized'}

            return {'success': True, 'user': user}
        except Exception as session_error:
            logger.error(f"Session verification failed: {session_error}")
            return {'success': False, 'error': 'Session verification failed'}

    def _upsert_course_structure(
        self,
        course_payload: Dict[str, Any],
        modules: List[Dict[str, Any]],
        additional_assets: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Persist the course, modules, units, and assets to Supabase tables."""
        try:
            course_slug = course_payload.get('slug') or _slugify_value(course_payload.get('title'))
            course_record = {
                'title': course_payload.get('title'),
                'description': course_payload.get('description'),
                'category_id': course_payload.get('category_id'),
                'difficulty_id': course_payload.get('difficulty_id'),
                'duration_minutes': course_payload.get('duration_minutes'),
                'keywords': course_payload.get('keywords'),
                'prerequisites': course_payload.get('prerequisites'),
                'learning_outcomes': course_payload.get('learning_outcomes'),
                'content_url': course_payload.get('content_url'),
                'thumbnail_url': course_payload.get('thumbnail_url'),
                'source_file_url': course_payload.get('source_file_url'),
                'is_active': course_payload.get('is_active', True)
            }

            course_id = course_payload.pop('course_id', None)

            if course_id:
                course_record['id'] = course_id
                course_record['slug'] = course_slug
                upsert_response = self.client.table('courses')\
                    .upsert(course_record, on_conflict='id', returning='representation')\
                    .execute()

                if not upsert_response.data:
                    return {'success': False, 'error': 'Failed to upsert course'}

                course_id = upsert_response.data[0]['id']
                course_slug = upsert_response.data[0].get('slug', course_slug)
            else:
                base_slug = course_slug
                slug_suffix = 1
                while True:
                    try:
                        insert_payload = dict(course_record)
                        insert_payload['slug'] = course_slug
                        insert_response = self.client.table('courses')\
                            .insert(insert_payload, returning='representation')\
                            .execute()
                        if not insert_response.data:
                            return {'success': False, 'error': 'Failed to create course'}
                        course_id = insert_response.data[0]['id']
                        course_slug = insert_response.data[0].get('slug', course_slug)
                        break
                    except APIError as api_error:
                        if getattr(api_error, 'code', None) == '23505':
                            course_slug = f"{base_slug}-{slug_suffix}"
                            slug_suffix += 1
                            continue
                        logger.error(f"Course insert failed: {api_error}")
                        return {'success': False, 'error': 'Failed to create course'}

            # Remove previous structure for this course (if re-importing)
            self.client.table('course_modules').delete().eq('course_id', course_id).execute()

            module_slug_to_id: Dict[str, str] = {}

            for module in modules:
                module_record = {
                    'course_id': course_id,
                    'slug': module.get('slug'),
                    'title': module.get('title'),
                    'description': module.get('description'),
                    'order_index': module.get('order_index'),
                    'estimated_minutes': module.get('estimated_minutes')
                }

                module_response = self.client.table('course_modules')\
                    .insert(module_record, returning='representation')\
                    .execute()

                if not module_response.data:
                    logger.error(f"Failed to insert module {module_record['slug']}")
                    continue

                module_id = module_response.data[0]['id']
                module_slug_to_id[module_record['slug']] = module_id

                for unit in module.get('units', []):
                    unit_record = {
                        'module_id': module_id,
                        'slug': unit.get('slug'),
                        'title': unit.get('title'),
                        'unit_type': unit.get('unit_type', 'chapter'),
                        'content': unit.get('content'),
                        'order_index': unit.get('order_index'),
                        'estimated_minutes': unit.get('estimated_minutes')
                    }

                    unit_response = self.client.table('course_units')\
                        .insert(unit_record, returning='representation')\
                        .execute()

                    if not unit_response.data:
                        logger.error(f"Failed to insert unit {unit_record['slug']} for module {module_record['slug']}")
                        continue

                    unit_id = unit_response.data[0]['id']

                    for asset in unit.get('assets', []):
                        asset_record = {
                            'unit_id': unit_id,
                            'file_name': asset.get('file_name'),
                            'storage_path': asset.get('storage_path'),
                            'file_type': asset.get('file_type'),
                            'file_size_bytes': asset.get('file_size_bytes'),
                            'metadata': asset.get('metadata')
                        }
                        self.client.table('course_unit_assets').insert(asset_record).execute()

            # Associate additional assets with units if module/unit slugs provided
            for asset in additional_assets:
                module_slug = asset.get('module_slug')
                unit_slug = asset.get('unit_slug')
                if module_slug and unit_slug and module_slug in module_slug_to_id:
                    unit_lookup = self.client.table('course_units')\
                        .select('id')\
                        .eq('module_id', module_slug_to_id[module_slug])\
                        .eq('slug', unit_slug)\
                        .limit(1)\
                        .execute()
                    if unit_lookup.data:
                        self.client.table('course_unit_assets').insert({
                            'unit_id': unit_lookup.data[0]['id'],
                            'file_name': asset.get('file_name'),
                            'storage_path': asset.get('storage_path'),
                            'file_type': asset.get('file_type'),
                            'file_size_bytes': asset.get('file_size_bytes'),
                            'metadata': asset.get('metadata')
                        }).execute()

            return {
                'success': True,
                'course_id': course_id,
                'slug': course_slug,
                'message': 'Course imported successfully'
            }
        except Exception as persist_error:
            logger.error(f"Failed to persist course structure: {persist_error}")
            return {'success': False, 'error': 'Failed to persist course structure'}

    async def import_course_package(
        self,
        session_token: str,
        archive_path: Path,
        course_id: Optional[str] = None
    ) -> Dict:
        """Parse a course archive (.zip) and import into Supabase tables."""

        if not archive_path.exists():
            return {'success': False, 'error': 'Uploaded archive not found on server'}

        session_check = self._verify_admin_session(session_token)
        if not session_check.get('success'):
            return session_check

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_root = Path(tmp_dir)
            try:
                with zipfile.ZipFile(archive_path, 'r') as zip_ref:
                    zip_ref.extractall(tmp_root)
            except zipfile.BadZipFile:
                return {'success': False, 'error': 'Invalid archive format'}

            manifest_file = tmp_root / 'course.json'
            if not manifest_file.exists():
                return {'success': False, 'error': 'course.json manifest missing from archive'}

            with open(manifest_file, 'r', encoding='utf-8') as fh:
                manifest = json.load(fh)

            modules_raw = manifest.pop('modules', [])
            additional_assets = manifest.pop('assets', [])

            course_slug = _slugify_value(manifest.get('slug') or manifest.get('title'))
            manifest['slug'] = course_slug

            # Prepare and upload all content referenced by manifest (modules, unit assets, extra assets)
            prepared_modules = self._prepare_modules(modules_raw, tmp_root, course_slug)
            prepared_assets = self._prepare_additional_assets(additional_assets, tmp_root, course_slug)

            # NEW: Upload the entire extracted archive directory so that ALL files are available in storage
            # This ensures not only assets folder but every file (markdown, JSON, images, etc.) is uploaded
            try:
                self._upload_directory_to_storage(tmp_root, f"courses/{course_slug}")
            except Exception as e:
                logger.error(f"Failed to upload full course directory to storage: {e}")

            # Always upload the original ZIP to archives for reference
            timestamp = int(time.time())
            storage_key = f"archives/{course_slug}-{timestamp}.zip"
            storage_path = self._upload_file_to_storage(archive_path, storage_key)

            course_payload = dict(manifest)
            if storage_path:
                course_payload['source_file_url'] = storage_path
            course_payload['has_structure'] = bool(prepared_modules)
            if course_id:
                course_payload['course_id'] = course_id

            return self._upsert_course_structure(course_payload, prepared_modules, prepared_assets)

    # Auth & Profile Functions
    async def update_user_profile(
        self,
        session_token: str,
        full_name: Optional[str] = None,
        bio: Optional[str] = None,
        avatar_url: Optional[str] = None
    ) -> Dict:
        """Update user profile via Supabase RPC"""
        try:
            response = self.client.rpc('update_profile', {
                'p_session_token': session_token,
                'p_full_name': full_name,
                'p_bio': bio,
                'p_avatar_url': avatar_url
            }).execute()

            result = _normalize_supabase_result(response.data)
            if result is None:
                logger.error("update_profile returned unexpected response: %s", response.data)
                return {'success': False, 'error': 'Unexpected response from database'}

            logger.info("Profile update RPC succeeded: %s", result)
            return result

        except Exception as e:
            error_payload = _normalize_supabase_result(str(e))
            if error_payload and error_payload.get('success'):
                logger.info("Profile update RPC returned success via exception: %s", error_payload)
                return error_payload

            logger.error("Profile update failed: %s", e)
            if error_payload and error_payload.get('error'):
                return {'success': False, 'error': error_payload.get('error')}
            return {'success': False, 'error': 'Profile update failed'}

    async def change_user_password(
        self,
        session_token: str,
        old_password: str,
        new_password: str
    ) -> Dict:
        """Change user password via Supabase RPC"""
        try:
            response = self.client.rpc('change_password', {
                'p_session_token': session_token,
                'p_old_password': old_password,
                'p_new_password': new_password
            }).execute()

            result = _normalize_supabase_result(response.data)
            if result is None:
                logger.error("change_password returned unexpected response: %s", response.data)
                return {'success': False, 'error': 'Unexpected response from database'}

            logger.info("Password change RPC succeeded")
            return result

        except Exception as e:
            error_payload = _normalize_supabase_result(str(e))
            if error_payload and error_payload.get('success'):
                logger.info("Password change RPC returned success via exception: %s", error_payload)
                return error_payload

            logger.error("Password change failed: %s", e)
            if error_payload and error_payload.get('error'):
                return {'success': False, 'error': error_payload.get('error')}
            return {'success': False, 'error': 'Failed to change password'}
    
    async def admin_get_all_users(self, session_token: str) -> Dict:
        """Get all users (admin only) via Supabase RPC"""
        try:
            response = self.client.rpc('admin_get_all_users', {
                'p_session_token': session_token
            }).execute()
            result = _normalize_supabase_result(response.data)
            if result is None:
                logger.error("admin_get_all_users returned unexpected response: %s", response.data)
                return {'success': False, 'error': 'Unexpected response from database'}

            logger.info("Admin get users RPC succeeded")
            return result
        except Exception as e:
            error_payload = _normalize_supabase_result(str(e))
            if error_payload and error_payload.get('success'):
                logger.info("Admin get users RPC returned success via exception: %s", error_payload)
                return error_payload

            logger.error(f"Error getting users: {e}")
            if error_payload and error_payload.get('error'):
                return {'success': False, 'error': error_payload.get('error')}
            return {'success': False, 'error': str(e)}
    
    async def admin_update_user(
        self,
        session_token: str,
        target_user_id: str,
        full_name: Optional[str] = None,
        email: Optional[str] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Dict:
        """Update any user (admin only) via Supabase RPC"""
        try:
            logger.info(f"Calling admin_update_user RPC for user {target_user_id}")
            response = self.client.rpc('admin_update_user', {
                'p_session_token': session_token,
                'p_target_user_id': target_user_id,
                'p_full_name': full_name,
                'p_email': email,
                'p_role': role,
                'p_is_active': is_active
            }).execute()
            
            # RPC functions return JSON directly in response.data
            result = _normalize_supabase_result(response.data)
            if result is None:
                logger.error("admin_update_user returned unexpected response: %s", response.data)
                return {'success': False, 'error': 'Unexpected response from database'}

            logger.info(f"Admin update user SUCCESS: {result}")
            return result
                
        except Exception as e:
            error_payload = _normalize_supabase_result(str(e))
            if error_payload and error_payload.get('success'):
                logger.info("Admin update RPC returned success via exception: %s", error_payload)
                return error_payload

            logger.error(f"Exception in admin_update_user: {type(e).__name__}: {str(e)}")
            if error_payload and error_payload.get('error'):
                return {'success': False, 'error': error_payload.get('error')}
            return {'success': False, 'error': 'Failed to update user'}

    async def admin_update_course_category(
        self,
        session_token: str,
        course_id: str,
        category_id: str
    ) -> Dict:
        """Update a course's category (admin only)."""
        try:
            # Verify admin session
            check = self._verify_admin_session(session_token)
            if not check.get('success'):
                return check

            # Ensure category exists
            cat = self.client.table('categories').select('id').eq('id', category_id).limit(1).execute()
            if not cat.data:
                return {'success': False, 'error': 'Category not found'}

            # Update the course
            resp = self.client.table('courses')\
                .update({'category_id': category_id})\
                .eq('id', course_id)\
                .execute()

            if resp.data is None:
                return {'success': False, 'error': 'Failed to update course category'}

            return {'success': True, 'course_id': course_id, 'category_id': category_id}
        except Exception as e:
            logger.error(f"Failed to update course category: {e}")
            return {'success': False, 'error': 'Failed to update course category'}

    async def admin_assign_user_to_course(
        self,
        session_token: str,
        user_id: str,
        course_id: str
    ) -> Dict:
        """Assign a user to a course (admin only)."""
        try:
            # Verify admin session
            check = self._verify_admin_session(session_token)
            if not check.get('success'):
                return check

            # Verify user exists in profiles table
            user_check = self.client.table('profiles').select('id').eq('id', user_id).limit(1).execute()
            if not user_check.data:
                return {'success': False, 'error': 'User not found'}

            # Verify course exists
            course_check = self.client.table('courses').select('id').eq('id', course_id).limit(1).execute()
            if not course_check.data:
                return {'success': False, 'error': 'Course not found'}

            # Check if assignment already exists
            existing = self.client.table('user_course_progress')\
                .select('id')\
                .eq('user_id', user_id)\
                .eq('course_id', course_id)\
                .limit(1)\
                .execute()

            if existing.data:
                return {'success': False, 'error': 'User is already assigned to this course'}

            # Create the assignment
            assignment_data = {
                'user_id': user_id,
                'course_id': course_id,
                'status': 'not_started',
                'progress_percentage': 0
            }

            resp = self.client.table('user_course_progress')\
                .insert(assignment_data)\
                .execute()

            if not resp.data:
                return {'success': False, 'error': 'Failed to assign user to course'}

            return {
                'success': True,
                'message': 'User successfully assigned to course',
                'user_id': user_id,
                'course_id': course_id
            }
        except Exception as e:
            logger.error(f"Failed to assign user to course: {e}")
            return {'success': False, 'error': 'Failed to assign user to course'}


# Global database instance
db = Database()

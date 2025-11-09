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

                # Load unit content from external file if referenced
                unit_content = unit_copy.get('content') or {}
                content_file_ref = unit_content.get('file')
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
                else:
                    # Fallback: attempt to load markdown by slug if no body provided
                    body = unit_content.get('body') if unit_content else None
                    if not body:
                        default_md = module_dir / 'units' / f"{unit_copy['slug']}.md"
                        if default_md.exists():
                            try:
                                unit_copy['content'] = {
                                    'format': 'markdown',
                                    'body': default_md.read_text(encoding='utf-8')
                                }
                            except Exception as default_content_error:
                                logger.error(f"Failed to read default unit markdown {default_md}: {default_content_error}")

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

            prepared_modules = self._prepare_modules(modules_raw, tmp_root, course_slug)
            prepared_assets = self._prepare_additional_assets(additional_assets, tmp_root, course_slug)

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


# Global database instance
db = Database()

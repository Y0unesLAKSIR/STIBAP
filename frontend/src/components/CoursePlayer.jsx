import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSessionToken } from '../services/customAuth';
import apiClient from '../services/apiClient';
import ProgressBar from './ProgressBar';
import './CoursePlayer.css';

// Lazy-load react-markdown and plugins so the app works even if deps aren't installed yet
let ReactMarkdownMod = null;
let remarkGfmMod = null;

const CoursePlayer = () => {
  const [mdLib, setMdLib] = useState({ ReactMarkdown: null, remarkGfm: null });
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [outline, setOutline] = useState(null);
  const [progress, setProgress] = useState({ percentage: 0, completed_unit_ids: [], total_units: 0, status: 'not_started' });
  const [selected, setSelected] = useState({ moduleId: null, unitId: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // lazy import markdown libs
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [{ default: ReactMarkdown }, { default: remarkGfm }] = await Promise.all([
          import('react-markdown'),
          import('remark-gfm')
        ]);
        if (mounted) setMdLib({ ReactMarkdown, remarkGfm });
      } catch (e) {
        // libs not available; keep plaintext fallback
        console.warn('Markdown libraries not available, falling back to plain text. Install react-markdown and remark-gfm to enable rich rendering.');
      }
    })();
    return () => { mounted = false; };
  }, []);

  const modules = outline?.modules || [];

  const allUnits = useMemo(() => {
    const arr = [];
    modules.forEach(m => {
      (m.units || []).forEach(u => arr.push({ module: m, unit: u }));
    });
    return arr;
  }, [modules]);

  const current = useMemo(() => {
    if (!selected.moduleId || !selected.unitId) return null;
    const mod = modules.find(m => m.id === selected.moduleId);
    const unit = mod?.units?.find(u => u.id === selected.unitId);
    return mod && unit ? { module: mod, unit } : null;
  }, [modules, selected]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        // outline with full content
        const outlineResp = await apiClient.getCourseOutline(courseId);
        if (!outlineResp.success) throw new Error(outlineResp.error || 'Failed to load outline');
        setOutline(outlineResp.data);

        // default select first unit
        const firstMod = outlineResp.data.modules?.[0] || null;
        const firstUnit = firstMod?.units?.[0] || null;
        if (firstMod && firstUnit) {
          setSelected({ moduleId: firstMod.id, unitId: firstUnit.id });
        }

        // progress
        const token = await getSessionToken();
        const progResp = await apiClient.getCourseProgress(courseId, token);
        if (progResp.success) {
          setProgress(progResp.data);
        }
      } catch (e) {
        console.error(e);
        setError(e.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  const isCompleted = (unitId) => progress?.completed_unit_ids?.includes(unitId);

  const handleComplete = async () => {
    if (!current) return;
    try {
      setSaving(true);
      const token = await getSessionToken();
      const resp = await apiClient.completeUnit(courseId, current.unit.id, token);
      if (!resp.success) throw new Error(resp.error || 'Failed to mark as read');
      // refresh progress
      const progResp = await apiClient.getCourseProgress(courseId, token);
      if (progResp.success) setProgress(progResp.data);
    } catch (e) {
      setError(e.message || 'Failed to mark as read');
    } finally {
      setSaving(false);
    }
  };

  const gotoPrev = () => {
    if (!current) return;
    const idx = allUnits.findIndex(p => p.unit.id === current.unit.id);
    if (idx > 0) {
      const prev = allUnits[idx - 1];
      setSelected({ moduleId: prev.module.id, unitId: prev.unit.id });
    }
  };

  const gotoNext = () => {
    if (!current) return;
    const idx = allUnits.findIndex(p => p.unit.id === current.unit.id);
    if (idx >= 0 && idx < allUnits.length - 1) {
      const nxt = allUnits[idx + 1];
      setSelected({ moduleId: nxt.module.id, unitId: nxt.unit.id });
    }
  };

  if (loading) {
    return (
      <div className="courseplayer-page">
        <div className="cp-nav">
          <button className="back-button" onClick={() => navigate('/home')}>← Back to Dashboard</button>
        </div>
        <div className="cp-loading">Loading course…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="courseplayer-page">
        <div className="cp-nav">
          <button className="back-button" onClick={() => navigate('/home')}>← Back to Dashboard</button>
        </div>
        <div className="cp-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="courseplayer-page">
      <div className="cp-header">
        <div className="cp-header__content">
          <div>
            <h1>{outline?.course?.title || 'Course'}</h1>
            <p>{outline?.course?.description || ''}</p>
          </div>
          <button className="back-button" onClick={() => navigate('/home')}>← Back to Dashboard</button>
        </div>
      </div>

      <div className="cp-content">
        <div className="cp-grid">
          <aside className="cp-sidebar">
            <div className="cp-sidebar__inner">
              <h3>Outline</h3>
              <div className="cp-outline">
                {modules.map(m => (
                  <div key={m.id} className="cp-module">
                    <div className="cp-module__title">{m.order_index}. {m.title}</div>
                    <ul className="cp-unit-list">
                      {(m.units || []).map(u => (
                        <li
                          key={u.id}
                          className={`cp-unit ${selected.unitId === u.id ? 'active' : ''}`}
                          onClick={() => setSelected({ moduleId: m.id, unitId: u.id })}
                        >
                          <span className={`cp-unit__check ${isCompleted(u.id) ? 'done' : ''}`}>{isCompleted(u.id) ? '✓' : '○'}</span>
                          <span className="cp-unit__title">{u.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="cp-main">
            <ProgressBar percentage={progress?.percentage || 0} />

            {current && (
              <div className="cp-unit-card">
                <div className="cp-unit-card__header">
                  <div>
                    <div className="cp-unit-type">{current.unit.unit_type || 'chapter'}</div>
                    <h2>{current.unit.title}</h2>
                  </div>
                  <div className="cp-actions">
                    <button className="btn-secondary" onClick={gotoPrev} disabled={allUnits.findIndex(p => p.unit.id === current.unit.id) <= 0}>← Prev</button>
                    <button className="btn-secondary" onClick={gotoNext} disabled={allUnits.findIndex(p => p.unit.id === current.unit.id) >= allUnits.length - 1}>Next →</button>
                    <button className={`btn-primary ${isCompleted(current.unit.id) ? 'btn-primary--ghost' : ''}`} onClick={handleComplete} disabled={saving}>
                      {isCompleted(current.unit.id) ? 'Marked as Read' : (saving ? 'Saving…' : 'Mark as Read')}
                    </button>
                  </div>
                </div>
                <div className="cp-unit-body">
                  {current.unit?.content?.format === 'markdown' ? (
                    mdLib.ReactMarkdown ? (
                      <div className="markdown-body">
                        <mdLib.ReactMarkdown remarkPlugins={[mdLib.remarkGfm]}>
                          {current.unit.content.body || ''}
                        </mdLib.ReactMarkdown>
                      </div>
                    ) : (
                      <pre className="cp-markdown">{current.unit.content.body}</pre>
                    )
                  ) : (
                    <pre className="cp-markdown">{JSON.stringify(current.unit?.content || {}, null, 2)}</pre>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;

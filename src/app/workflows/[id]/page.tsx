'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  STAGES,
  STAGE_LABELS,
  type WorkflowState,
  type StageName,
  type VideoBrief,
  type SavedBrief,
} from '@/lib/workflow/types';

export default function WorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [workflow, setWorkflow] = useState<WorkflowState | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runningStage, setRunningStage] = useState<StageName | null>(null);
  const [expandedStage, setExpandedStage] = useState<StageName | null>(null);
  const [feedbackStage, setFeedbackStage] = useState<StageName | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [topicIdea, setTopicIdea] = useState('');
  const [savingBrief, setSavingBrief] = useState(false);
  const [viewingSavedBrief, setViewingSavedBrief] = useState<SavedBrief | null>(null);

  useEffect(() => { fetchWorkflow(); }, [id]);
  useEffect(() => {
    if (workflow?.status === 'running') {
      const interval = setInterval(fetchWorkflow, 2000);
      return () => clearInterval(interval);
    }
  }, [workflow?.status]);

  const fetchWorkflow = async () => {
    try {
      const res = await fetch(`/api/workflows/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setWorkflow(data);
      setTopicIdea(data.input.topicIdea || '');
      setError(data.error || null);
      if (data.currentStage) setExpandedStage(data.currentStage);
    } catch (err) {
      console.error('Failed to fetch workflow:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateTopic = async () => {
    try {
      const res = await fetch(`/api/workflows/${id}/topic`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicIdea }),
      });
      const result = await res.json();
      if (result.workflow) setWorkflow(result.workflow);
    } catch (err) {
      console.error('Failed to update topic:', err);
    }
  };

  const runWorkflow = async () => {
    setRunning(true);
    setError(null);
    try {
      // Update topic first if changed
      if (topicIdea !== (workflow?.input.topicIdea || '')) {
        await updateTopic();
      }
      const res = await fetch(`/api/workflows/${id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow?.status === 'paused' ? { continue: true } : {}),
      });
      const result = await res.json();
      if (result.error) setError(result.error);
      if (result.workflow) {
        setWorkflow(result.workflow);
        setError(result.workflow.error || null);
        if (result.workflow.currentStage) setExpandedStage(result.workflow.currentStage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run workflow');
    } finally {
      setRunning(false);
    }
  };

  const runSingleStage = async (stage: StageName) => {
    setRunning(true);
    setRunningStage(stage);
    setError(null);
    try {
      // Update topic first if changed
      if (topicIdea !== (workflow?.input.topicIdea || '')) {
        await updateTopic();
      }
      const res = await fetch(`/api/workflows/${id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      const result = await res.json();
      if (result.error) setError(result.error);
      if (result.workflow) {
        setWorkflow(result.workflow);
        setError(result.workflow.error || null);
        if (result.workflow.currentStage) setExpandedStage(result.workflow.currentStage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run stage');
    } finally {
      setRunning(false);
      setRunningStage(null);
    }
  };

  const handleStageAction = async (stage: StageName, action: 'approve' | 'reject' | 'rerun', stageFeedback?: string) => {
    setRunning(true);
    setRunningStage(stage);
    setError(null);
    try {
      const res = await fetch(`/api/workflows/${id}/stages/${stage}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, feedback: stageFeedback, continueToNext: true }),
      });
      const result = await res.json();
      if (result.error) setError(result.error);
      if (result.workflow) {
        setWorkflow(result.workflow);
        setError(result.workflow.error || null);
        setFeedbackStage(null);
        setFeedback('');
        if (result.workflow.currentStage) setExpandedStage(result.workflow.currentStage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process action');
    } finally {
      setRunning(false);
      setRunningStage(null);
    }
  };

  const saveBrief = async () => {
    setSavingBrief(true);
    try {
      const res = await fetch(`/api/workflows/${id}/briefs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const result = await res.json();
      if (result.workflow) {
        setWorkflow(result.workflow);
        alert('Brief saved!');
      }
    } catch (err) {
      console.error('Failed to save brief:', err);
    } finally {
      setSavingBrief(false);
    }
  };

  const deleteSavedBrief = async (briefId: string) => {
    if (!confirm('Delete this saved brief?')) return;
    try {
      const res = await fetch(`/api/workflows/${id}/briefs?briefId=${briefId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.workflow) setWorkflow(result.workflow);
    } catch (err) {
      console.error('Failed to delete brief:', err);
    }
  };

  const resetWorkflow = async () => {
    if (!confirm('Start a new brief? This will clear current progress (saved briefs are kept).')) return;
    try {
      const res = await fetch(`/api/workflows/${id}/reset`, { method: 'POST' });
      const result = await res.json();
      if (result.workflow) {
        setWorkflow(result.workflow);
        setExpandedStage(null);
      }
    } catch (err) {
      console.error('Failed to reset workflow:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        <div className="animate-spin" style={{ width: '24px', height: '24px', border: '2px solid var(--border)', borderTopColor: 'var(--accent-purple)', borderRadius: '50%', marginRight: '12px' }} />
        Loading...
      </div>
    );
  }

  if (!workflow) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <h1>Workflow not found</h1>
        <Link href="/" style={{ color: 'var(--accent-purple)' }}>← Back to dashboard</Link>
      </div>
    );
  }

  const getStageStatus = (stage: StageName) => workflow.stages[stage].status;
  const getStageOutput = (stage: StageName) => workflow.stages[stage].output;
  const canRunStage = (stage: StageName) => {
    const stageIndex = STAGES.indexOf(stage);
    for (let i = 0; i < stageIndex; i++) {
      if (workflow.stages[STAGES[i]].status !== 'approved') return false;
    }
    return true;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'var(--accent-green)';
      case 'awaiting-approval': return 'var(--accent-yellow)';
      case 'running': return 'var(--accent-blue)';
      default: return 'var(--text-muted)';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return '✓';
      case 'awaiting-approval': return '⏸';
      case 'running': return '◐';
      default: return '○';
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px', display: 'inline-block' }}>← Back to dashboard</Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>{workflow.name}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{workflow.input.niche}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(workflow.status === 'completed' || workflow.status === 'paused') && (
              <button
                onClick={resetWorkflow}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                🆕 New Brief
              </button>
            )}
            <button
              onClick={runWorkflow}
              disabled={running || workflow.status === 'completed' || workflow.status === 'running'}
              style={{
                background: workflow.status === 'completed' ? 'var(--accent-green)' : 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
                color: 'white', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, fontSize: '14px',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              {running && !runningStage && <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />}
              {workflow.status === 'completed' ? '✓ Completed' : workflow.status === 'paused' ? '▶ Continue' : workflow.status === 'running' ? 'Running...' : '▶ Start'}
            </button>
          </div>
        </div>
      </div>

      {/* Topic Input */}
      <div style={{ marginBottom: '24px', padding: '20px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
          💡 Topic / Idea (optional)
        </label>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Have a specific topic in mind? Enter it here. Leave blank to let AI suggest one.
        </p>
        <input
          type="text"
          value={topicIdea}
          onChange={(e) => setTopicIdea(e.target.value)}
          onBlur={updateTopic}
          placeholder="e.g., How to build a client onboarding bot with Make.com and Claude"
          style={{ width: '100%', padding: '12px 16px', fontSize: '14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
        />
      </div>

      {error && (
        <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--accent-red-dim)', border: '1px solid var(--accent-red)', borderRadius: '8px' }}>
          <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--accent-red)' }}>⚠️ Error</div>
          <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{error}</div>
        </div>
      )}

      {/* Saved Briefs */}
      {workflow.savedBriefs && workflow.savedBriefs.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>📁 Saved Briefs ({workflow.savedBriefs.length})</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {workflow.savedBriefs.map((saved) => (
              <div
                key={saved.id}
                style={{
                  padding: '12px 16px',
                  background: viewingSavedBrief?.id === saved.id ? 'var(--accent-purple-dim)' : 'var(--bg-secondary)',
                  border: `1px solid ${viewingSavedBrief?.id === saved.id ? 'var(--accent-purple)' : 'var(--border)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
                onClick={() => setViewingSavedBrief(viewingSavedBrief?.id === saved.id ? null : saved)}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>{saved.name || saved.brief.theme.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(saved.createdAt).toLocaleDateString()}
                    {saved.topicIdea && ` • ${saved.topicIdea.slice(0, 30)}...`}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSavedBrief(saved.id); }}
                  style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '16px', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Viewing Saved Brief */}
      {viewingSavedBrief && (
        <div style={{ marginBottom: '24px', padding: '20px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--accent-purple)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>📄 Viewing: {viewingSavedBrief.name}</h3>
            <button onClick={() => setViewingSavedBrief(null)} style={{ padding: '6px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px' }}>
              Close
            </button>
          </div>
          <VideoBriefDisplay brief={viewingSavedBrief.brief} />
        </div>
      )}

      {/* Stages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {STAGES.map((stage, index) => {
          const status = getStageStatus(stage);
          const output = getStageOutput(stage);
          const isExpanded = expandedStage === stage;
          const isRunningThis = runningStage === stage;
          const canRun = canRunStage(stage);
          const isFullBrief = stage === 'full-brief';

          return (
            <div key={stage} style={{ background: 'var(--bg-secondary)', border: `1px solid ${workflow.currentStage === stage ? 'var(--accent-purple)' : 'var(--border)'}`, borderRadius: '12px', overflow: 'hidden' }}>
              {/* Header */}
              <div onClick={() => setExpandedStage(isExpanded ? null : stage)} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: status === 'approved' ? 'var(--accent-green-dim)' : status === 'awaiting-approval' ? 'var(--accent-yellow-dim)' : 'var(--bg-tertiary)', color: getStatusColor(status), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                  {status === 'running' || isRunningThis ? <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid var(--border)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }} /> : getStatusIcon(status)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>{index + 1}. {STAGE_LABELS[stage]}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{isRunningThis ? 'running...' : status.replace('-', ' ')}</div>
                </div>
                {status === 'pending' && canRun && (
                  <button onClick={(e) => { e.stopPropagation(); runSingleStage(stage); }} disabled={running} style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--accent-purple)', color: 'white', fontWeight: 600, fontSize: '13px' }}>▶ Run</button>
                )}
                <div style={{ color: 'var(--text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</div>
              </div>

              {/* Content */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '20px' }}>
                  {!output && status === 'pending' && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      {canRun ? (
                        <button onClick={() => runSingleStage(stage)} disabled={running} style={{ padding: '12px 24px', borderRadius: '8px', background: 'var(--accent-purple)', color: 'white', fontWeight: 600 }}>▶ Run {STAGE_LABELS[stage]}</button>
                      ) : <p>Complete previous stages first</p>}
                    </div>
                  )}

                  {output && status === 'awaiting-approval' && (
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--accent-yellow-dim)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--accent-yellow)', marginBottom: '4px' }}>⏸ Awaiting Approval</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Review and approve to continue</div>
                      </div>
                      <button onClick={() => setFeedbackStage(stage)} disabled={running} style={{ padding: '10px 16px', borderRadius: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontWeight: 500, fontSize: '13px' }}>✏️ Feedback</button>
                      <button onClick={() => handleStageAction(stage, 'approve')} disabled={running} style={{ padding: '10px 20px', borderRadius: '6px', background: 'var(--accent-green)', color: 'white', fontWeight: 600, fontSize: '13px' }}>✓ Approve</button>
                    </div>
                  )}

                  {feedbackStage === stage && (
                    <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                      <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="What would you like changed?" rows={3} style={{ width: '100%', marginBottom: '12px' }} />
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setFeedbackStage(null); setFeedback(''); }} style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>Cancel</button>
                        <button onClick={() => handleStageAction(stage, 'reject', feedback)} disabled={!feedback.trim() || running} style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--accent-purple)', color: 'white', fontWeight: 600 }}>Regenerate</button>
                      </div>
                    </div>
                  )}

                  {output && (
                    isFullBrief
                      ? <VideoBriefDisplay brief={output as VideoBrief} />
                      : <div style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '13px', maxHeight: '400px', overflow: 'auto' }}>
                          <pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: 'var(--accent-green)' }}>{JSON.stringify(output, null, 2)}</pre>
                        </div>
                  )}

                  {output && (
                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      {isFullBrief && status === 'approved' && (
                        <button onClick={saveBrief} disabled={savingBrief} style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--accent-green)', color: 'white', fontWeight: 600, fontSize: '13px' }}>
                          {savingBrief ? 'Saving...' : '💾 Save Brief'}
                        </button>
                      )}
                      <button onClick={() => handleStageAction(stage, 'rerun')} disabled={running} style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '13px' }}>🔄 Regenerate</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VideoBriefDisplay({ brief }: { brief: VideoBrief }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Theme */}
      <div style={{ background: 'linear-gradient(135deg, var(--accent-purple-dim), var(--accent-blue-dim))', borderRadius: '12px', padding: '20px', border: '1px solid var(--accent-purple)' }}>
        <div style={{ fontSize: '12px', color: 'var(--accent-purple)', fontWeight: 600, marginBottom: '8px' }}>VIDEO THEME</div>
        <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>{brief.theme.title}</h3>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '12px' }}>&ldquo;{brief.theme.hook}&rdquo;</p>
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', flexWrap: 'wrap' }}>
          <span><span style={{ color: 'var(--text-muted)' }}>Length:</span> <span style={{ color: 'var(--accent-green)' }}>{brief.theme.videoLength}</span></span>
          <span><span style={{ color: 'var(--text-muted)' }}>For:</span> {brief.theme.targetViewer}</span>
        </div>
      </div>

      {/* What We're Building */}
      <div>
        <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>🛠️ What We&apos;re Building</h4>
        <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>{brief.tutorial.toolName}</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>{brief.tutorial.whatItDoes}</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {brief.tutorial.toolsUsed.map((tool, i) => (
              <span key={i} style={{ padding: '4px 10px', background: 'var(--bg-secondary)', borderRadius: '12px', fontSize: '12px' }}>{tool}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Full Script */}
      <div>
        <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>📜 Full Script</h4>
        <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', overflow: 'hidden' }}>
          {brief.script.map((line, i) => (
            <div key={i} style={{ padding: '12px 16px', borderBottom: i < brief.script.length - 1 ? '1px solid var(--border)' : 'none', display: 'grid', gridTemplateColumns: '70px 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)' }}>{line.timestamp}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{line.type}</div>
              </div>
              <div>
                <p style={{ fontSize: '14px', lineHeight: '1.5', marginBottom: '6px' }}>{line.script}</p>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📺 {line.onScreen}</div>
                {line.buildStep && <div style={{ fontSize: '12px', color: 'var(--accent-green)', marginTop: '4px' }}>🔧 {line.buildStep}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Build Steps */}
      <div>
        <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>📋 Build Instructions</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {brief.buildSteps.map((step) => (
            <div key={step.stepNumber} style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--accent-purple)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>{step.stepNumber}</div>
                <div style={{ fontWeight: 600 }}>{step.title}</div>
              </div>
              <div style={{ marginLeft: '38px', fontSize: '14px' }}>
                <p style={{ marginBottom: '8px' }}>{step.action}</p>
                <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>{step.exactInstructions}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>💬 {step.whatToSay}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assets */}
      <div>
        <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>🎨 Assets</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>THUMBNAIL</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent-yellow)', marginBottom: '4px' }}>&ldquo;{brief.assets.thumbnail.text}&rdquo;</div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{brief.assets.thumbnail.visualDescription}</p>
          </div>
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>SCREEN RECORDINGS</div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px' }}>
              {brief.assets.screenRecordings.map((item, i) => <li key={i} style={{ marginBottom: '4px' }}>{item}</li>)}
            </ul>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div>
        <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>📣 CTA</h4>
        <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>SAY THIS</div>
            <p style={{ fontSize: '14px' }}>&ldquo;{brief.cta.verbalCta}&rdquo;</p>
          </div>
          {brief.cta.leadMagnet && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>LEAD MAGNET</div>
              <p style={{ fontSize: '14px', color: 'var(--accent-green)' }}>{brief.cta.leadMagnet}</p>
            </div>
          )}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>DESCRIPTION</div>
            <pre style={{ fontSize: '12px', background: 'var(--bg-secondary)', padding: '10px', borderRadius: '6px', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>{brief.cta.descriptionText}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { WorkflowState } from '@/lib/workflow/types';
import { STAGE_LABELS, STAGES } from '@/lib/workflow/types';

export default function DashboardPage() {
  const [workflows, setWorkflows] = useState<WorkflowState[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const res = await fetch('/api/workflows');
      const data = await res.json();
      setWorkflows(data);
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: WorkflowState['status']) => {
    switch (status) {
      case 'completed':
        return 'var(--accent-green)';
      case 'running':
        return 'var(--accent-blue)';
      case 'paused':
        return 'var(--accent-yellow)';
      case 'failed':
        return 'var(--accent-red)';
      default:
        return 'var(--text-muted)';
    }
  };

  const getCompletedStages = (workflow: WorkflowState) => {
    return STAGES.filter((s) => workflow.stages[s].status === 'approved').length;
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '48px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 700,
              marginBottom: '8px',
              background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Video Workflows
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            AI-powered YouTube video production pipeline
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(168, 85, 247, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          + New Workflow
        </button>
      </div>

      {/* Workflow List */}
      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            color: 'var(--text-muted)',
          }}
        >
          <div
            className="animate-spin"
            style={{
              width: '24px',
              height: '24px',
              border: '2px solid var(--border)',
              borderTopColor: 'var(--accent-purple)',
              borderRadius: '50%',
              marginRight: '12px',
            }}
          />
          Loading workflows...
        </div>
      ) : workflows.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            border: '1px dashed var(--border)',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '8px',
            }}
          >
            No workflows yet
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Create your first video production workflow to get started
          </p>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              fontWeight: 500,
            }}
          >
            Create Workflow
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: '16px',
          }}
        >
          {workflows.map((workflow) => (
            <Link key={workflow.id} href={`/workflows/${workflow.id}`}>
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, transform 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: '18px',
                        fontWeight: 600,
                        marginBottom: '4px',
                      }}
                    >
                      {workflow.name}
                    </h3>
                    <p
                      style={{
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                      }}
                    >
                      {workflow.input.niche}
                    </p>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: getStatusColor(workflow.status),
                      }}
                    />
                    {workflow.status}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                    }}
                  >
                    <span>Progress</span>
                    <span>
                      {getCompletedStages(workflow)} / {STAGES.length} stages
                    </span>
                  </div>
                  <div
                    style={{
                      height: '4px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${(getCompletedStages(workflow) / STAGES.length) * 100}%`,
                        background:
                          'linear-gradient(90deg, var(--accent-purple), var(--accent-blue))',
                        borderRadius: '2px',
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                </div>

                {/* Current stage */}
                {workflow.currentStage && (
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {workflow.status === 'paused' ? '⏸️ Waiting for approval: ' : '▶️ Running: '}
                    <span style={{ color: 'var(--accent-purple)' }}>
                      {STAGE_LABELS[workflow.currentStage]}
                    </span>
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateWorkflowModal
          onClose={() => setShowCreate(false)}
          onCreated={(workflow) => {
            setWorkflows([workflow, ...workflows]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

function CreateWorkflowModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (workflow: WorkflowState) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: 'Q1 Lead Gen Video',
    niche: 'AI automation for agencies',
    targetAudience: 'Agency owners doing $10-50k/mo who want to scale without hiring, skeptical of AI but curious',
    businessGoal: 'Done-for-you AI workflow builds ($3-5k projects)',
    styleNotes: 'Direct, no-BS, show don\'t tell, like teaching a friend not selling to a stranger',
    controlLevel: 'full-control' as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          controlLevel: form.controlLevel,
          input: {
            niche: form.niche,
            targetAudience: form.targetAudience,
            businessGoal: form.businessGoal,
            styleNotes: form.styleNotes || undefined,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to create workflow');

      const workflow = await res.json();
      onCreated(workflow);
    } catch (error) {
      console.error('Failed to create workflow:', error);
      alert('Failed to create workflow');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="animate-fadeIn"
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>
            New Video Workflow
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Tell us about your video and target audience
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '8px',
                }}
              >
                Workflow Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Q1 Lead Gen Video"
                required
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '8px',
                }}
              >
                Your Niche
              </label>
              <input
                type="text"
                value={form.niche}
                onChange={(e) => setForm({ ...form, niche: e.target.value })}
                placeholder="e.g., AI automation for agencies"
                required
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '8px',
                }}
              >
                Target Audience (who becomes a customer?)
              </label>
              <textarea
                value={form.targetAudience}
                onChange={(e) =>
                  setForm({ ...form, targetAudience: e.target.value })
                }
                placeholder="e.g., Agency owners doing $10-50k/mo who want to scale without hiring"
                required
                rows={2}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '8px',
                }}
              >
                What Do You Sell? (business goal)
              </label>
              <textarea
                value={form.businessGoal}
                onChange={(e) =>
                  setForm({ ...form, businessGoal: e.target.value })
                }
                placeholder="e.g., Done-for-you AI workflow builds ($3-5k projects)"
                required
                rows={2}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '8px',
                }}
              >
                Style Notes (optional)
              </label>
              <textarea
                value={form.styleNotes}
                onChange={(e) =>
                  setForm({ ...form, styleNotes: e.target.value })
                }
                placeholder="e.g., Direct, no-BS, show don't tell"
                rows={2}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '8px',
                }}
              >
                Control Level
              </label>
              <select
                value={form.controlLevel}
                onChange={(e) =>
                  setForm({
                    ...form,
                    controlLevel: e.target.value as typeof form.controlLevel,
                  })
                }
                style={{ width: '100%' }}
              >
                <option value="autopilot">
                  🟢 Autopilot - Review at the end only
                </option>
                <option value="checkpoints">
                  🟡 Checkpoints - Pause at key decisions
                </option>
                <option value="full-control">
                  🔴 Full Control - Approve every stage
                </option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '32px',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                background:
                  'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
                color: 'white',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {loading && (
                <div
                  className="animate-spin"
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                  }}
                />
              )}
              Create Workflow
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


'use client';

import { useState } from 'react';
import type { VideoBrief } from '@/lib/ai/agents/video-brief-generator';
import type { SimpleWorkflow } from '@/lib/workflow/simple-engine';

export default function BriefPage() {
  const [workflow, setWorkflow] = useState<SimpleWorkflow | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const [form, setForm] = useState({
    name: 'AI Tutorial Video',
    niche: 'AI automation for agencies',
    targetAudience: 'Agency owners doing $10-50k/mo who want to scale without hiring',
    businessGoal: 'Done-for-you AI workflow builds ($3-5k projects)',
    styleNotes: 'Direct, no-BS, show don\'t tell',
  });

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    try {
      // Create workflow if we don't have one
      let wf = workflow;
      if (!wf) {
        const createRes = await fetch('/api/briefs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            input: {
              niche: form.niche,
              targetAudience: form.targetAudience,
              businessGoal: form.businessGoal,
              styleNotes: form.styleNotes,
            },
          }),
        });
        wf = await createRes.json();
        setWorkflow(wf);
      }

      // Generate the brief
      const genRes = await fetch(`/api/briefs/${wf!.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: showFeedback ? feedback : undefined }),
      });
      const result = await genRes.json();

      if (result.success) {
        setWorkflow(result.workflow);
        setShowFeedback(false);
        setFeedback('');
      } else {
        setError(result.error || 'Failed to generate');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  };

  const brief = workflow?.brief;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div
        style={{
          padding: '24px 32px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
        }}
      >
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Video Brief Generator
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Get a complete, ready-to-record video brief in one click
        </p>
      </div>

      <div style={{ display: 'flex', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Left Panel - Input */}
        <div
          style={{
            width: '320px',
            padding: '24px',
            borderRight: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Video Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Your Niche
              </label>
              <input
                type="text"
                value={form.niche}
                onChange={(e) => setForm({ ...form, niche: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Target Audience
              </label>
              <textarea
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                rows={2}
                style={{ width: '100%', padding: '10px 12px', fontSize: '14px', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                What You Sell
              </label>
              <textarea
                value={form.businessGoal}
                onChange={(e) => setForm({ ...form, businessGoal: e.target.value })}
                rows={2}
                style={{ width: '100%', padding: '10px 12px', fontSize: '14px', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Style Notes
              </label>
              <input
                type="text"
                value={form.styleNotes}
                onChange={(e) => setForm({ ...form, styleNotes: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', fontSize: '14px' }}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
                color: 'white',
                fontWeight: 600,
                fontSize: '15px',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {generating && (
                <div
                  className="animate-spin"
                  style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                  }}
                />
              )}
              {generating ? 'Generating...' : brief ? '🔄 Regenerate' : '✨ Generate Brief'}
            </button>

            {brief && (
              <button
                onClick={() => setShowFeedback(!showFeedback)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                }}
              >
                ✏️ Revise with Feedback
              </button>
            )}

            {showFeedback && (
              <div>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="What would you like changed?"
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', fontSize: '14px', resize: 'vertical' }}
                />
                <button
                  onClick={handleGenerate}
                  disabled={generating || !feedback.trim()}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    background: 'var(--accent-purple)',
                    color: 'white',
                    fontWeight: 500,
                    fontSize: '13px',
                    marginTop: '8px',
                  }}
                >
                  Apply Feedback
                </button>
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: '12px',
                  background: 'var(--accent-red-dim)',
                  border: '1px solid var(--accent-red)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              >
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Brief Output */}
        <div style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
          {!brief && !generating && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '60vh',
                color: 'var(--text-muted)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎬</div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                Ready to create your video brief
              </h2>
              <p>Fill in the details on the left and click Generate</p>
            </div>
          )}

          {generating && !brief && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '60vh',
                color: 'var(--text-muted)',
              }}
            >
              <div
                className="animate-spin"
                style={{
                  width: '48px',
                  height: '48px',
                  border: '3px solid var(--border)',
                  borderTopColor: 'var(--accent-purple)',
                  borderRadius: '50%',
                  marginBottom: '16px',
                }}
              />
              <p>Generating your video brief...</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>This usually takes 15-30 seconds</p>
            </div>
          )}

          {brief && <BriefDisplay brief={brief} />}
        </div>
      </div>
    </div>
  );
}

function BriefDisplay({ brief }: { brief: VideoBrief }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Theme Section */}
      <section>
        <div
          style={{
            background: 'linear-gradient(135deg, var(--accent-purple-dim), var(--accent-blue-dim))',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid var(--accent-purple)',
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--accent-purple)', fontWeight: 600, marginBottom: '8px' }}>
            VIDEO THEME
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '12px' }}>{brief.theme.title}</h2>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            &ldquo;{brief.theme.hook}&rdquo;
          </p>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '14px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Length:</span>{' '}
              <span style={{ color: 'var(--accent-green)' }}>{brief.theme.videoLength}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>For:</span>{' '}
              {brief.theme.targetViewer}
            </div>
          </div>
        </div>
      </section>

      {/* What We're Building */}
      <section>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🛠️ What We&apos;re Building
        </h3>
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>{brief.tutorial.toolName}</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{brief.tutorial.whatItDoes}</p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {brief.tutorial.toolsUsed.map((tool, i) => (
              <span
                key={i}
                style={{
                  padding: '6px 12px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '20px',
                  fontSize: '13px',
                }}
              >
                {tool}
              </span>
            ))}
            <span
              style={{
                padding: '6px 12px',
                background: brief.tutorial.difficultyLevel === 'beginner' ? 'var(--accent-green-dim)' : 'var(--accent-yellow-dim)',
                color: brief.tutorial.difficultyLevel === 'beginner' ? 'var(--accent-green)' : 'var(--accent-yellow)',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {brief.tutorial.difficultyLevel}
            </span>
          </div>
        </div>
      </section>

      {/* Script */}
      <section>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📜 Full Script
        </h3>
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            overflow: 'hidden',
          }}
        >
          {brief.script.map((line, i) => (
            <div
              key={i}
              style={{
                padding: '16px 20px',
                borderBottom: i < brief.script.length - 1 ? '1px solid var(--border)' : 'none',
                display: 'grid',
                gridTemplateColumns: '80px 1fr',
                gap: '16px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--accent-purple)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {line.timestamp}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    marginTop: '4px',
                  }}
                >
                  {line.type}
                </div>
              </div>
              <div>
                <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '8px' }}>{line.script}</p>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--accent-blue)' }}>📺</span> {line.onScreen}
                </div>
                {line.buildStep && (
                  <div style={{ fontSize: '13px', color: 'var(--accent-green)', marginTop: '4px' }}>
                    <span>🔧</span> {line.buildStep}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Build Steps */}
      <section>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📋 Build Instructions
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {brief.buildSteps.map((step) => (
            <div
              key={step.stepNumber}
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'var(--accent-purple)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '14px',
                  }}
                >
                  {step.stepNumber}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>{step.title}</div>
              </div>
              <div style={{ marginLeft: '44px' }}>
                <p style={{ marginBottom: '8px' }}>{step.action}</p>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--accent-blue)' }}>📺 Show:</span> {step.showOnScreen}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--accent-yellow)' }}>💬 Say:</span> {step.talkingPoint}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Assets */}
      <section>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🎨 Assets Needed
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Thumbnail */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>THUMBNAIL</div>
            <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--accent-yellow)' }}>
              &ldquo;{brief.assets.thumbnail.text}&rdquo;
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{brief.assets.thumbnail.visualDescription}</p>
          </div>

          {/* Screen Recordings */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>SCREEN RECORDINGS</div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
              {brief.assets.screenRecordings.map((item, i) => (
                <li key={i} style={{ marginBottom: '6px' }}>{item}</li>
              ))}
            </ul>
          </div>

          {/* B-Roll */}
          {brief.assets.bRoll.length > 0 && (
            <div
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>B-ROLL</div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
                {brief.assets.bRoll.map((item, i) => (
                  <li key={i} style={{ marginBottom: '6px' }}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Graphics */}
          {brief.assets.graphics.length > 0 && (
            <div
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>GRAPHICS</div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
                {brief.assets.graphics.map((item, i) => (
                  <li key={i} style={{ marginBottom: '6px' }}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📣 Call to Action
        </h3>
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>VERBAL CTA</div>
            <p style={{ fontSize: '15px' }}>&ldquo;{brief.cta.verbalCta}&rdquo;</p>
          </div>
          {brief.cta.leadMagnet && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>LEAD MAGNET</div>
              <p style={{ fontSize: '15px', color: 'var(--accent-green)' }}>{brief.cta.leadMagnet}</p>
            </div>
          )}
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>DESCRIPTION</div>
            <pre
              style={{
                fontSize: '13px',
                background: 'var(--bg-tertiary)',
                padding: '12px',
                borderRadius: '8px',
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {brief.cta.description}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}


import React from 'react';
import { ShieldAlert, CheckCircle, HelpCircle, Mail, ExternalLink, Calendar, Award } from 'lucide-react';

export default function DetailPanel({ candidate }) {
  if (!candidate) {
    return (
      <div className="panel fade-in" style={{ minHeight: '300px', display: 'flex', justifyContent: 'center' }}>
        <div className="empty-state">
          <HelpCircle size={36} style={{ color: 'var(--primary-sage)', opacity: 0.5 }} />
          <div className="empty-state-title">Select a Candidate</div>
          <p style={{ fontSize: '0.875rem' }}>Click any candidate row in the table to inspect detailed signals and AI scoring rationales.</p>
        </div>
      </div>
    );
  }

  const getRecommendationStyle = (recText) => {
    if (recText === 'Highly Recommended') return 'highly-recommended';
    if (recText === 'Recommended') return 'recommended';
    if (recText === 'Consider with Reserve') return 'reserve';
    return 'honeypot';
  };

  return (
    <div className="panel fade-in">
      <div className="detail-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 className="detail-name">{candidate.name}</h2>
            <div className="detail-sub">
              <span>{candidate.title}</span>
              <span>•</span>
              <span>{candidate.candidate_id}</span>
            </div>
          </div>
          <span className={`rec-pill ${getRecommendationStyle(candidate.rec_text)}`}>
            {candidate.rec_text}
          </span>
        </div>
      </div>

      {/* Sub-scores details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
          Detailed Score Layers
        </h3>

        {[
          { label: 'Semantic JD Alignment', val: candidate.sub_scores.semantic },
          { label: 'Canonical Skills Match', val: candidate.sub_scores.skills },
          { label: 'Career History & Growth', val: candidate.sub_scores.career },
          { label: 'Recruitment Signal Risk', val: candidate.sub_scores.signals }
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ fontWeight: 500 }}>{item.label}</span>
              <span style={{ fontWeight: 700, color: 'var(--primary-sage)' }}>{(item.val * 100).toFixed(0)}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--border-light)', borderRadius: '999px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${item.val * 100}%`, 
                  height: '100%', 
                  background: candidate.is_honeypot ? 'var(--accent-terracotta)' : 'var(--primary-sage)',
                  borderRadius: '999px',
                  transition: 'width 0.5s ease-out'
                }} 
              />
            </div>
          </div>
        ))}
      </div>

      {/* Reasoning */}
      {candidate.reasoning && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
            AI Matching Rationale
          </h3>
          <div className="reasoning-box">
            "{candidate.reasoning}"
          </div>
        </div>
      )}

      {/* Strengths & Concerns */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
          Key Signal Audit
        </h3>

        <div className="bullet-points">
          {candidate.strengths && candidate.strengths.map((str, idx) => str && (
            <div key={`str-${idx}`} className="bullet-item">
              <CheckCircle size={14} className="bullet-icon success" />
              <span>{str}</span>
            </div>
          ))}

          {candidate.concerns && candidate.concerns.map((con, idx) => con && (
            <div key={`con-${idx}`} className="bullet-item">
              <ShieldAlert size={14} className="bullet-icon warning" />
              <span style={{ color: 'var(--accent-terracotta)', fontWeight: 500 }}>{con}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Metadata summary */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '0.75rem', 
        background: 'var(--border-light)', 
        padding: '0.75rem', 
        borderRadius: 'var(--radius-md)',
        fontSize: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Calendar size={14} style={{ color: 'var(--text-secondary)' }} />
          <span>Notice: <strong>{candidate.notice_period_days} days</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Award size={14} style={{ color: 'var(--text-secondary)' }} />
          <span>Skills Matched: <strong>{candidate.skills_matched?.length || 0}</strong></span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button 
          className="btn-primary" 
          style={{ flex: 1, background: 'var(--border-color)', color: 'var(--text-primary)' }}
          onClick={() => alert(`Emailing Candidate anonymized profile details to recruitment manager.`)}
        >
          <Mail size={16} /> Share Profile
        </button>
        <button 
          className="btn-primary" 
          style={{ flex: 1 }}
          onClick={() => alert(`Redirecting to Candidate full evaluation dossier.`)}
        >
          <ExternalLink size={16} /> Full Dossier
        </button>
      </div>
    </div>
  );
}

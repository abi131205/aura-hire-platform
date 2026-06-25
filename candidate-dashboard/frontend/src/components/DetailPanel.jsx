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

  const getNoticeTag = (days) => {
    const daysInt = parseInt(days, 10);
    if (daysInt <= 30) {
      return (
        <span style={{ 
          background: '#E8F5E9', 
          color: '#2E7D32', 
          padding: '2px 8px', 
          borderRadius: '4px', 
          fontWeight: 600, 
          fontSize: '0.7rem',
          marginLeft: '0.25rem',
          display: 'inline-block'
        }}>
          Immediate
        </span>
      );
    } else if (daysInt <= 60) {
      return (
        <span style={{ 
          background: '#FFF3E0', 
          color: '#EF6C00', 
          padding: '2px 8px', 
          borderRadius: '4px', 
          fontWeight: 600, 
          fontSize: '0.7rem',
          marginLeft: '0.25rem',
          display: 'inline-block'
        }}>
          60 days
        </span>
      );
    } else {
      return (
        <span style={{ 
          background: '#FFEBEE', 
          color: '#C62828', 
          padding: '2px 8px', 
          borderRadius: '4px', 
          fontWeight: 600, 
          fontSize: '0.7rem',
          marginLeft: '0.25rem',
          display: 'inline-block'
        }}>
          Long notice
        </span>
      );
    }
  };

  return (
    <div className="panel fade-in">
      <div className="detail-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 className="detail-name">{candidate.profile?.anonymized_name || candidate.name}</h2>
            <div className="detail-sub">
              <span>{candidate.title}</span>
              <span>•</span>
              <span style={{ fontFamily: 'monospace' }}>{candidate.candidate_id}</span>
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
          { label: 'Semantic JD Alignment', val: candidate.sub_scores.semantic, color: '#6B8F71' },
          { label: 'Canonical Skills Match', val: candidate.sub_scores.skills, color: '#C2A878' },
          { label: 'Career History & Growth', val: candidate.sub_scores.career, color: '#7B6B3D' },
          { label: 'Recruitment Signal Risk', val: candidate.sub_scores.signals, color: '#C96C4A' }
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ fontWeight: 500 }}>{item.label}</span>
              <span style={{ fontWeight: 700, color: item.color }}>{(item.val * 100).toFixed(0)}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--border-light)', borderRadius: '999px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${item.val * 100}%`, 
                  height: '100%', 
                  background: candidate.is_honeypot ? 'var(--accent-terracotta)' : item.color,
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

          {candidate.redrob_signals?.expected_salary_range_inr_lpa && (
            <div className="bullet-item">
              <CheckCircle size={14} className="bullet-icon success" />
              <span>Expected Salary: <strong>₹{candidate.redrob_signals.expected_salary_range_inr_lpa[0]}L – ₹{candidate.redrob_signals.expected_salary_range_inr_lpa[1]}L per annum</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Education Section */}
      {candidate.education && candidate.education.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
            Education
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
            {candidate.education.map((edu, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{edu.institution}</strong>
                  {edu.tier === 'tier_1' && (
                    <span style={{ 
                      background: '#FEF3C7', 
                      color: '#D97706', 
                      padding: '1px 6px', 
                      borderRadius: '4px', 
                      fontWeight: 600, 
                      fontSize: '0.65rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}>
                      🏆 Tier 1 Institution
                    </span>
                  )}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  {edu.degree} in {edu.field_of_study} {edu.end_year ? `(${edu.start_year} - ${edu.end_year})` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
          <Calendar size={14} style={{ color: 'var(--text-secondary)' }} />
          <span>Notice: {getNoticeTag(candidate.notice_period_days)}</span>
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

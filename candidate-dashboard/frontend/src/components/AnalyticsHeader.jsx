import React from 'react';
import { Users, Award, TrendingUp, ShieldCheck, Briefcase } from 'lucide-react';

export default function AnalyticsHeader({ analytics }) {
  const data = analytics || {
    total_candidates: 0,
    qualified_candidates: 0,
    avg_match_percentage: 0,
    ai_confidence_score: 94.5,
  };

  return (
    <div className="analytics-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="header-section">
        <div className="brand">
          <div className="brand-icon">
            <Briefcase size={28} />
          </div>
          <div>
            <h1 className="brand-title">AuraHire</h1>
            <div className="brand-subtitle">AI-Powered Recruiter Dashboard // Enterprise Candidate Scoring</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="rec-pill highly-recommended" style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}>
            <ShieldCheck size={14} /> System Online
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            v1.2.0 (Sage Scorer)
          </span>
        </div>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Candidates</span>
            <span className="stat-value">{data.total_candidates}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Award size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Qualified Tier (&gt;= 0.65)</span>
            <span className="stat-value">{data.qualified_candidates}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon accent">
            <TrendingUp size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Top Match Score</span>
            <span className="stat-value">
              {data.top_match_score ? `${(data.top_match_score * 100).toFixed(1)}%` : '0.0%'}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <ShieldCheck size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Verification Confidence</span>
            <span className="stat-value">{data.ai_confidence_score}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

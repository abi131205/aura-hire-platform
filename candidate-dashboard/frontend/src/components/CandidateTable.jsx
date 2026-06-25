import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, ShieldAlert, Award, Star } from 'lucide-react';

export default function CandidateTable({ 
  candidates, 
  honeypots, 
  selectedCandidate, 
  onSelectCandidate,
  activeTab,
  setActiveTab
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const listToShow = activeTab === 'shortlist' ? candidates : honeypots;

  const filteredList = listToShow.filter(c => {
    const query = searchQuery.toLowerCase();
    const cidMatch = c.candidate_id.toLowerCase().includes(query);
    const titleMatch = c.title.toLowerCase().includes(query);
    const skillsMatch = c.skills && c.skills.some(s => s.toLowerCase().includes(query));
    return cidMatch || titleMatch || skillsMatch;
  });

  // Reset page when tab or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const totalPages = Math.ceil(filteredList.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedList = filteredList.slice(startIndex, endIndex);

  const getRecommendationStyle = (recText) => {
    if (recText === 'Highly Recommended') return 'highly-recommended';
    if (recText === 'Recommended') return 'recommended';
    if (recText === 'Consider with Reserve') return 'reserve';
    return 'honeypot';
  };

  const getRecIcon = (recText) => {
    if (recText === 'Highly Recommended') return <Star size={12} fill="currentColor" />;
    if (recText === 'Recommended') return <Award size={12} />;
    if (recText === 'Consider with Reserve') return <AlertTriangle size={12} />;
    return <ShieldAlert size={12} />;
  };

  return (
    <div className="panel fade-in" style={{ flexGrow: 1 }}>
      <div className="table-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 className="panel-title" style={{ margin: 0 }}>
            {activeTab === 'shortlist' ? 'Verified Shortlist' : 'Isolated Anomalies'}
          </h2>
          <div className="tabs">
            <button 
              type="button" 
              className={`tab ${activeTab === 'shortlist' ? 'active' : ''}`}
              onClick={() => setActiveTab('shortlist')}
            >
              Shortlist ({candidates.length})
            </button>
            <button 
              type="button" 
              className={`tab honeypots-tab ${activeTab === 'honeypots' ? 'active' : ''}`}
              onClick={() => setActiveTab('honeypots')}
              style={{ color: activeTab === 'honeypots' ? 'var(--accent-terracotta)' : 'var(--text-secondary)' }}
            >
              Flagged ({honeypots.length}) — Demo Set
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="chat-input"
            style={{ paddingLeft: '2.25rem', width: '240px', borderRadius: 'var(--radius-full)' }}
            placeholder="Search candidate ID, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="empty-state">
          <Star size={36} style={{ color: 'var(--primary-sage)', opacity: 0.5 }} />
          <div className="empty-state-title">No candidates scored yet</div>
          <p style={{ fontSize: '0.875rem' }}>
            Please upload a Job Description file or paste requirements in the left panel to trigger matching.
          </p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No search matches</div>
          <p style={{ fontSize: '0.875rem' }}>Try searching a different keyword or candidate ID.</p>
        </div>
      ) : (
        <div className="candidate-table-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Rank</th>
                <th>Candidate Profile</th>
                <th style={{ width: '100px' }}>Composite</th>
                <th>Score Breakdown</th>
                <th>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.map((c, index) => {
                const isSelected = selectedCandidate && selectedCandidate.candidate_id === c.candidate_id;
                const absoluteRank = startIndex + index + 1;
                return (
                  <tr 
                    key={c.candidate_id}
                    className={`candidate-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelectCandidate(c)}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--text-secondary)', paddingLeft: '1rem' }}>
                      #{absoluteRank}
                    </td>
                    <td>
                      <div className="candidate-name-cell">
                        <span className="candidate-name">{c.profile?.anonymized_name || c.name}</span>
                        <span className="candidate-id-mono" style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', margin: '2px 0' }}>{c.candidate_id}</span>
                        <span className="candidate-title">{c.title} • {c.yoe}y YOE</span>
                      </div>
                    </td>
                    <td>
                      <span className="score-badge">
                        {(c.score * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <div className="sub-scores-grid">
                        <div className="sub-score-item">
                          Sem: <span>{(c.sub_scores.semantic * 100).toFixed(0)}%</span>
                        </div>
                        <div className="sub-score-item">
                          Skil: <span>{(c.sub_scores.skills * 100).toFixed(0)}%</span>
                        </div>
                        <div className="sub-score-item">
                          Car: <span>{(c.sub_scores.career * 100).toFixed(0)}%</span>
                        </div>
                        <div className="sub-score-item">
                          Sign: <span>{(c.sub_scores.signals * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`rec-pill ${getRecommendationStyle(c.rec_text)}`}>
                        {getRecIcon(c.rec_text)}
                        {c.rec_text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginTop: '1.25rem', 
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)'
            }}>
              <div>
                Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(endIndex, filteredList.length)}</strong> of <strong>{filteredList.length}</strong> candidates
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="tab"
                  style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: 'var(--radius-sm)',
                    opacity: currentPage === 1 ? 0.4 : 1,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  &larr; Prev
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isActive = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`tab ${isActive ? 'active' : ''}`}
                      style={{
                        width: '28px',
                        height: '28px',
                        padding: 0,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        background: isActive ? 'var(--primary-sage)' : 'transparent',
                        color: isActive ? '#fff' : 'var(--text-secondary)',
                        border: isActive ? 'none' : '1px solid transparent',
                        cursor: 'pointer'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="tab"
                  style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: 'var(--radius-sm)',
                    opacity: currentPage === totalPages ? 0.4 : 1,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

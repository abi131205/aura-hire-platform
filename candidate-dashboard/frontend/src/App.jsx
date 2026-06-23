import React, { useState, useEffect } from 'react';
import AnalyticsHeader from './components/AnalyticsHeader';
import FileUploader from './components/FileUploader';
import CandidateTable from './components/CandidateTable';
import DetailPanel from './components/DetailPanel';
import CopilotPanel from './components/CopilotPanel';
import { 
  LayoutDashboard, 
  BookOpen, 
  ShieldAlert, 
  FileText, 
  Sliders, 
  ChevronRight, 
  Info, 
  ArrowUp, 
  Briefcase, 
  Cpu, 
  Sparkles, 
  CheckCircle,
  HelpCircle,
  Clock,
  Terminal
} from 'lucide-react';
import './App.css';

const getApiUrl = (path) => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const base = isLocal ? '' : 'https://aura-hire.onrender.com';
  return `${base}${path}`;
};

export default function App() {
  const [candidates, setCandidates] = useState([]);
  const [honeypots, setHoneypots] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [weights, setWeights] = useState({
    semantic: 0.30,
    skills: 0.25,
    career: 0.25,
    signals: 0.20
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('shortlist');
  const [activeSection, setActiveSection] = useState('overview');

  // Smooth scroll helper
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll spy to highlight active sidebar link
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['overview', 'dashboard-section', 'architecture', 'security', 'developer'];
      const scrollPos = window.scrollY + 200;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Triggers candidate analysis on new JD upload
  const handleRank = async ({ mode, file, jdText }) => {
    setIsLoading(true);
    setError(null);
    setSelectedCandidate(null);

    try {
      let response;
      if (mode === 'upload') {
        const formData = new FormData();
        formData.append('file', file);
        response = await fetch(getApiUrl('/api/rank'), {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch(getApiUrl('/api/rank'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jd_text: jdText }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to score candidates');
      }

      const data = await response.json();
      setCandidates(data.candidates);
      setHoneypots(data.honeypots);
      setAnalytics(data.analytics);
      setWeights(data.weights);
      
      // Auto-select top candidate
      if (data.candidates.length > 0) {
        setSelectedCandidate(data.candidates[0]);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamic weights adjustment
  const handleWeightChange = async (key, val) => {
    const newWeights = { ...weights, [key]: parseFloat(val) };
    setWeights(newWeights);

    try {
      const response = await fetch(getApiUrl('/api/rerank'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWeights),
      });

      if (!response.ok) return;

      const data = await response.json();
      setCandidates(data.candidates);
      setHoneypots(data.honeypots);
      setAnalytics(data.analytics);
      setWeights(data.weights);

      // Keep candidate selected but update its scores
      if (selectedCandidate) {
        const updated = [...data.candidates, ...data.honeypots].find(
          c => c.candidate_id === selectedCandidate.candidate_id
        );
        if (updated) {
          setSelectedCandidate(updated);
        }
      }
    } catch (err) {
      console.error('Failed to rerank:', err);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-cream)' }}>
      
      {/* 1. Left Sticky Sidebar Navigation */}
      <aside className="sidebar-nav">
        <div className="brand" style={{ padding: '0 0.5rem', marginBottom: '2rem' }}>
          <div className="brand-icon">
            <Briefcase size={22} />
          </div>
          <div>
            <h1 className="brand-title" style={{ fontSize: '1.35rem' }}>AuraHire</h1>
            <div className="brand-subtitle" style={{ fontSize: '0.7rem' }}>Enterprise AI Ranking</div>
          </div>
        </div>

        <nav className="nav-menu">
          <button 
            type="button" 
            className={`nav-link ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => scrollToSection('overview')}
          >
            <Cpu size={16} />
            <span>Platform Overview</span>
          </button>
          <button 
            type="button" 
            className={`nav-link ${activeSection === 'dashboard-section' ? 'active' : ''}`}
            onClick={() => scrollToSection('dashboard-section')}
          >
            <LayoutDashboard size={16} />
            <span>Interactive Scorer</span>
          </button>
          <button 
            type="button" 
            className={`nav-link ${activeSection === 'architecture' ? 'active' : ''}`}
            onClick={() => scrollToSection('architecture')}
          >
            <BookOpen size={16} />
            <span>Scoring Architecture</span>
          </button>
          <button 
            type="button" 
            className={`nav-link ${activeSection === 'security' ? 'active' : ''}`}
            onClick={() => scrollToSection('security')}
          >
            <ShieldAlert size={16} />
            <span>Security &amp; Fraud</span>
          </button>
          <button 
            type="button" 
            className={`nav-link ${activeSection === 'developer' ? 'active' : ''}`}
            onClick={() => scrollToSection('developer')}
          >
            <Terminal size={16} />
            <span>Developer Center</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="status-indicator">
            <div className={`status-dot ${candidates.length > 0 ? 'active' : 'idle'}`} />
            <span>
              {candidates.length > 0 ? 'Scorer Active' : 'Standby Mode'}
            </span>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            Sage Engine v1.2.0
          </span>
        </div>
      </aside>

      {/* 2. Main Content Container */}
      <main className="main-content-layout">
        
        {/* Section 1: Hero Overview */}
        <section id="overview" className="section-block">
          <div className="hero-section">
            <span className="section-tag">Platform Overview</span>
            <h1 className="hero-heading">Intellectual Talent Discovery, Quantified.</h1>
            <p className="hero-subtext">
              AuraHire is an enterprise candidate ranking engine built to evaluate talent pools at scale. By combining semantic matching, canonical skill alignments, career history growth, and recruitment signal audits, it ranks resumes in seconds with absolute mathematical precision.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ padding: '0.875rem 1.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.9375rem' }}
                onClick={() => scrollToSection('dashboard-section')}
              >
                Launch Scorer Console <ChevronRight size={16} />
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.875rem 1.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.9375rem' }}
                onClick={() => scrollToSection('architecture')}
              >
                Read Methodology
              </button>
            </div>
          </div>

          {/* Intro highlight cards */}
          <div className="card-grid">
            <div className="landing-card">
              <div className="landing-card-icon"><Cpu size={20} /></div>
              <h3 className="landing-card-title">Dual-Stage Retrieval</h3>
              <p className="landing-card-desc">Processes 100,000 profiles using cheap filters in 2 seconds, then runs SentenceTransformer vectors only on the top 10,000, achieving 100% mathematical ranking coverage in minutes.</p>
            </div>
            <div className="landing-card">
              <div className="landing-card-icon"><Sparkles size={20} /></div>
              <h3 className="landing-card-title">Quad-Layer Scoring</h3>
              <p className="landing-card-desc">Fuses semantic requirements similarity, expert skills overlap, promotion trajectory stability, and recruitment timeline risk indicators into a normalized matching score.</p>
            </div>
            <div className="landing-card">
              <div className="landing-card-icon"><ShieldAlert size={20} /></div>
              <h3 className="landing-card-title">Anti-Honeypot Shield</h3>
              <p className="landing-card-desc">Instantly identifies, flags, and isolates malicious candidate accounts demonstrating fake zero-duration skills, overlapping jobs, or anomalous employment timelines.</p>
            </div>
          </div>
        </section>

        {/* Section 2: Interactive Scorer Dashboard */}
        <section id="dashboard-section" className="section-block">
          <span className="section-tag">Active Scorer Panel</span>
          <h2 className="section-heading" style={{ marginBottom: '0.5rem' }}>Interactive Candidate Scorer</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem', maxWidth: '800px' }}>
            Upload a job description or paste requirements text to score and rank candidates. Adjust weight layers in real-time to change matching outcomes immediately.
          </p>

          {/* Conditional Loader Layout */}
          {candidates.length === 0 ? (
            <div className="dashboard-placeholder-row">
              {/* Uploader Card */}
              <div style={{ flex: '0 0 350px' }}>
                <FileUploader onRank={handleRank} isLoading={isLoading} />
              </div>

              {/* Informational Welcome Card */}
              <div className="panel placeholder-info-card" style={{ flexGrow: 1, minHeight: '300px' }}>
                <div className="empty-state">
                  <div style={{ background: 'var(--primary-sage-light)', color: 'var(--primary-sage)', padding: '1rem', borderRadius: 'var(--radius-full)', marginBottom: '0.5rem' }}>
                    <LayoutDashboard size={32} />
                  </div>
                  <div className="empty-state-title" style={{ fontSize: '1.25rem' }}>Scorer Standby - Ready for Job Description</div>
                  <p style={{ fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto', color: 'var(--text-secondary)' }}>
                    AuraHire is currently in standby mode. Once you upload a job description `.docx` file or paste text requirements on the left, the scoring algorithms will run.
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1.5rem', width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Step 1</span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Upload JD</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Step 2</span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Embed &amp; Rank</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Step 3</span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Tune &amp; Refine</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="fade-in">
              
              {/* Dynamic Stats Header */}
              <AnalyticsHeader analytics={analytics} />

              {/* Scorer Grid */}
              <div className="dashboard-grid">
                
                {/* Col 1: Uploader and Weights Tuning */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <FileUploader onRank={handleRank} isLoading={isLoading} />

                  <div className="panel">
                    <div className="panel-title">
                      <Sliders size={18} style={{ color: 'var(--primary-sage)' }} />
                      <span>Weight Tuning</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-0.5rem' }}>
                      Tune weight categories to instantly re-rank the candidate database.
                    </p>
                    <div className="weight-sliders">
                      {[
                        { key: 'semantic', label: 'Semantic JD Fit', desc: 'Vector similarity to JD text' },
                        { key: 'skills', label: 'Canonical Skills', desc: 'Expert skill match overlap' },
                        { key: 'career', label: 'Career Trajectory', desc: 'Growth, tenure & stability' },
                        { key: 'signals', label: 'Risk Analysis', desc: 'Notice period & safety audit' }
                      ].map(item => (
                        <div key={item.key} className="slider-group">
                          <div className="slider-header">
                            <div className="slider-label" title={item.desc}>
                              {item.label}
                              <Info size={12} style={{ opacity: 0.5, cursor: 'help' }} />
                            </div>
                            <span className="slider-value">{(weights[item.key] * 100).toFixed(0)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1.0"
                            step="0.05"
                            className="slider-control active"
                            value={weights[item.key]}
                            onChange={(e) => handleWeightChange(item.key, e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--border-light)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginTop: '0.5rem' }}>
                      <Sparkles size={14} style={{ color: 'var(--primary-sage)', flexShrink: 0, marginTop: '0.1rem' }} />
                      <span>Weights normalize automatically to 100% upon modification.</span>
                    </div>
                  </div>
                </div>

                {/* Col 2: Tables list */}
                <CandidateTable 
                  candidates={candidates} 
                  honeypots={honeypots}
                  selectedCandidate={selectedCandidate} 
                  onSelectCandidate={setSelectedCandidate}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />

                {/* Col 3: Inspector Panel & Copilot Chat */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <DetailPanel candidate={selectedCandidate} />
                  <CopilotPanel />
                </div>

              </div>
            </div>
          )}
        </section>

        {/* Section 3: Scoring Architecture Docs */}
        <section id="architecture" className="section-block">
          <span className="section-tag">Platform Methodology</span>
          <h2 className="section-heading">Integrated Scoring Architecture</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem', maxWidth: '800px' }}>
            AuraHire scores candidates by fusing four independent matching dimensions. This guarantees that evaluated profiles have both high technical relevance and low recruitment risk.
          </p>

          <div className="doc-grid">
            <div className="landing-card doc-card">
              <span className="doc-card-num">L1</span>
              <h3 className="landing-card-title">Semantic JD Fit</h3>
              <div className="doc-card-badge">Weight: 30%</div>
              <p className="landing-card-desc">
                Calculates the vector cosine similarity between the Job Description requirements and the candidate's experience history using a precomputed all-MiniLM-L6-v2 embedding model. Resolves conceptual similarities beyond simple keyword matching.
              </p>
            </div>
            
            <div className="landing-card doc-card">
              <span className="doc-card-num">L2</span>
              <h3 className="landing-card-title">Canonical Skills Match</h3>
              <div className="doc-card-badge">Weight: 25%</div>
              <p className="landing-card-desc">
                Extracts, normalizes, and maps skill keywords in candidate records against a standardized dictionary of verified canonical skills. Solves vocabulary discrepancies (e.g. mapping "Vector database" to "FAISS").
              </p>
            </div>

            <div className="landing-card doc-card">
              <span className="doc-card-num">L3</span>
              <h3 className="landing-card-title">Career History &amp; Growth</h3>
              <div className="doc-card-badge">Weight: 25%</div>
              <p className="landing-card-desc">
                Analyzes historical career progression, calculating metrics like promotion frequency, job tenure stability, and experience durations. Applies penalties for short tenures and candidates originating from high-churn IT service consulting firms.
              </p>
            </div>

            <div className="landing-card doc-card">
              <span className="doc-card-num">L4</span>
              <h3 className="landing-card-title">Recruitment Signal Risk</h3>
              <div className="doc-card-badge">Weight: 20%</div>
              <p className="landing-card-desc">
                Checks notice periods and performs profile validation. Identifies fraudulent anomalies, impossible overlapping dates, or empty skill durations. Candidates with anomalies are isolated as honeypots.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Security & Honeypot details */}
        <section id="security" className="section-block">
          <span className="section-tag">Security &amp; Compliance</span>
          <h2 className="section-heading">Anti-Fraud Isolation Framework</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2.5rem', maxWidth: '800px' }}>
            To protect recruitment managers from spam and fake applicant data, AuraHire executes automated compliance audits on every candidate profile, isolating anomalous profiles into the Honeypot Directory.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
            <div className="panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={18} style={{ color: 'var(--accent-terracotta)' }} />
                Anomalous Indicators Audited
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div className="bullet-icon warning" style={{ marginTop: '0.2rem' }}><Clock size={16} /></div>
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Impossible Employment Overlaps</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Identifying profiles listed as working full-time at multiple concurrent employers with conflicting dates.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div className="bullet-icon warning" style={{ marginTop: '0.2rem' }}><Clock size={16} /></div>
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Zero-Duration Skills Listing</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Profiles claiming expert mastery of key technical skills but listing zero months of practical usage.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div className="bullet-icon warning" style={{ marginTop: '0.2rem' }}><Clock size={16} /></div>
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Extreme Notice Periods</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Flagging applicants with atypical parameters indicating inactive status or fake application files.</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <CheckCircle size={18} className="bullet-icon success" style={{ marginTop: '0.15rem' }} />
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>100% Shortlist Protection</h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Honeypots are automatically filtered out from the shortlist view. They will never contaminate your hiring queues.</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <CheckCircle size={18} className="bullet-icon success" style={{ marginTop: '0.15rem' }} />
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Auditable Reasoning</h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>You can inspect isolated honeypots inside the "Honeypot Inspector" tab to audit the specific validation failures flagged by the scorer.</p>
                </div>
              </div>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ alignSelf: 'flex-start', background: 'var(--accent-terracotta)', marginTop: '0.5rem' }}
                onClick={() => scrollToSection('dashboard-section')}
              >
                Go to Honeypot Inspector
              </button>
            </div>
          </div>
        </section>

        {/* Section 5: Developer Center / System Info */}
        <section id="developer" className="section-block" style={{ borderBottom: 'none' }}>
          <span className="section-tag">System Integrations</span>
          <h2 className="section-heading">Developer Center &amp; API Specifications</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem', maxWidth: '800px' }}>
            AuraHire exposes RESTful APIs that return JSON responses for integration with downstream applicant tracking systems (ATS) like Workday or Greenhouse.
          </p>

          <div style={{ background: '#2B2D42', padding: '1.5rem', borderRadius: 'var(--radius-lg)', color: '#F8F7F4', fontFamily: 'monospace', fontSize: '0.75rem', overflowX: 'auto' }}>
            <div style={{ color: '#D4A373', marginBottom: '0.5rem' }}># Retrieve candidate ranking list</div>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ color: '#4CAF50', fontWeight: 700 }}>POST</span> http://localhost:8000/api/rank
            </div>
            <div style={{ color: '#D4A373', marginBottom: '0.5rem' }}># Payload</div>
            <div style={{ color: '#a5b4fc', marginBottom: '1rem' }}>
              {`{
  "jd_text": "Looking for a Software Engineer with Python and FAISS vector database experience..."
}`}
            </div>
            <div style={{ color: '#D4A373', marginBottom: '0.5rem' }}># Response Summary</div>
            <div style={{ color: '#86efac' }}>
              {`{
  "candidates": [
    { "candidate_id": "CAND_0088025", "name": "Candidate 0088025", "score": 0.7812, "rec_text": "Highly Recommended" }
  ],
  "analytics": { "total_candidates": 100000, "qualified_candidates": 46 }
}`}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer id="footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem', paddingBottom: '3.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Briefcase size={16} style={{ color: 'var(--primary-sage)' }} />
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem' }}>AuraHire</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>© 2026 AuraHire Systems Inc. All rights reserved. Indian Runs Hackathon Edition.</p>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem' }}>
            <a href="#overview" onClick={(e) => { e.preventDefault(); scrollToSection('overview'); }}>Platform Overview</a>
            <a href="#dashboard-section" onClick={(e) => { e.preventDefault(); scrollToSection('dashboard-section'); }}>Candidate Scorer</a>
            <a href="#architecture" onClick={(e) => { e.preventDefault(); scrollToSection('architecture'); }}>Algorithm Docs</a>
            <a href="#security" onClick={(e) => { e.preventDefault(); scrollToSection('security'); }}>Fraud Shield</a>
          </div>

          {/* Floating Back to Top */}
          <button 
            type="button" 
            className="chat-send-btn" 
            onClick={() => scrollToSection('overview')}
            title="Scroll to Top"
            style={{ borderRadius: '50%', width: '40px', height: '40px' }}
          >
            <ArrowUp size={16} />
          </button>
        </footer>

      </main>
    </div>
  );
}

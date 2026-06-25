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
  Terminal,
  Loader,
  AlertTriangle,
  X
} from 'lucide-react';
import './App.css';

// Mock/Demo Data Fallback
const MOCK_CANDIDATES = [
  {
    candidate_id: "CAND_0000001",
    name: "Ira Vora",
    score: 0.8124,
    sub_scores: { semantic: 0.82, skills: 0.85, career: 0.78, signals: 0.80 },
    reasoning: "Strong match in data-infra, Spark, and Airflow. Low notice period of 27 days. Tier 1 education background.",
    yoe: 6.9,
    title: "Backend Engineer",
    skills: ["Python", "SQL", "Spark", "Airflow", "Kafka"],
    skills_matched: ["Python", "SQL", "Spark", "Airflow"],
    notice_period_days: 27,
    rec_text: "Highly Recommended",
    is_honeypot: false,
    profile: { anonymized_name: "Ira Vora" },
    redrob_signals: { expected_salary_range_inr_lpa: [18, 24], notice_period_days: 27 },
    education: [
      { institution: "Birla Institute of Technology and Science, Pilani", degree: "B.E.", field_of_study: "Computer Science", start_year: 2013, end_year: 2017, tier: "tier_1" }
    ],
    strengths: [
      "6.9y of experience as Backend Engineer.",
      "Matches key target skills: Python, SQL, Spark.",
      "Low notice period of 27 days."
    ],
    concerns: []
  },
  {
    candidate_id: "CAND_0000002",
    name: "Abhijith UK",
    score: 0.7650,
    sub_scores: { semantic: 0.75, skills: 0.80, career: 0.72, signals: 0.80 },
    reasoning: "Excellent fullstack experience with React and Node.js. Immediate availability.",
    yoe: 4.2,
    title: "Full Stack Engineer",
    skills: ["React", "Node.js", "Javascript", "MongoDB", "Express"],
    skills_matched: ["React", "Node.js", "Javascript"],
    notice_period_days: 15,
    rec_text: "Highly Recommended",
    is_honeypot: false,
    profile: { anonymized_name: "Abhijith UK" },
    redrob_signals: { expected_salary_range_inr_lpa: [12, 16], notice_period_days: 15 },
    education: [
      { institution: "Lovely Professional University", degree: "B.Tech", field_of_study: "Information Technology", start_year: 2018, end_year: 2022, tier: "tier_3" }
    ],
    strengths: [
      "4.2y of experience as Full Stack Engineer.",
      "Matches key target skills: React, Node.js, Javascript.",
      "Low notice period of 15 days."
    ],
    concerns: []
  }
];

const MOCK_HONEYPOTS = [
  {
    candidate_id: "CAND_0000003",
    name: "John Doe",
    score: 0.4850,
    sub_scores: { semantic: 0.55, skills: 0.42, career: 0.00, signals: 0.00 },
    reasoning: "Flagged: Honeypot Profile. Impossible overlapping career dates.",
    yoe: 3.5,
    title: "Software Engineer",
    skills: ["Java", "Spring Boot", "SQL"],
    skills_matched: ["Java", "SQL"],
    notice_period_days: 90,
    rec_text: "Flagged: Honeypot Profile",
    is_honeypot: true,
    profile: { anonymized_name: "John Doe" },
    redrob_signals: { expected_salary_range_inr_lpa: [8, 11], notice_period_days: 90 },
    education: [
      { institution: "Anna University", degree: "B.E.", field_of_study: "Electrical Engineering", start_year: 2016, end_year: 2020, tier: "tier_2" }
    ],
    strengths: [
      "3.5y of experience as Software Engineer."
    ],
    concerns: [
      "Long notice period of 90 days.",
      "Honeypot indicators: Impossible employment dates / zero duration skills."
    ]
  }
];

const MOCK_ANALYTICS = {
  total_candidates: 100000,
  qualified_candidates: 2,
  top_match_score: 0.8124,
  avg_match_percentage: 78.9,
  shortlisted_candidates: 2,
  ai_confidence_score: 94.5
};

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

  // Loading feedback & Timeout states
  const [loadingText, setLoadingText] = useState("Connecting to scoring engine...");
  const [showTimeoutCard, setShowTimeoutCard] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Keep-alive warm-up ping
  const pingServer = async () => {
    try {
      await fetch('https://aura-hire.onrender.com/health', { method: 'GET' });
    } catch (e) {
      // Silent fail — just a warm-up ping
    }
  };

  useEffect(() => {
    pingServer();
  }, []);

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
    setLoadingText("Connecting to scoring engine...");
    setShowTimeoutCard(false);

    const timers = [];
    
    // Loading steps timeout animations
    timers.push(setTimeout(() => {
      setLoadingText("Engine warming up — this takes ~30 seconds on first load...");
    }, 10000));
    
    timers.push(setTimeout(() => {
      setLoadingText("Running semantic analysis across candidates...");
    }, 30000));
    
    timers.push(setTimeout(() => {
      setLoadingText("Scoring career trajectories and signals...");
    }, 60000));
    
    timers.push(setTimeout(() => {
      setLoadingText("Almost done — finalising rankings...");
    }, 90000));

    const controller = new AbortController();
    
    // Timeout triggers abort at 120 seconds
    timers.push(setTimeout(() => {
      controller.abort();
      setShowTimeoutCard(true);
    }, 120000));

    try {
      let response;
      if (mode === 'upload') {
        const formData = new FormData();
        formData.append('file', file);
        response = await fetch(getApiUrl('/api/rank'), {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });
      } else {
        response = await fetch(getApiUrl('/api/rank'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jd_text: jdText }),
          signal: controller.signal
        });
      }

      // Clear all timers on success
      timers.forEach(t => clearTimeout(t));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to score candidates');
      }

      const data = await response.json();
      setCandidates(data.candidates);
      setHoneypots(data.honeypots);
      setAnalytics(data.analytics);
      setWeights(data.weights);
      setDemoMode(false);
      
      // Auto-select top candidate
      if (data.candidates.length > 0) {
        setSelectedCandidate(data.candidates[0]);
      }
    } catch (err) {
      timers.forEach(t => clearTimeout(t));
      console.error(err);
      
      // Fallback to Demo Mode automatically
      setDemoMode(true);
      setBannerDismissed(false);
      setCandidates(MOCK_CANDIDATES);
      setHoneypots(MOCK_HONEYPOTS);
      setAnalytics(MOCK_ANALYTICS);
      setWeights({
        semantic: 0.30,
        skills: 0.25,
        career: 0.25,
        signals: 0.20
      });
      if (MOCK_CANDIDATES.length > 0) {
        setSelectedCandidate(MOCK_CANDIDATES[0]);
      }
      
      if (err.name !== 'AbortError') {
        setError(`Scoring engine unavailable: ${err.message}. Showing demo results.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamic weights adjustment
  const handleWeightChange = async (key, val) => {
    const newWeights = { ...weights, [key]: parseFloat(val) };
    setWeights(newWeights);

    // If demo mode, compute simple mock re-ranking locally
    if (demoMode) {
      // Local re-ranking simulation
      const recalculated = [...MOCK_CANDIDATES].map(c => {
        const newScore = (
          newWeights.semantic * c.sub_scores.semantic +
          newWeights.skills * c.sub_scores.skills +
          newWeights.career * c.sub_scores.career +
          newWeights.signals * c.sub_scores.signals
        );
        return { ...c, score: parseFloat(newScore.toFixed(4)) };
      }).sort((a, b) => b.score - a.score);
      setCandidates(recalculated);
      setAnalytics({
        ...MOCK_ANALYTICS,
        top_match_score: recalculated[0]?.score || 0,
        avg_match_percentage: parseFloat((recalculated.reduce((acc, curr) => acc + curr.score, 0) / recalculated.length * 100).toFixed(1))
      });
      if (recalculated.length > 0) {
        setSelectedCandidate(recalculated[0]);
      }
      return;
    }

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

  // Reset Weights Tuning
  const handleResetWeights = async () => {
    const defaultWeights = {
      semantic: 0.30,
      skills: 0.25,
      career: 0.25,
      signals: 0.20
    };
    setWeights(defaultWeights);

    if (demoMode) {
      const recalculated = [...MOCK_CANDIDATES].map(c => {
        const newScore = (
          defaultWeights.semantic * c.sub_scores.semantic +
          defaultWeights.skills * c.sub_scores.skills +
          defaultWeights.career * c.sub_scores.career +
          defaultWeights.signals * c.sub_scores.signals
        );
        return { ...c, score: parseFloat(newScore.toFixed(4)) };
      }).sort((a, b) => b.score - a.score);
      setCandidates(recalculated);
      setAnalytics({
        ...MOCK_ANALYTICS,
        top_match_score: recalculated[0]?.score || 0,
        avg_match_percentage: parseFloat((recalculated.reduce((acc, curr) => acc + curr.score, 0) / recalculated.length * 100).toFixed(1))
      });
      if (recalculated.length > 0) {
        setSelectedCandidate(recalculated[0]);
      }
      return;
    }

    try {
      const response = await fetch(getApiUrl('/api/rerank'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultWeights),
      });

      if (!response.ok) return;

      const data = await response.json();
      setCandidates(data.candidates);
      setHoneypots(data.honeypots);
      setAnalytics(data.analytics);
      setWeights(data.weights);

      if (selectedCandidate) {
        const updated = [...data.candidates, ...data.honeypots].find(
          c => c.candidate_id === selectedCandidate.candidate_id
        );
        if (updated) {
          setSelectedCandidate(updated);
        }
      }
    } catch (err) {
      console.error('Failed to reset weights:', err);
    }
  };

  // Cancel Ranking / Try Again Reset
  const handleCancelRank = () => {
    setIsLoading(false);
    setCandidates([]);
    setHoneypots([]);
    setAnalytics(null);
    setSelectedCandidate(null);
    setDemoMode(false);
    setError(null);
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
        
        {/* Demo Mode Alert Banner */}
        {demoMode && !bannerDismissed && (
          <div style={{
            background: '#FFF3E0',
            border: '1px solid #FFE0B2',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            color: '#E65100',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <AlertTriangle size={16} />
              <span>⚡ Showing demo results — live engine is warming up. Refresh and try again in 30 seconds for real rankings.</span>
            </div>
            <button 
              type="button" 
              onClick={() => setBannerDismissed(true)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#E65100', display: 'flex', alignItems: 'center' }}
            >
              <X size={16} />
            </button>
          </div>
        )}
        
        {/* Section 1: Platform Overview */}
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
          {isLoading ? (
            <div className="dashboard-placeholder-row">
              {/* Uploader Card (Visible & Disabled) */}
              <div style={{ flex: '0 0 350px' }}>
                <FileUploader onRank={handleRank} isLoading={isLoading} />
              </div>

              {/* Detailed Progress Loading State */}
              <div className="panel placeholder-info-card" style={{ flexGrow: 1, minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '1.25rem' }}>
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div className="animate-spin" style={{ 
                    border: '4px solid rgba(107, 143, 113, 0.1)', 
                    borderLeft: '4px solid var(--primary-sage)', 
                    borderTop: '4px solid var(--accent-terracotta)',
                    borderRadius: '50%', 
                    width: '44px', 
                    height: '44px'
                  }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    {loadingText}
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto' }}>
                    Computing composite matching weights across semantic indices, canonical skills maps, and security checks.
                  </p>
                </div>
                {showTimeoutCard && (
                  <div style={{ 
                    background: '#FFF3E0', 
                    border: '1px solid #FFE0B2', 
                    padding: '1rem', 
                    borderRadius: 'var(--radius-md)', 
                    maxWidth: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    marginTop: '0.5rem',
                    alignItems: 'center'
                  }}>
                    <div style={{ fontSize: '0.8125rem', color: '#E65100', fontWeight: 600 }}>
                      The engine took longer than expected. Showing demo results while it catches up.
                    </div>
                    <button 
                      type="button" 
                      className="btn-primary" 
                      style={{ background: '#E65100', fontSize: '0.75rem', padding: '0.4rem 1rem' }}
                      onClick={handleCancelRank}
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : candidates.length === 0 ? (
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
                    <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sliders size={18} style={{ color: 'var(--primary-sage)' }} />
                        <span>Weight Tuning</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetWeights}
                        disabled={isLoading}
                        style={{
                          fontSize: '0.75rem',
                          background: 'transparent',
                          color: 'var(--primary-sage)',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        Reset
                      </button>
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
              <span style={{ color: '#4CAF50', fontWeight: 700 }}>POST</span> https://aura-hire.onrender.com/api/rank
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

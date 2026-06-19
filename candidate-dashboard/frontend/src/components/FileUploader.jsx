import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function FileUploader({ onRank, isLoading }) {
  const [file, setFile] = useState(null);
  const [jdText, setJdText] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [mode, setMode] = useState('upload'); // 'upload' or 'text'
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleClear = () => {
    setFile(null);
    setJdText('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'upload' && !file) return;
    if (mode === 'text' && !jdText.trim()) return;

    const formData = new FormData();
    if (mode === 'upload') {
      formData.append('file', file);
    } else {
      // Send as JSON
      // Handled in parent
    }

    onRank({
      mode,
      file,
      jdText: mode === 'text' ? jdText : ''
    });
  };

  return (
    <div className="panel fade-in">
      <div className="panel-title">
        <FileText size={18} className="upload-icon" />
        <span>Job Description Input</span>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <button 
          type="button" 
          className={`tab ${mode === 'upload' ? 'active' : ''}`}
          onClick={() => setMode('upload')}
          style={{ flex: 1 }}
        >
          Upload DOCX
        </button>
        <button 
          type="button" 
          className={`tab ${mode === 'text' ? 'active' : ''}`}
          onClick={() => setMode('text')}
          style={{ flex: 1 }}
        >
          Paste Text
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {mode === 'upload' ? (
          <div 
            className={`upload-container ${isDragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".docx,.txt"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {file ? (
              <div className="upload-success">
                <CheckCircle size={24} className="bullet-icon success" />
                <div style={{ textAlign: 'left' }}>
                  <div className="upload-text" style={{ wordBreak: 'break-all' }}>{file.name}</div>
                  <div className="upload-subtext">{(file.size / 1024).toFixed(1)} KB • Ready to analyze</div>
                </div>
              </div>
            ) : (
              <>
                <Upload size={28} className="upload-icon" />
                <span className="upload-text">Drag &amp; drop job description</span>
                <span className="upload-subtext">Supports .docx files</span>
              </>
            )}
          </div>
        ) : (
          <textarea
            className="jd-text-area"
            placeholder="Paste raw job description requirements here..."
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
          />
        )}

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(file || jdText) && (
            <button 
              type="button" 
              className="btn-primary" 
              style={{ background: 'var(--border-color)', color: 'var(--text-primary)', flex: 1 }}
              onClick={handleClear}
              disabled={isLoading}
            >
              Clear
            </button>
          )}
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ flex: 2 }}
            disabled={isLoading || (mode === 'upload' && !file) || (mode === 'text' && !jdText.trim())}
          >
            {isLoading ? (
              <>
                <Loader size={16} className="animate-spin" /> Scoring...
              </>
            ) : 'Analyze & Score'}
          </button>
        </div>
      </form>
    </div>
  );
}

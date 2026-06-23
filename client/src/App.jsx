import React, { useState, useEffect } from 'react';

export default function App() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  
  const [theme, setTheme] = useState(() => localStorage.getItem('pagepulse-theme') || 'dark');
  
  const [traceOpen, setTraceOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('seo');
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "Connecting to target website...",
    "Extracting HTML, metadata & metrics...",
    "Sending grounded context to Gemini API...",
    "Validating structured response schema...",
    "Saving audit logs to server disk..."
  ];

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('pagepulse-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (status !== 'scanning') return;
    setCurrentStep(0);

    const timers = [
      setTimeout(() => setCurrentStep(1), 800),
      setTimeout(() => setCurrentStep(2), 1600),
      setTimeout(() => setCurrentStep(3), 2600),
      setTimeout(() => setCurrentStep(4), 3800),
    ];

    return () => timers.forEach(clearTimeout);
  }, [status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;

    setStatus('scanning');
    setError(null);
    setData(null);

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        let errorMsg = 'Failed to analyze website';
        try {
          const errorJson = await response.json();
          errorMsg = errorJson.error || errorJson.message || errorMsg;
        } catch (_) {
          errorMsg = `Server returned status ${response.status}: ${response.statusText || 'Offline or Unreachable'}`;
        }
        throw new Error(errorMsg);
      }

      const result = await response.json();

      setData(result);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setError({
        message: err.message || 'Failed to establish connection',
        details: err.stack || ''
      });
      setStatus('error');
    }
  };

  const getCharBadgeClass = (length, min, max) => {
    if (!length) return 'warning';
    return (length >= min && length <= max) ? 'success' : 'warning';
  };

  return (
    <div>
      <header className="app-header">
        <div className="logo">
          ⚡ <span>PagePulseAI</span> Website Audit Tool
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            className="btn-theme-toggle"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          {data && (
            <button 
              className="btn-trace-toggle" 
              onClick={() => setTraceOpen(true)}
            >
              🐞 View AI Trace
            </button>
          )}
        </div>
      </header>

      <main className="app-container">
        
        {status !== 'idle' && (
          <section className="audit-form-container">
            <form className="audit-form" onSubmit={handleSubmit}>
              <input 
                type="text" 
                className="input-url" 
                placeholder="Enter a website URL to audit (e.g., https://example.com)" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={status === 'scanning'}
                required
              />
              <button 
                type="submit" 
                className="btn-submit" 
                disabled={status === 'scanning'}
              >
                {status === 'scanning' ? 'Auditing...' : 'Analyze Page'}
              </button>
            </form>
          </section>
        )}

        {status === 'idle' && (
          <div className="landing-hero-wrapper">
            <div className="landing-hero-container">
              <div className="landing-hero-left">
                <h1 className="hero-title">WebSite Auditor</h1>
                <p className="hero-subtitle">Website Audits & On-Page Analysis for SEO & UX</p>
                
                <form className="audit-form hero-form" onSubmit={handleSubmit}>
                  <input 
                    type="text" 
                    className="input-url hero-input" 
                    placeholder="Enter a website URL to audit..." 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={status === 'scanning'}
                    required
                  />
                  <button 
                    type="submit" 
                    className="btn-submit hero-btn" 
                    disabled={status === 'scanning'}
                  >
                    Analyze Page
                  </button>
                </form>

                <div className="hero-features-list">
                  <span>Included Audits:</span>
                  <ul>
                    <li>⚡ SEO Structures</li>
                    <li>🎨 UX Hierarchy</li>
                    <li>🎯 CTA Optimizations</li>
                  </ul>
                </div>
              </div>
              
              <div className="landing-hero-right">
                <div className="hero-visual-container">
                  <div className="glowing-orb"></div>
                  <img src="/hero-check.png" alt="3D Auditor Graphic" className="hero-3d-image" />
                </div>
              </div>
            </div>

            <div className="landing-features-footer">
              <div className="footer-feature-item">
                <div className="divider-bar"></div>
                <div>
                  <h3>Comprehensive website SEO audit</h3>
                  <p>In-depth inspection of page metadata, headers layout outline, and alt-tag configurations.</p>
                </div>
              </div>
              <div className="footer-feature-item">
                <div className="divider-bar"></div>
                <div>
                  <h3>Content and site structure optimization</h3>
                  <p>Reviews copy word count, header-to-content density, and overall reading flow.</p>
                </div>
              </div>
              <div className="footer-feature-item">
                <div className="divider-bar"></div>
                <div>
                  <h3>All SEO issues detected and fixed</h3>
                  <p>Identify missing attributes and get prioritizing actions to optimize UX instantly.</p>
                </div>
              </div>
            </div>

            <div className="try-samples">
              <span>Try a sample website:</span>
              <div className="sample-tags">
                <button type="button" onClick={() => setUrl('https://travelsguide.lk/')} className="sample-tag">Travels Guide Sri Lanka</button>
                <button type="button" onClick={() => setUrl('https://example.com')} className="sample-tag">Example.com</button>
                <button type="button" onClick={() => setUrl('https://wikipedia.org')} className="sample-tag">Wikipedia.org</button>
              </div>
            </div>
          </div>
        )}

        {status === 'scanning' && (
          <section className="scanning-state">
            <div className="spinner"></div>
            <h3>Auditing Website</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Please wait while the AI analyzes the page structure.
            </p>
            <div className="scanning-steps">
              {steps.map((stepText, idx) => {
                let stepClass = '';
                if (currentStep === idx) stepClass = 'active';
                else if (currentStep > idx) stepClass = 'completed';
                
                return (
                  <div key={idx} className={`step-item ${stepClass}`}>
                    <div className="step-icon"></div>
                    <span>{stepText}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {status === 'error' && error && (
          <section className="error-alert">
            <div className="error-title">
              ⚠️ Audit Failure
            </div>
            <p>{error.message}</p>
            {error.details && (
              <pre style={{ 
                fontSize: '0.75rem', 
                backgroundColor: 'rgba(0,0,0,0.2)', 
                padding: '0.5rem', 
                borderRadius: '4px',
                marginTop: '0.5rem',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                {error.details}
              </pre>
            )}
          </section>
        )}

        {status === 'success' && data && (
          <div className="dashboard-grid">
            
            <div className="dashboard-sidebar">
              
              <div className="scores-card">
                <h3 className="section-title">Audit Score</h3>
                
                <div className="overall-score-container">
                  <div className="overall-ring">
                    <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                      <circle 
                        cx="60" 
                        cy="60" 
                        r="50" 
                        fill="transparent" 
                        stroke="var(--bg-primary)" 
                        strokeWidth="8"
                      />
                      <circle 
                        cx="60" 
                        cy="60" 
                        r="50" 
                        fill="transparent" 
                        stroke="var(--accent-color)" 
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 50}
                        strokeDashoffset={2 * Math.PI * 50 * (1 - (data.scores.overall || 0) / 100)}
                        strokeLinecap="round"
                        style={{ filter: 'drop-shadow(0px 0px 4px var(--accent-glow))' }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', textAlign: 'center' }}>
                      <span className="overall-value">{data.scores.overall || 0}</span>
                    </div>
                  </div>
                  <span className="overall-label">PagePulse Rating</span>
                </div>

                <div className="scores-list">
                  <div className="sub-score-item">
                    <div className="sub-score-val" style={{ color: data.scores.seo >= 80 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                      {data.scores.seo || 0}%
                    </div>
                    <div className="sub-score-label">SEO</div>
                  </div>
                  <div className="sub-score-item">
                    <div className="sub-score-val" style={{ color: data.scores.ux >= 80 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                      {data.scores.ux || 0}%
                    </div>
                    <div className="sub-score-label">UX / Layout</div>
                  </div>
                  <div className="sub-score-item">
                    <div className="sub-score-val" style={{ color: data.scores.cta >= 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                      {data.scores.cta || 0}%
                    </div>
                    <div className="sub-score-label">CTAs</div>
                  </div>
                  <div className="sub-score-item">
                    <div className="sub-score-val" style={{ color: data.scores.content >= 80 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                      {data.scores.content || 0}%
                    </div>
                    <div className="sub-score-label">Content</div>
                  </div>
                </div>
              </div>

              <div className="metrics-card">
                <h3 className="section-title">Page Metrics</h3>
                
                <div className="metric-item-row">
                  <span className="metric-lbl">Word Count</span>
                  <span className="metric-val">{data.metrics.wordCount}</span>
                </div>

                <div className="metric-item-row">
                  <span className="metric-lbl">Heading Elements</span>
                  <span className="metric-val">
                    H1: {data.metrics.headings?.h1 || 0} | H2: {data.metrics.headings?.h2 || 0} | H3: {data.metrics.headings?.h3 || 0}
                  </span>
                </div>

                <div className="metric-item-row">
                  <span className="metric-lbl">Calls-to-Action</span>
                  <span className="metric-val">{data.metrics.ctas}</span>
                </div>

                <div className="metric-item-row">
                  <span className="metric-lbl">Internal Links</span>
                  <span className="metric-val">{data.metrics.links?.internal || 0}</span>
                </div>

                <div className="metric-item-row">
                  <span className="metric-lbl">External Links</span>
                  <span className="metric-val">{data.metrics.links?.external || 0}</span>
                </div>

                <div className="metric-item-row">
                  <span className="metric-lbl">Images Scraped</span>
                  <span className="metric-val">{data.metrics.images?.total || 0}</span>
                </div>

                <div className="metric-item-row">
                  <span className="metric-lbl">Missing Alt Tags</span>
                  <span className={`metric-val ${data.metrics.images?.missingAlt > 0 ? 'warning' : ''}`}>
                    {data.metrics.images?.missingAlt || 0} ({data.metrics.images?.missingAltPercent || 0}%)
                  </span>
                </div>

                <div className="meta-box">
                  <div className="trace-block-lbl" style={{ marginBottom: '0.5rem', fontSize: '0.75rem' }}>Meta Tags</div>
                  <div className="meta-title">
                    <strong>Title:</strong> {data.metrics.metadata?.title || 'None'}
                    <span className={`char-badge ${getCharBadgeClass(data.metrics.metadata?.title?.length, 50, 60)}`}>
                      {data.metrics.metadata?.title?.length || 0} chars
                    </span>
                  </div>
                  <div className="meta-desc">
                    <strong>Description:</strong> {data.metrics.metadata?.description || 'None'}
                    <span className={`char-badge ${getCharBadgeClass(data.metrics.metadata?.description?.length, 120, 160)}`}>
                      {data.metrics.metadata?.description?.length || 0} chars
                    </span>
                  </div>
                </div>

              </div>
            </div>

            <div className="dashboard-main">
              
              <div className="recommendations-panel">
                <h3 className="section-title" style={{ borderBottom: 'none', marginBottom: '0' }}>Prioritized Actions</h3>
                
                {data.recommendations && data.recommendations.map((rec, idx) => (
                  <div key={idx} className={`rec-card ${rec.priority?.toLowerCase()}`}>
                    <span className={`rec-badge ${rec.priority?.toLowerCase()}`}>{rec.priority}</span>
                    <div className="rec-content">
                      <div className="rec-action">{rec.action}</div>
                      <div className="rec-reason">{rec.reasoning}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="insights-card">
                <h3 className="section-title">AI Analysis Details</h3>
                
                <div className="insights-tabs-nav">
                  <button 
                    className={`tab-btn ${activeTab === 'seo' ? 'active' : ''}`}
                    onClick={() => setActiveTab('seo')}
                  >
                    SEO Structure
                  </button>
                  <button 
                    className={`tab-btn ${activeTab === 'messaging' ? 'active' : ''}`}
                    onClick={() => setActiveTab('messaging')}
                  >
                    Messaging Clarity
                  </button>
                  <button 
                    className={`tab-btn ${activeTab === 'cta' ? 'active' : ''}`}
                    onClick={() => setActiveTab('cta')}
                  >
                    CTA Placement
                  </button>
                  <button 
                    className={`tab-btn ${activeTab === 'contentDepth' ? 'active' : ''}`}
                    onClick={() => setActiveTab('contentDepth')}
                  >
                    Content Depth
                  </button>
                  <button 
                    className={`tab-btn ${activeTab === 'ux' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ux')}
                  >
                    UX Concerns
                  </button>
                </div>

                <div className="insight-body">
                  {activeTab === 'seo' && <p>{data.insights?.seo || 'No analysis generated.'}</p>}
                  {activeTab === 'messaging' && <p>{data.insights?.messaging || 'No analysis generated.'}</p>}
                  {activeTab === 'cta' && <p>{data.insights?.cta || 'No analysis generated.'}</p>}
                  {activeTab === 'contentDepth' && <p>{data.insights?.contentDepth || 'No analysis generated.'}</p>}
                  {activeTab === 'ux' && <p>{data.insights?.ux || 'No analysis generated.'}</p>}
                </div>
              </div>

              <div className="inspector-card">
                <h3 className="section-title">Scraped Page Layout</h3>
                <div className="inspector-lists">
                  
                  <div className="inspector-box">
                    <div className="inspector-title">Detected Headings List</div>
                    <ul className="inspector-items">
                      {data.metrics.headingsList && data.metrics.headingsList.length > 0 ? (
                        data.metrics.headingsList.map((h, i) => (
                          <li key={i} className="inspector-item">
                            <span className="heading-tag"><code>{h.type}</code></span>
                            <span className="heading-text">{h.text}</span>
                          </li>
                        ))
                      ) : (
                        <li className="inspector-item" style={{ color: 'var(--text-muted)' }}>No headings found.</li>
                      )}
                    </ul>
                  </div>

                  <div className="inspector-box">
                    <div className="inspector-title">Detected Call-To-Actions</div>
                    <ul className="inspector-items">
                      {data.metrics.ctasList && data.metrics.ctasList.length > 0 ? (
                        data.metrics.ctasList.map((cta, i) => (
                          <li key={i} className="inspector-item cta-item">
                            <div className="cta-item-row">
                              <code>{cta.tagName}</code>
                              <span className="cta-text">{cta.text || '[Empty Text]'}</span>
                            </div>
                            {cta.href && (
                              <a 
                                href={cta.href} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="cta-link"
                              >
                                🔗 {cta.href}
                              </a>
                            )}
                          </li>
                        ))
                      ) : (
                        <li className="inspector-item" style={{ color: 'var(--text-muted)' }}>No CTAs found.</li>
                      )}
                    </ul>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      <div 
        className={`drawer-overlay ${traceOpen ? 'open' : ''}`}
        onClick={() => setTraceOpen(false)}
      ></div>
      
      <div className={`trace-drawer ${traceOpen ? 'open' : ''}`}>
        <div className="trace-drawer-header">
          <h3>🐞 AI Orchestration Trace</h3>
          <button 
            className="trace-drawer-close"
            onClick={() => setTraceOpen(false)}
          >
            &times;
          </button>
        </div>
        
        <div className="trace-drawer-body">
          {data && data.traceLog ? (
            <>
              <div className="trace-meta-grid">
                <div className="trace-meta-item">
                  <span>Timestamp:</span>
                  <span>{new Date(data.traceLog.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="trace-meta-item">
                  <span>Model:</span>
                  <span>{data.traceLog.model}</span>
                </div>
                <div className="trace-meta-item">
                  <span>URL:</span>
                  <span style={{ fontSize: '0.7rem' }}>{data.traceLog.url}</span>
                </div>
                <div className="trace-meta-item">
                  <span>Response Time:</span>
                  <span>{data.traceLog.responseTime} ms</span>
                </div>
              </div>

              <div className="trace-block">
                <span className="trace-block-lbl">System Prompt</span>
                <pre className="trace-code">{data.traceLog.systemPrompt}</pre>
              </div>

              <div className="trace-block">
                <span className="trace-block-lbl">Constructed User Prompt</span>
                <pre className="trace-code">{data.traceLog.userPrompt}</pre>
              </div>

              <div className="trace-block">
                <span className="trace-block-lbl">Structured Input JSON</span>
                <pre className="trace-code">
                  {JSON.stringify(data.traceLog.structuredInput, null, 2)}
                </pre>
              </div>

              <div className="trace-block">
                <span className="trace-block-lbl">Raw Model Output JSON</span>
                <pre className="trace-code">{data.traceLog.rawOutput}</pre>
              </div>
            </>
          ) : (
            <p>No trace logs available for this audit request.</p>
          )}
        </div>
      </div>
    </div>
  );
}

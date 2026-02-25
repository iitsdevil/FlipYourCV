import { useState, useRef } from "react";
import * as mammoth from "mammoth";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --bg: #0a0a0a;
    --surface: #111111;
    --surface2: #1a1a1a;
    --border: #2a2a2a;
    --accent: #c8f542;
    --accent2: #f5e642;
    --text: #f0f0f0;
    --muted: #666;
    --danger: #ff4545;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Syne', sans-serif;
    min-height: 100vh;
  }

  .app {
    max-width: 1100px;
    margin: 0 auto;
    padding: 40px 24px 80px;
  }

  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 56px;
    padding-bottom: 32px;
    border-bottom: 1px solid var(--border);
  }
  .logo-area h1 {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(2rem, 5vw, 3.2rem);
    line-height: 1.05;
    letter-spacing: -1px;
  }
  .logo-area h1 span { color: var(--accent); }
  .logo-area p {
    color: var(--muted);
    font-family: 'DM Mono', monospace;
    font-size: 1rem;
    margin-top: 8px;
    letter-spacing: 0.05em;
  }
  .badge {
    background: var(--accent);
    color: #0a0a0a;
    font-size: 0.9rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 2px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-top: 8px;
    display: inline-block;
  }

  .main-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    align-items: start;
  }
  @media (max-width: 700px) {
    .main-grid { grid-template-columns: 1fr; }
  }

  .panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    overflow: hidden;
  }
  .panel-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    background: var(--surface2);
  }
  .panel-header .num {
    font-family: 'DM Mono', monospace;
    font-size: 0.7rem;
    color: var(--accent);
    background: rgba(200,245,66,0.1);
    padding: 2px 8px;
    border-radius: 2px;
  }
  .panel-header h2 {
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .panel-body { padding: 20px; }

  .upload-zone {
    border: 1.5px dashed var(--border);
    border-radius: 4px;
    padding: 48px 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }
  .upload-zone:hover, .upload-zone.dragging {
    border-color: var(--accent);
    background: rgba(200,245,66,0.03);
  }
  .upload-zone input {
    position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%;
  }
  .upload-icon { font-size: 2.5rem; margin-bottom: 12px; display: block; }
  .upload-zone h3 { font-size: 1rem; font-weight: 600; margin-bottom: 6px; }
  .upload-zone p { font-size: 0.8rem; color: var(--muted); font-family: 'DM Mono', monospace; }

  .file-loaded {
    border: 1px solid rgba(200,245,66,0.3);
    background: rgba(200,245,66,0.04);
    border-radius: 4px;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .file-loaded .file-info { flex: 1; min-width: 0; }
  .file-loaded .file-name {
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--accent);
  }
  .file-loaded .file-meta {
    font-size: 0.7rem;
    color: var(--muted);
    font-family: 'DM Mono', monospace;
    margin-top: 2px;
  }
  .btn-remove {
    background: none;
    border: 1px solid var(--border);
    color: var(--muted);
    padding: 4px 10px;
    cursor: pointer;
    font-size: 0.75rem;
    border-radius: 2px;
    font-family: 'Syne', sans-serif;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .btn-remove:hover { border-color: var(--danger); color: var(--danger); }

  .cv-textarea {
    width: 100%;
    min-height: 220px;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text);
    font-family: 'DM Mono', monospace;
    font-size: 0.78rem;
    line-height: 1.6;
    padding: 14px;
    border-radius: 4px;
    resize: vertical;
    transition: border-color 0.2s;
    margin-top: 16px;
  }
  .cv-textarea:focus { outline: none; border-color: var(--accent); }
  .cv-textarea::placeholder { color: var(--muted); }

  .field-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 8px;
    margin-top: 16px;
    display: block;
  }
  .job-input {
    width: 100%;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text);
    font-family: 'Syne', sans-serif;
    font-size: 0.9rem;
    padding: 10px 14px;
    border-radius: 4px;
    transition: border-color 0.2s;
  }
  .job-input:focus { outline: none; border-color: var(--accent); }
  .job-input::placeholder { color: var(--muted); }

  .btn-convert {
    width: 100%;
    margin-top: 20px;
    padding: 14px;
    background: var(--accent);
    color: #0a0a0a;
    border: none;
    font-family: 'Syne', sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .btn-convert:hover:not(:disabled) { background: var(--accent2); transform: translateY(-1px); }
  .btn-convert:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(0,0,0,0.3);
    border-top-color: #0a0a0a;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .output-empty {
    min-height: 380px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--muted);
    text-align: center;
  }
  .output-empty .arrow { font-size: 2rem; animation: float 2s ease-in-out infinite; }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  .output-empty p { font-size: 0.8rem; font-family: 'DM Mono', monospace; }

  .output-content {
    font-family: 'DM Mono', monospace;
    font-size: 0.78rem;
    line-height: 1.7;
    white-space: pre-wrap;
    color: var(--text);
    max-height: 520px;
    overflow-y: auto;
    padding-right: 8px;
  }
  .output-content::-webkit-scrollbar { width: 4px; }
  .output-content::-webkit-scrollbar-track { background: var(--surface2); }
  .output-content::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .output-actions {
    display: flex;
    gap: 10px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }
  .btn-action {
    flex: 1;
    padding: 10px;
    background: none;
    border: 1px solid var(--border);
    color: var(--text);
    font-family: 'Syne', sans-serif;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
    letter-spacing: 0.05em;
  }
  .btn-action:hover { border-color: var(--accent); color: var(--accent); }
  .btn-action.primary { background: var(--surface2); }

  .score-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 16px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .score-num {
    font-family: 'DM Serif Display', serif;
    font-size: 2.8rem;
    color: var(--accent);
    line-height: 1;
    min-width: 70px;
  }
  .score-details { flex: 1; }
  .score-details h4 { font-size: 0.85rem; font-weight: 700; margin-bottom: 4px; }
  .score-details p { font-size: 0.72rem; color: var(--muted); font-family: 'DM Mono', monospace; }
  .score-bar {
    width: 100%;
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    margin-top: 8px;
    overflow: hidden;
  }
  .score-bar-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 2px;
    transition: width 1s ease;
  }

  .tips-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 16px;
  }
  .tip {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 12px;
    font-size: 0.72rem;
    color: var(--muted);
    font-family: 'DM Mono', monospace;
    line-height: 1.5;
  }
  .tip strong { color: var(--text); display: block; margin-bottom: 2px; font-size: 0.75rem; }

  .loading-state {
    min-height: 380px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }
  .loading-state .big-spinner {
    width: 40px; height: 40px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  .loading-state p {
    font-size: 0.8rem;
    color: var(--muted);
    font-family: 'DM Mono', monospace;
    animation: pulse 1.5s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }

  .error-box {
    background: rgba(255,69,69,0.08);
    border: 1px solid rgba(255,69,69,0.3);
    border-radius: 4px;
    padding: 12px 16px;
    font-size: 0.8rem;
    color: #ff7070;
    font-family: 'DM Mono', monospace;
    margin-top: 12px;
    line-height: 1.5;
  }

  .footer {
    text-align: center;
    margin-top: 60px;
    padding-top: 24px;
    border-top: 1px solid var(--border);
    font-size: 0.7rem;
    color: var(--muted);
    font-family: 'DM Mono', monospace;
  }
`;

const LOADING_MESSAGES = [
  "Parsing your CV structure...",
  "Identifying key skills and experience...",
  "Reformatting for ATS compatibility...",
  "Optimizing keywords and sections...",
  "Running final ATS checks...",
];

export default function App() {
  const [file, setFile] = useState(null);
  const [rawText, setRawText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef();

  const extractText = async (f) => {
    const ext = f.name.split(".").pop().toLowerCase();

    if (ext === "txt") {
      return await f.text();
    }

    if (ext === "docx") {
      const buf = await f.arrayBuffer();
      const res = await mammoth.extractRawText({ arrayBuffer: buf });
      return res.value;
    }

    if (ext === "pdf") {
      // Dynamically import pdfjs to avoid SSR issues
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      const buf = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((s) => s.str).join(" ") + "\n";
      }
      return text;
    }

    throw new Error("Unsupported file type. Please upload PDF, DOCX, or TXT.");
  };

  const handleFile = async (f) => {
    if (!f) return;
    setError("");
    try {
      const text = await extractText(f);
      setFile(f);
      setRawText(text);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const convert = async () => {
    const cvContent = rawText.trim();
    if (!cvContent) {
      setError("Please upload a CV or paste your CV text.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    let msgIdx = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIdx]);
    }, 2000);

    try {
      // ✅ Calls OUR backend, not Anthropic directly
      // The API key stays safely on the server
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText: cvContent, jobTitle }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      const text = data.result || "";

      // Parse score
      const scoreMatch = text.match(/SCORE:\s*(\d+)\/100/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : null;

      // Split CV from tips
      const splitIdx = text.indexOf("--- ATS SCORE");
      const cvPart = splitIdx > -1 ? text.slice(0, splitIdx).trim() : text;
      const tipsPart = splitIdx > -1 ? text.slice(splitIdx).trim() : "";

      setResult({ cv: cvPart, tips: tipsPart, score });
    } catch (e) {
      setError("Error: " + e.message);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const copy = () => {
    if (result?.cv) {
      navigator.clipboard.writeText(result.cv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const download = () => {
    if (!result?.cv) return;
    const blob = new Blob([result.cv], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ats-optimized-cv.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setRawText("");
    setResult(null);
    setError("");
    setJobTitle("");
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">
        <div className="header">
          <div className="logo-area">
            <h1>ATS<span>.</span>CV</h1>
            <p>// الاداة الاولى لتحسين السيرة الذاتية</p>
            <span className="badge">ذكاء اصطناعي</span>
          </div>
        </div>

        <div className="main-grid">
          {/* INPUT PANEL */}
          <div>
            <div className="panel">
              <div className="panel-header">
                <span className="num">01</span>
                <h2>Your CV</h2>
              </div>
              <div className="panel-body">
                {!file ? (
                  <div
                    className={`upload-zone ${dragging ? "dragging" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => handleFile(e.target.files[0])}
                    />
                    <span className="upload-icon">📄</span>
                    <h3>Drop your CV here</h3>
                    <p>PDF, DOCX, or TXT supported</p>
                  </div>
                ) : (
                  <div className="file-loaded">
                    <span>✅</span>
                    <div className="file-info">
                      <div className="file-name">{file.name}</div>
                      <div className="file-meta">
                        {(file.size / 1024).toFixed(1)} KB · {rawText.split(/\s+/).length} words extracted
                      </div>
                    </div>
                    <button className="btn-remove" onClick={reset}>Remove</button>
                  </div>
                )}

                <textarea
                  className="cv-textarea"
                  placeholder="Or paste your CV text directly here..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={8}
                />

                <span className="field-label">Target Job Title (optional)</span>
                <input
                  className="job-input"
                  placeholder="e.g. Senior Software Engineer, Marketing Manager..."
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />

                {error && <div className="error-box">⚠ {error}</div>}

                <button
                  className="btn-convert"
                  onClick={convert}
                  disabled={loading || !rawText.trim()}
                >
                  {loading ? (
                    <><div className="spinner" /> Converting...</>
                  ) : (
                    <>Convert to ATS CV →</>
                  )}
                </button>
              </div>
            </div>

            <div className="tips-grid" style={{ marginTop: 16 }}>
              {[
                ["No Tables/Columns", "ATS can't read multi-column layouts or tables"],
                ["Simple Fonts", "Stick to Arial, Calibri, or Times New Roman"],
                ["Standard Sections", "Use exact headers ATS expects"],
                ["Keywords Matter", "Mirror language from the job description"],
              ].map(([title, desc]) => (
                <div className="tip" key={title}>
                  <strong>{title}</strong>{desc}
                </div>
              ))}
            </div>
          </div>

          {/* OUTPUT PANEL */}
          <div className="panel">
            <div className="panel-header">
              <span className="num">02</span>
              <h2>ATS Optimized Output</h2>
            </div>
            <div className="panel-body">
              {loading ? (
                <div className="loading-state">
                  <div className="big-spinner" />
                  <p>{loadingMsg}</p>
                </div>
              ) : result ? (
                <>
                  {result.score !== null && (
                    <div className="score-card">
                      <div className="score-num">{result.score}</div>
                      <div className="score-details">
                        <h4>ATS Compatibility Score</h4>
                        <p>out of 100 — {result.score >= 80 ? "Excellent!" : result.score >= 60 ? "Good, minor tweaks needed" : "Needs improvement"}</p>
                        <div className="score-bar">
                          <div className="score-bar-fill" style={{ width: `${result.score}%` }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="output-content">{result.cv}</div>
                  {result.tips && (
                    <div style={{ marginTop: 16, padding: 14, background: "var(--surface2)", borderRadius: 4, border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 8, fontFamily: "Syne" }}>
                        AI Tips
                      </div>
                      <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                        {result.tips.replace("--- ATS SCORE & TIPS ---", "").replace(/SCORE:.*\n?/i, "").trim()}
                      </div>
                    </div>
                  )}
                  <div className="output-actions">
                    <button className="btn-action" onClick={copy}>{copied ? "✓ Copied!" : "Copy Text"}</button>
                    <button className="btn-action primary" onClick={download}>Download .txt</button>
                    <button className="btn-action" onClick={reset}>New CV</button>
                  </div>
                </>
              ) : (
                <div className="output-empty">
                  <span className="arrow">↑</span>
                  <p>Upload your CV and click convert</p>
                  <p style={{ opacity: 0.5 }}>Your ATS-optimized CV will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="footer">
          ATS.CV — Powered by Claude AI · Your CV is never stored · Free to use
        </div>
      </div>
    </>
  );
}

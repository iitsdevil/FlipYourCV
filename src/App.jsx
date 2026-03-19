import { useState, useRef, useEffect } from "react";
import * as mammoth from "mammoth";
import jsPDF from "jspdf";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --bg: #f4f4fe; --surface: #ffffff; --surface2: #ebebfa;
    --border: #d5d5ef; --accent: #6C63FF; --accent2: #8B83FF;
    --text: #111118; --muted: #7070a0; --danger: #ff4545;
  }
  body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; min-height: 100vh; }
  .app { max-width: 1100px; margin: 0 auto; padding: 40px 24px 80px; }
  .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 56px; padding-bottom: 32px; border-bottom: 1px solid var(--border); }
  .logo-area h1 { font-family: 'Space Grotesk', sans-serif; font-size: clamp(2rem, 5vw, 3.2rem); line-height: 1.05; letter-spacing: -1px; }
  .logo-area h1 span { background: linear-gradient(135deg, var(--accent2) 0%, var(--accent) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .logo-area p { color: var(--muted); font-family: 'JetBrains Mono', monospace; font-size: 1rem; margin-top: 8px; letter-spacing: 0.05em; }
  .badge { background: linear-gradient(135deg, var(--accent2) 0%, var(--accent) 100%); color: #fff; font-size: 0.9rem; font-weight: 700; padding: 4px 10px; border-radius: 2px; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 8px; display: inline-block; }
  .ar { direction: rtl; text-align: right; font-family: 'Inter', Tahoma, Arial, sans-serif; }
  .ar-center { direction: rtl; text-align: center; font-family: 'Inter', Tahoma, Arial, sans-serif; }
  .main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
  @media (max-width: 700px) { .main-grid { grid-template-columns: 1fr; } }
  .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
  .panel-header { display: flex; align-items: center; gap: 10px; padding: 16px 20px; border-bottom: 1px solid var(--border); background: var(--surface2); }
  .panel-header .num { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: var(--accent); background: rgba(108,99,255,0.12); padding: 2px 8px; border-radius: 2px; }
  .panel-header h2 { font-size: 0.85rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  .panel-body { padding: 20px; }
  .upload-zone { border: 1.5px dashed var(--border); border-radius: 4px; padding: 48px 24px; text-align: center; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden; }
  .upload-zone:hover, .upload-zone.dragging { border-color: var(--accent); background: rgba(108,99,255,0.04); }
  .upload-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
  /* EXTRACTING OVERLAY */
  .extract-overlay { position: absolute; inset: 0; background: rgba(17,17,24,0.88); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; z-index: 2; border-radius: 4px; backdrop-filter: blur(2px); }
  .extract-overlay .big-spinner { width: 30px; height: 30px; border: 2.5px solid rgba(108,99,255,0.25); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.75s linear infinite; }
  .extract-overlay p { font-size: 0.78rem; color: var(--accent); font-family: 'JetBrains Mono', monospace; letter-spacing: 0.04em; }
  .extract-overlay small { font-size: 0.66rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; animation: pulse 1.4s ease-in-out infinite; }
  .upload-icon { font-size: 2.5rem; margin-bottom: 12px; display: block; }
  .upload-zone h3 { font-size: 1rem; font-weight: 600; margin-bottom: 6px; }
  .upload-zone p { font-size: 0.8rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
  .file-loaded { border: 1px solid rgba(108,99,255,0.35); background: rgba(108,99,255,0.06); border-radius: 4px; padding: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .file-loaded .file-info { flex: 1; min-width: 0; }
  .file-loaded .file-name { font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--accent); }
  .file-loaded .file-meta { font-size: 0.7rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; margin-top: 2px; }
  .btn-remove { background: none; border: 1px solid var(--border); color: var(--muted); padding: 4px 10px; cursor: pointer; font-size: 0.75rem; border-radius: 2px; font-family: 'Inter', sans-serif; transition: all 0.2s; white-space: nowrap; }
  .btn-remove:hover { border-color: var(--danger); color: var(--danger); }
  .cv-textarea { width: 100%; min-height: 220px; background: var(--bg); border: 1px solid var(--border); color: var(--text); font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; line-height: 1.6; padding: 14px; border-radius: 4px; resize: vertical; transition: border-color 0.2s; margin-top: 16px; }
  .cv-textarea:focus { outline: none; border-color: var(--accent); }
  .cv-textarea::placeholder { color: var(--muted); }
  .field-label { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; margin-top: 16px; display: block; }
  .job-input { width: 100%; background: var(--bg); border: 1px solid var(--border); color: var(--text); font-family: 'Inter', sans-serif; font-size: 0.9rem; padding: 10px 14px; border-radius: 4px; transition: border-color 0.2s; }
  .job-input:focus { outline: none; border-color: var(--accent); }
  .job-input::placeholder { color: var(--muted); }
  .btn-convert { width: 100%; margin-top: 20px; padding: 14px; background: linear-gradient(135deg, var(--accent2) 0%, var(--accent) 100%); color: #fff; border: none; font-family: 'Inter', sans-serif; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border-radius: 4px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .btn-convert:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 4px 20px rgba(108,99,255,0.4); }
  .btn-convert:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .output-empty { min-height: 380px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--muted); text-align: center; }
  .output-empty .arrow { font-size: 2rem; animation: float 2s ease-in-out infinite; }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  .output-empty p { font-size: 0.8rem; font-family: 'JetBrains Mono', monospace; }
  .output-actions { display: flex; gap: 10px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); flex-wrap: wrap; }
  .btn-action { flex: 1; min-width: 100px; padding: 10px; background: none; border: 1px solid var(--border); color: var(--text); font-family: 'Inter', sans-serif; font-size: 0.78rem; font-weight: 600; cursor: pointer; border-radius: 4px; transition: all 0.2s; letter-spacing: 0.05em; }
  .btn-action:hover { border-color: var(--accent); color: var(--accent); }
  .btn-action.primary { background: var(--surface2); }
  .btn-action.highlight { background: linear-gradient(135deg, var(--accent2) 0%, var(--accent) 100%); color: #fff; border: none; }
  .btn-action.highlight:hover { filter: brightness(1.1); color: #fff; box-shadow: 0 4px 16px rgba(108,99,255,0.35); }
  .score-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; padding: 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 20px; }
  .score-num { font-family: 'Space Grotesk', sans-serif; font-size: 2.8rem; color: var(--accent); line-height: 1; min-width: 70px; }
  .score-details { flex: 1; }
  .score-details h4 { font-size: 0.85rem; font-weight: 700; margin-bottom: 4px; }
  .score-details p { font-size: 0.72rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
  .score-bar { width: 100%; height: 4px; background: var(--border); border-radius: 2px; margin-top: 8px; overflow: hidden; }
  .score-bar-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent2)); border-radius: 2px; transition: width 1s ease; box-shadow: 0 0 8px rgba(108,99,255,0.5); }
  /* CV PREVIEW */
  .cv-preview { background: white; color: #1a1a1a; border-radius: 4px; padding: 32px 28px; font-family: 'Arial', sans-serif; font-size: 0.8rem; line-height: 1.5; max-height: 520px; overflow-y: auto; }
  .cv-preview::-webkit-scrollbar { width: 4px; }
  .cv-preview::-webkit-scrollbar-track { background: #f0f0f0; }
  .cv-preview::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }
  .cv-name { font-size: 1.4rem; font-weight: 700; color: #111; margin-bottom: 4px; }
  .cv-contact { font-size: 0.72rem; color: #555; margin-bottom: 12px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .cv-contact span::after { content: '|'; margin-left: 6px; color: #ccc; }
  .cv-contact span:last-child::after { content: ''; }
  .cv-section-title { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #111; border-bottom: 1.5px solid #111; padding-bottom: 3px; margin: 14px 0 8px; }
  .cv-summary { font-size: 0.78rem; color: #333; line-height: 1.6; }
  .cv-job { margin-bottom: 10px; }
  .cv-job-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 4px; }
  .cv-job-title { font-weight: 700; font-size: 0.82rem; color: #111; }
  .cv-job-company { font-size: 0.78rem; color: #444; }
  .cv-job-duration { font-size: 0.72rem; color: #777; white-space: nowrap; }
  .cv-bullets { margin: 4px 0 0 16px; }
  .cv-bullets li { font-size: 0.76rem; color: #333; margin-bottom: 2px; }
  .cv-edu-row { display: flex; justify-content: space-between; margin-bottom: 6px; gap: 8px; }
  .cv-edu-degree { font-weight: 600; font-size: 0.78rem; }
  .cv-edu-school { font-size: 0.76rem; color: #555; }
  .cv-edu-year { font-size: 0.72rem; color: #777; white-space: nowrap; }
  .cv-skills-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
  .cv-skill { background: #f0f0f0; border-radius: 2px; padding: 2px 8px; font-size: 0.72rem; color: #333; }
  .cv-lang-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 4px; }
  .cv-lang-item { font-size: 0.76rem; color: #333; }
  .cv-lang-level { font-size: 0.7rem; color: #888; }
  .cv-hobbies { font-size: 0.76rem; color: #333; }
  .cv-ref-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .cv-ref-item { font-size: 0.74rem; color: #333; line-height: 1.5; }
  .cv-ref-name { font-weight: 700; font-size: 0.78rem; color: #111; }
  /* TIPS */
  .tips-list { margin-top: 12px; }
  .tip-item { display: flex; gap: 8px; padding: 8px 12px; background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; margin-bottom: 6px; font-size: 0.75rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; line-height: 1.5; }
  .tip-item::before { content: '→'; color: var(--accent); flex-shrink: 0; }
  .tips-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 16px; }
  .tip { background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; padding: 12px; font-size: 0.72rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; line-height: 1.5; }
  .tip strong { color: var(--text); display: block; margin-bottom: 2px; font-size: 0.75rem; }
  .loading-state { min-height: 380px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
  .loading-state .big-spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
  .loading-state p { font-size: 0.8rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; animation: pulse 1.5s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
  .footer { text-align: center; margin-top: 60px; padding-top: 24px; border-top: 1px solid var(--border); font-size: 0.7rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
  /* AD SLOT */
  .ad-slot { margin-top: 48px; margin-bottom: 8px; width: 100%; }
  .ad-placeholder { width: 100%; min-height: 90px; border: 1.5px dashed var(--border); border-radius: 4px; display: flex; align-items: center; justify-content: center; background: var(--surface); color: var(--muted); font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.5; }
  /* CONTACT SECTION */
  .contact { margin-top: 64px; padding-top: 48px; border-top: 1px solid var(--border); text-align: center; }
  .contact-label { font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; }
  .contact h2 { font-family: 'Space Grotesk', sans-serif; font-size: clamp(1.6rem, 4vw, 2.4rem); letter-spacing: -0.5px; margin-bottom: 10px; }
  .contact h2 span { color: var(--accent); }
  .contact p { font-size: 0.85rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; max-width: 480px; margin: 0 auto 32px; line-height: 1.7; }
  .contact-links { display: flex; justify-content: center; flex-wrap: wrap; gap: 12px; }
  .contact-link { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; color: var(--text); font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; text-decoration: none; transition: all 0.2s; }
  .contact-link:hover { border-color: var(--accent); color: var(--accent); transform: translateY(-2px); }
  .contact-link .icon { font-size: 1rem; }
  /* TOASTS */
  .toast-container { position: fixed; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 8px; z-index: 9999; pointer-events: none; }
  .toast { display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; border-radius: 4px; font-size: 0.78rem; font-family: 'JetBrains Mono', monospace; line-height: 1.5; max-width: 360px; pointer-events: auto; animation: toastIn 0.25s ease forwards; border: 1px solid; }
  @keyframes toastIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .toast.dismissing { animation: toastOut 0.25s ease forwards; }
  @keyframes toastOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(10px); } }
  .toast-error { background: rgba(255,69,69,0.12); border-color: rgba(255,69,69,0.35); color: #ff7070; }
  .toast-success { background: rgba(108,99,255,0.1); border-color: rgba(108,99,255,0.3); color: var(--accent); }
  .toast-info { background: var(--surface2); border-color: var(--border); color: var(--muted); }
  .toast-close { background: none; border: none; color: inherit; opacity: 0.7; cursor: pointer; font-size: 1.1rem; padding: 0; line-height: 1; flex-shrink: 0; margin-top: 1px; }
  .toast-close:hover { opacity: 1; }
  /* DARK THEME */
  [data-theme="dark"] {
    --bg: #131318; --surface: #1b1b20; --surface2: #2a292f;
    --border: #464555; --text: #e4e1e9; --muted: #918fa1;
    --accent: #8781ff; --accent2: #c4c0ff;
  }
  [data-theme="dark"] body { background: var(--bg); }
  /* THEME TOGGLE */
  .theme-btn { background: var(--surface2); border: 1px solid var(--border); color: var(--text); width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
  .theme-btn:hover { border-color: var(--accent); transform: rotate(20deg); }
  /* ENTRANCE ANIMATIONS */
  @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .hero { animation: fadeSlideUp 0.55s ease both; }
  .how-strip { animation: fadeSlideUp 0.55s 0.1s ease both; }
  .trust-badges { animation: fadeSlideUp 0.55s 0.18s ease both; }
  .main-grid { animation: fadeSlideUp 0.55s 0.25s ease both; }
  .testimonials { animation: fadeSlideUp 0.55s 0.32s ease both; }
  /* PANEL GLOW */
  .panel { box-shadow: 0 0 0 1px rgba(108,99,255,0.15), 0 8px 32px rgba(0,0,0,0.28); }
  /* HERO */
  .hero { margin-bottom: 48px; }
  .hero-tagline { font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
  .hero-tagline::before { content: ''; display: inline-block; width: 24px; height: 1px; background: var(--accent); }
  .hero h2 { font-family: 'Space Grotesk', sans-serif; font-size: clamp(2.2rem, 5.5vw, 3.8rem); line-height: 1.06; letter-spacing: -1.5px; margin-bottom: 16px; }
  .hero h2 span { background: linear-gradient(135deg, var(--accent2) 0%, var(--accent) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .hero-sub { font-size: 0.88rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; line-height: 1.75; max-width: 500px; margin-bottom: 30px; }
  .hero-stats { display: flex; gap: 32px; flex-wrap: wrap; }
  .hero-stat .num { font-family: 'Space Grotesk', sans-serif; font-size: 1.9rem; color: var(--accent); display: block; line-height: 1; }
  .hero-stat .label { font-size: 0.68rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; letter-spacing: 0.06em; margin-top: 2px; display: block; }
  /* HOW IT WORKS */
  .how-strip { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 4px; overflow: hidden; margin-bottom: 20px; }
  .how-step { background: var(--surface); padding: 20px; display: flex; align-items: flex-start; gap: 14px; }
  .how-num { font-family: 'Space Grotesk', sans-serif; font-size: 2rem; color: var(--accent); opacity: 0.35; line-height: 1; flex-shrink: 0; }
  .how-text h4 { font-size: 0.82rem; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.03em; }
  .how-text p { font-size: 0.72rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; line-height: 1.55; }
  @media (max-width: 600px) { .how-strip { grid-template-columns: 1fr; } }
  /* TRUST BADGES */
  .trust-badges { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 32px; }
  .trust-badge { display: flex; align-items: center; gap: 5px; padding: 5px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 100px; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: var(--muted); }
  .trust-badge .check { color: var(--accent); }
  /* TESTIMONIALS */
  .testimonials { margin-top: 48px; }
  .testimonials-label { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 14px; }
  .testimonials-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
  .testimonial { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 18px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
  .testimonial-stars { font-size: 0.72rem; color: var(--accent); margin-bottom: 10px; letter-spacing: 2px; }
  .testimonial p { font-size: 0.78rem; color: var(--text); font-family: 'JetBrains Mono', monospace; line-height: 1.65; margin-bottom: 14px; opacity: 0.88; }
  .testimonial-author { display: flex; align-items: center; gap: 10px; }
  .testimonial-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent2)); display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 700; color: #fff; flex-shrink: 0; }
  .testimonial-name { font-size: 0.76rem; font-weight: 700; }
  .testimonial-role { font-size: 0.67rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
  @media (max-width: 700px) { .testimonials-grid { grid-template-columns: 1fr; } }
  /* MOBILE FIXES */
  @media (max-width: 480px) {
    .tips-grid { grid-template-columns: 1fr; }
    .score-card { flex-direction: column; gap: 10px; }
    .score-num { font-size: 2.2rem; min-width: auto; }
    .output-actions { flex-direction: column; }
    .toast-container { right: 16px; left: 16px; bottom: 16px; }
    .toast { max-width: 100%; }
  }
`;

const LOADING_MESSAGES = [
  "Parsing your CV structure...",
  "Identifying key skills and experience...",
  "Reformatting for ATS compatibility...",
  "Optimizing keywords and sections...",
  "Generating your PDF layout...",
];

// ─── PDF Generator ────────────────────────────────────────────────────────────
function generatePDF(data) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 28;          // narrower margins → wider content
  const contentW = pageW - margin * 2;
  let y = 36;

  const checkPage = (needed = 20) => {
    if (y + needed > pageH - 32) { doc.addPage(); y = 36; }
  };

  const sectionTitle = (text) => {
    checkPage(30);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(text.toUpperCase(), margin, y);
    doc.setDrawColor(30, 30, 30);
    doc.setLineWidth(1);
    doc.line(margin, y + 3, margin + contentW, y + 3);
    y += 16;
  };

  // NAME
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(10, 10, 10);
  doc.text(data.name || "Your Name", margin, y);
  y += 26;

  // CONTACT
  const contactParts = [data.email, data.phone, data.location, data.linkedin].filter(Boolean);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const contactLine = doc.splitTextToSize(contactParts.join("  |  "), contentW);
  contactLine.forEach(line => { doc.text(line, margin, y); y += 13; });
  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + contentW, y);
  y += 14;

  // SUMMARY
  if (data.summary) {
    sectionTitle("Professional Summary");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(data.summary, contentW);
    lines.forEach(line => { checkPage(14); doc.text(line, margin, y); y += 14; });
    y += 4;
  }

  // EXPERIENCE
  if (data.experience?.length > 0) {
    sectionTitle("Work Experience");
    data.experience.forEach(job => {
      checkPage(44);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(10, 10, 10);
      doc.text(job.title || "", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const durW = doc.getTextWidth(job.duration || "");
      doc.text(job.duration || "", margin + contentW - durW, y);
      y += 15;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(job.company || "", margin, y);
      y += 13;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);
      (job.bullets || []).forEach(bullet => {
        const blines = doc.splitTextToSize(`• ${bullet}`, contentW - 12);
        blines.forEach((line, i) => {
          checkPage(13);
          doc.text(i === 0 ? line : `  ${line.trim()}`, margin + 8, y);
          y += 13;
        });
      });
      y += 6;
    });
  }

  // EDUCATION
  if (data.education?.length > 0) {
    sectionTitle("Education");
    data.education.forEach(edu => {
      checkPage(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(10, 10, 10);
      doc.text(edu.degree || "", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const yearW = doc.getTextWidth(edu.year || "");
      doc.text(edu.year || "", margin + contentW - yearW, y);
      y += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text(edu.institution || "", margin, y);
      y += 18;
    });
  }

  // SKILLS
  if (data.skills?.length > 0) {
    sectionTitle("Skills");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    // Print 3 skills per row
    const cols = 3;
    const colW = contentW / cols;
    for (let i = 0; i < data.skills.length; i += cols) {
      checkPage(14);
      for (let j = 0; j < cols; j++) {
        if (data.skills[i + j]) {
          doc.text(`• ${data.skills[i + j]}`, margin + j * colW, y);
        }
      }
      y += 14;
    }
    y += 4;
  }

  // LANGUAGES
  if (data.languages?.length > 0) {
    sectionTitle("Languages");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    const cols = 3;
    const colW = contentW / cols;
    for (let i = 0; i < data.languages.length; i += cols) {
      checkPage(28);
      for (let j = 0; j < cols; j++) {
        const lang = data.languages[i + j];
        if (lang) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(30, 30, 30);
          doc.text(lang.language || "", margin + j * colW, y);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.text(lang.level || "", margin + j * colW, y + 13);
        }
      }
      y += 28;
    }
    y += 4;
  }

  // CERTIFICATIONS
  if (data.certifications?.length > 0) {
    sectionTitle("Certifications");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    data.certifications.forEach(cert => {
      checkPage(14);
      doc.text(`• ${cert}`, margin + 8, y);
      y += 14;
    });
    y += 4;
  }

  // HOBBIES
  if (data.hobbies?.length > 0) {
    sectionTitle("Hobbies & Interests");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    const hobbiesText = data.hobbies.join("  •  ");
    const hlines = doc.splitTextToSize(hobbiesText, contentW);
    hlines.forEach(line => { checkPage(14); doc.text(line, margin, y); y += 14; });
    y += 4;
  }

  // REFERENCES
  if (data.references?.length > 0) {
    sectionTitle("References");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    // Check if "available upon request"
    if (data.references.length === 1 && data.references[0].name?.toLowerCase().includes("available")) {
      checkPage(14);
      doc.text("Available upon request", margin, y);
      y += 14;
    } else {
      const cols = 2;
      const colW = contentW / cols;
      for (let i = 0; i < data.references.length; i += cols) {
        checkPage(56);
        for (let j = 0; j < cols; j++) {
          const ref = data.references[i + j];
          if (ref) {
            const x = margin + j * colW;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(20, 20, 20);
            doc.text(ref.name || "", x, y);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(60, 60, 60);
            if (ref.title) { doc.text(ref.title, x, y + 13); }
            if (ref.company) { doc.text(ref.company, x, y + 26); }
            if (ref.contact) { doc.text(ref.contact, x, y + 39); }
          }
        }
        y += 56;
      }
    }
  }

  doc.save("ats-optimized-cv.pdf");
}

// ─── Toast Container ─────────────────────────────────────────────────────────
function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}${t.dismissing ? " dismissing" : ""}`}>
          <span style={{ flex: 1 }}>{t.type === "error" ? "⚠ " : t.type === "success" ? "✓ " : "ℹ "}{t.message}</span>
          <button className="toast-close" onClick={() => onDismiss(t.id)} aria-label="Dismiss">×</button>
        </div>
      ))}
    </div>
  );
}

// ─── CV Preview ───────────────────────────────────────────────────────────────
function CVPreview({ data }) {
  return (
    <div className="cv-preview">
      <div className="cv-name">{data.name || "Your Name"}</div>
      <div className="cv-contact">
        {[data.email, data.phone, data.location, data.linkedin].filter(Boolean).map((c, i) => (
          <span key={i}>{c}</span>
        ))}
      </div>

      {data.summary && (<><div className="cv-section-title">Professional Summary</div><div className="cv-summary">{data.summary}</div></>)}

      {data.experience?.length > 0 && (
        <><div className="cv-section-title">Work Experience</div>
        {data.experience.map((job, i) => (
          <div className="cv-job" key={i}>
            <div className="cv-job-header">
              <div><span className="cv-job-title">{job.title}</span>{job.company && <span className="cv-job-company"> — {job.company}</span>}</div>
              <span className="cv-job-duration">{job.duration}</span>
            </div>
            <ul className="cv-bullets">{(job.bullets || []).map((b, j) => <li key={j}>{b}</li>)}</ul>
          </div>
        ))}</>
      )}

      {data.education?.length > 0 && (
        <><div className="cv-section-title">Education</div>
        {data.education.map((edu, i) => (
          <div className="cv-edu-row" key={i}>
            <div><div className="cv-edu-degree">{edu.degree}</div><div className="cv-edu-school">{edu.institution}</div></div>
            <div className="cv-edu-year">{edu.year}</div>
          </div>
        ))}</>
      )}

      {data.skills?.length > 0 && (
        <><div className="cv-section-title">Skills</div>
        <div className="cv-skills-wrap">{data.skills.map((s, i) => <span className="cv-skill" key={i}>{s}</span>)}</div></>
      )}

      {data.languages?.length > 0 && (
        <><div className="cv-section-title">Languages</div>
        <div className="cv-lang-grid">
          {data.languages.map((l, i) => (
            <div key={i}><div className="cv-lang-item">{l.language}</div><div className="cv-lang-level">{l.level}</div></div>
          ))}
        </div></>
      )}

      {data.certifications?.length > 0 && (
        <><div className="cv-section-title">Certifications</div>
        <ul className="cv-bullets">{data.certifications.map((c, i) => <li key={i}>{c}</li>)}</ul></>
      )}

      {data.hobbies?.length > 0 && (
        <><div className="cv-section-title">Hobbies & Interests</div>
        <div className="cv-hobbies">{data.hobbies.join("  •  ")}</div></>
      )}

      {data.references?.length > 0 && (
        <><div className="cv-section-title">References</div>
        {data.references[0]?.name?.toLowerCase().includes("available") ? (
          <div className="cv-hobbies">Available upon request</div>
        ) : (
          <div className="cv-ref-grid">
            {data.references.map((r, i) => (
              <div className="cv-ref-item" key={i}>
                <div className="cv-ref-name">{r.name}</div>
                {r.title && <div>{r.title}</div>}
                {r.company && <div>{r.company}</div>}
                {r.contact && <div style={{color:"#777"}}>{r.contact}</div>}
              </div>
            ))}
          </div>
        )}</>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [file, setFile] = useState(null);
  const [rawText, setRawText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [toasts, setToasts] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const [theme, setTheme] = useState("light");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef();

  // Sync theme with <html> attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Animate score count-up when result arrives
  useEffect(() => {
    if (!result?.score) { setDisplayScore(0); return; }
    let cur = 0;
    const target = result.score;
    const step = Math.max(1, Math.round(target / 55));
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      setDisplayScore(cur);
      if (cur >= target) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [result]);

  // Push AdSense ad after component mounts (required in React SPAs)
  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (_) {}
  }, []);

  const showToast = (message, type = "error") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, dismissing: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, dismissing: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 260);
    }, 4500);
  };
  const dismissToast = (id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, dismissing: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 260);
  };

  const extractText = async (f) => {
    const ext = f.name.split(".").pop().toLowerCase();
    if (ext === "txt") return await f.text();
    if (ext === "docx") {
      const buf = await f.arrayBuffer();
      const res = await mammoth.extractRawText({ arrayBuffer: buf });
      return res.value;
    }
    if (ext === "pdf") {
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
    const MAX_FILE_SIZE_MB = 10;
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      showToast(`File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Max allowed is ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    setExtracting(true);
    try { const text = await extractText(f); setFile(f); setRawText(text); }
    catch (e) { showToast(e.message); }
    finally { setExtracting(false); }
  };

  const convert = async () => {
    const cvContent = rawText.trim();
    if (!cvContent) { showToast("Please upload a CV or paste your CV text."); return; }
    setLoading(true); setResult(null);
    let msgIdx = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    const interval = setInterval(() => { msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length; setLoadingMsg(LOADING_MESSAGES[msgIdx]); }, 2000);
    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText: cvContent, jobTitle }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong");
      setResult(data.result);
    } catch (e) {
      showToast("Error: " + e.message);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const reset = () => { setFile(null); setRawText(""); setResult(null); setJobTitle(""); setToasts([]); setDisplayScore(0); setCopied(false); };

  const copyAsText = () => {
    if (!result) return;
    const lines = [
      result.name, result.email, result.phone, result.location, result.linkedin,
      "", "PROFESSIONAL SUMMARY", result.summary,
      "", "WORK EXPERIENCE",
      ...(result.experience || []).flatMap(j => [
        `${j.title} — ${j.company} (${j.duration})`,
        ...(j.bullets || []).map(b => `• ${b}`),
      ]),
      "", "EDUCATION",
      ...(result.education || []).map(e => `${e.degree} | ${e.institution} | ${e.year}`),
      "", "SKILLS", (result.skills || []).join(", "),
      "", "LANGUAGES",
      ...(result.languages || []).map(l => `${l.language} — ${l.level}`),
    ].filter(l => l !== undefined).join("\n");
    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  return (
    <>
      <style>{STYLES}</style>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); }
      `}</style>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      
      {/* Tailwind Layout Wrapper */}
      <div className="dark min-h-screen bg-background text-on-surface selection:bg-primary/30 selection:text-primary font-body" dir="rtl">
        
        {/* TopNavBar */}
        <header className="fixed top-0 w-full z-50 bg-[#131318]/80 backdrop-blur-xl transition-all border-b border-white/5">
          <nav className="flex justify-between items-center px-4 md:px-8 h-20 max-w-7xl mx-auto">
            <div className="text-2xl font-black text-[#C4C0FF] tracking-tighter font-headline" style={{ direction: "ltr" }}>FixYourCV</div>
            <div className="hidden md:flex items-center gap-8">
              <span className="text-sm text-primary/80 border border-primary/20 px-3 py-1 rounded-full font-label">الأداة الأولى لتحسين السيرة الذاتية</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="w-10 h-10 rounded-full bg-surface-container border border-outline-variant/30 flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} aria-label="Toggle theme">
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
            </div>
          </nav>
        </header>

        <main className="pt-32">
          {/* Hero Section */}
          <section className="max-w-7xl mx-auto px-4 md:px-8 mb-24 md:mb-32">
            <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
              <span className="label-text text-xs uppercase text-primary border border-primary/20 px-4 py-1.5 rounded-full bg-primary/5">مدعوم بالذكاء الاصطناعي</span>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1] text-on-surface">
                 احصل على مقابلات عمل أكثر، <br className="hidden md:block"/><span className="hero-gradient inline-block mt-2 md:mt-0">ابتداءً من اليوم</span>
              </h1>
              <p className="text-on-surface-variant text-lg md:text-2xl max-w-2xl leading-relaxed">
                قم برفع سيرتك الذاتية واحصل على نسخة PDF محسنة ومصممة باحترافية لتتخطى أنظمة (ATS) في ثوانٍ — مجاناً بالكامل.
              </p>
              
              <div className="flex flex-wrap justify-center gap-6 mt-8">
                <div className="flex flex-col items-center"><span className="text-3xl font-black text-primary font-headline" style={{ direction: "ltr" }}>10K+</span><span className="text-sm text-on-surface-variant mt-1">سيرة ذاتية حسنت</span></div>
                <div className="w-px bg-white/10 hidden sm:block"></div>
                <div className="flex flex-col items-center"><span className="text-3xl font-black text-primary font-headline" style={{ direction: "ltr" }}>91%</span><span className="text-sm text-on-surface-variant mt-1">متوسط التقييم</span></div>
                <div className="w-px bg-white/10 hidden sm:block"></div>
                <div className="flex flex-col items-center"><span className="text-3xl font-black text-primary font-headline">مجاناً</span><span className="text-sm text-on-surface-variant mt-1">دائماً</span></div>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap justify-center gap-2 md:gap-3 mt-8">
                {[
                  ["✓", "مجاني الاستخدام"], ["✓", "لا حاجة لإنشاء حساب"], ["✓", "لا نحتفظ بسيرتك الذاتية"], 
                  ["✓", "تصدير PDF فوري"], ["✓", "مدعوم بالذكاء الاصطناعي"], ["✓", "متوافق مع أنظمة التوظيف (ATS)"]
                ].map(([c,t]) => (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container/50 border border-outline-variant/30 rounded-full text-xs text-on-surface-variant" key={t}>
                    <span className="text-primary font-bold">{c}</span>{t}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Tool Area: Bento Grid Layout */}
          <section className="max-w-7xl mx-auto px-4 md:px-8 mb-32" id="tool">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Drop Zone Panel */}
              <div className="lg:col-span-7 glass-card rounded-2xl p-6 md:p-10 relative overflow-hidden group border border-white/5 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
                
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-on-surface relative z-10"><span className="bg-primary/20 text-primary px-2 rounded font-mono text-sm" style={{ direction: "ltr" }}>01</span>سيرتك الذاتية</h2>
                
                {!file && !extracting ? (
                  <div className={`relative z-10 h-64 flex flex-col justify-center items-center border-2 border-dashed ${dragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-outline-variant/30 bg-surface-container-lowest/50'} rounded-xl cursor-pointer hover:border-primary/40 transition-all mb-8`}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}>
                    <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => handleFile(e.target.files[0])} />
                    <span className="material-symbols-outlined text-5xl text-primary mb-4 block" style={{fontVariationSettings: "'FILL' 0"}}>cloud_upload</span>
                    <h3 className="text-xl font-bold mb-2">ضع سيرتك الذاتية هنا</h3>
                    <p className="text-on-surface-variant text-sm font-mono">ندعم ملفات PDF، DOCX، أو TXT</p>
                  </div>
                ) : extracting ? (
                  <div className="relative z-10 h-64 flex flex-col justify-center items-center border-2 border-dashed border-primary/50 bg-primary/5 rounded-xl mb-8">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
                    <h3 className="text-lg font-bold text-primary mb-2">جاري قراءة سيرتك الذاتية...</h3>
                    <p className="text-on-surface-variant animate-pulse font-mono text-sm">استخراج النص من الملف الخاص بك</p>
                  </div>
                ) : (
                  <div className="relative z-10 p-5 flex flex-col sm:flex-row items-center justify-between border border-primary/30 bg-primary-container/10 rounded-xl mb-8 gap-4 shadow-inner">
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center text-primary text-xl shadow-sm">📄</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-bold text-on-surface truncate" style={{ direction: "ltr", textAlign: "right" }}>{file.name}</div>
                        <div className="text-sm text-on-surface-variant font-mono mt-1">{(file.size / 1024).toFixed(1)} KB · تعرّف على {rawText.split(/\s+/).length} كلمة</div>
                      </div>
                    </div>
                    <button className="bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 px-4 py-2 rounded-lg text-sm font-bold text-on-surface transition-colors shrink-0" onClick={reset}>حذف الملف</button>
                  </div>
                )}
                
                <div className="space-y-6 relative z-10">
                  <textarea className="w-full h-40 bg-surface-container-lowest/80 border border-outline-variant/30 focus:border-primary rounded-xl p-4 text-on-surface placeholder:text-outline-variant outline-none transition-colors resize-y font-mono text-sm leading-relaxed" placeholder="أو الصق نص سيرتك الذاتية مباشرة هنا..." value={rawText} onChange={(e) => setRawText(e.target.value)}></textarea>
                  
                  <div>
                    <label className="block text-xs font-bold text-primary tracking-widest uppercase mb-2">المسمى الوظيفي المستهدف (اختياري)</label>
                    <input type="text" className="w-full bg-surface-container-lowest/80 border border-outline-variant/30 focus:border-primary rounded-xl p-4 text-on-surface outline-none transition-colors font-mono text-sm" placeholder="مثال: مهندس برمجيات أول..." value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                  </div>

                  <button className="w-full cta-gradient px-8 py-4 rounded-xl text-lg font-bold text-white shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group" onClick={convert} disabled={loading || !rawText.trim()}>
                    {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> جاري التحويل...</> : <>← <span className="group-hover:translate-x-[-4px] transition-transform">تحويل وإنشاء PDF</span></>}
                  </button>
                </div>
                
                <div className="ai-pulse-line absolute left-0 top-1/4 bottom-1/4 rounded-full opacity-50"></div>
              </div>

              {/* Preview Area Panel */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-surface-container-low/80 backdrop-blur-md rounded-2xl p-6 md:p-8 flex flex-col flex-1 border border-outline-variant/10 shadow-2xl relative min-h-[500px]">
                  
                  <div className="flex justify-between items-center mb-6 border-b border-outline-variant/10 pb-4">
                    <span className="label-text text-sm font-bold text-primary flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> المعاينة والنتائج</span>
                    <span className="bg-surface-container px-3 py-1 rounded text-xs text-on-surface-variant font-mono" style={{ direction: "ltr" }}>02</span>
                  </div>

                  {loading ? (
                    <div className="flex flex-col items-center justify-center flex-1 space-y-4 text-center">
                      <div className="relative w-16 h-16">
                         <div className="absolute inset-0 border-4 border-surface-container rounded-full"></div>
                         <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="text-on-surface-variant font-mono text-sm mt-4" style={{ direction: "ltr" }}>{loadingMsg}</p>
                    </div>
                  ) : result ? (
                    <div className="flex flex-col h-full animate-[fadeSlideUp_0.4s_ease]">
                       {/* Score Header */}
                       {result.score != null && (
                         <div className="bg-primary-container/10 rounded-xl p-5 border border-primary/20 flex flex-col items-start justify-between mb-6 shadow-inner">
                           <div className="flex justify-between w-full items-center mb-4 cursor-default">
                             <div>
                               <p className="label-text text-[10px] sm:text-xs text-primary mb-1 uppercase tracking-widest">تحديث الحالة</p>
                               <p className="font-bold text-sm sm:text-base text-on-surface">معدل اجتياز الـ ATS</p>
                             </div>
                             <div className="relative">
                               <svg className="w-16 h-16 transform -rotate-90">
                                 <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-surface-container-high" />
                                 <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" style={{ strokeDasharray: 175, strokeDashoffset: 175 - (175 * result.score) / 100, transition: "stroke-dashoffset 1s ease-out" }} className="text-primary" />
                               </svg>
                               <div className="absolute inset-0 flex items-center justify-center font-headline font-black text-lg text-primary" style={{ direction: "ltr" }}>{displayScore}</div>
                             </div>
                           </div>
                           <p className="text-xs text-on-surface-variant leading-relaxed">من 100 — {result.score >= 80 ? "ممتاز! السيرة جاهزة وتواكب أفضل المعايير." : result.score >= 60 ? "جيد، لكن القليل من التحسينات ستزيد فرصك." : "يحتاج إلى تحسين جذري للحصول على مقابلات."}</p>
                         </div>
                       )}

                       {/* The PDF Preview */}
                       <div className="flex-1 bg-white rounded-xl p-3 sm:p-5 overflow-hidden relative shadow-inner border border-outline-variant/5 mb-6 opacity-95 hover:opacity-100 transition-opacity min-h-[400px]">
                         <div className="absolute inset-0 overflow-y-auto custom-scrollbar" style={{ direction: "ltr", textAlign: "left" }}>
                           <CVPreview data={result} />
                         </div>
                       </div>
                       
                       {/* Output Actions */}
                       <div className="flex flex-wrap gap-3 mt-auto pt-2">
                         <button className="flex-1 cta-gradient text-white py-3.5 px-4 rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-lg shadow-primary/20" onClick={() => generatePDF(result)}>
                           <span className="material-symbols-outlined text-lg">download</span> تحميل PDF
                         </button>
                         <button className="bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-white py-3.5 px-4 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2" onClick={copyAsText}>
                           {copied ? <span className="material-symbols-outlined text-lg text-green-400">check</span> : <span className="material-symbols-outlined text-lg">content_copy</span>} {copied ? "تم النسخ!" : "نسخ النص"}
                         </button>
                       </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center flex-1 text-center opacity-30 select-none">
                      <div className="space-y-4 w-full px-8">
                        <div className="h-4 bg-surface-container-highest rounded-full w-3/4 mx-auto"></div>
                        <div className="h-4 bg-surface-container-highest rounded-full w-full mx-auto"></div>
                        <div className="h-4 bg-surface-container-highest rounded-full w-5/6 mx-auto"></div>
                        <div className="pt-8 space-y-4">
                          <div className="h-24 bg-surface-container-highest/60 rounded-xl w-full"></div>
                          <div className="h-24 bg-surface-container-highest/60 rounded-xl w-full"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </section>

          {/* Ad Slot Section */}
          <section className="max-w-7xl mx-auto px-4 md:px-8 mb-32">
             <div className="w-full bg-surface-container-lowest/30 border border-outline-variant/10 rounded-2xl p-4 flex items-center justify-center min-h-[140px] shadow-sm">
                <ins className="adsbygoogle"
                  style={{ display: "block", textAlign: "center" }}
                  data-ad-client="ca-pub-2579012016746124"
                  data-ad-slot="auto"
                  data-ad-format="auto"
                  data-full-width-responsive="true" />
             </div>
          </section>

          {/* 3-Step Guide */}
          <section className="max-w-7xl mx-auto px-4 md:px-8 mb-40">
            <div className="text-center mb-16 md:mb-24">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 text-on-surface">الدقة في ثلاث خطوات</h2>
              <div className="h-1.5 w-24 bg-primary/80 mx-auto rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
              <div className="space-y-6">
                <div className="text-7xl font-black text-outline-variant/20 font-headline italic" style={{ direction: "ltr", textAlign: "right" }}>01</div>
                <h3 className="text-2xl font-bold text-on-surface border-b border-primary/20 pb-2 inline-block">رفع السيرة الذاتية</h3>
                <p className="text-on-surface-variant leading-relaxed text-lg">قم برفع سيرتك الذاتية بأمان. نحن ندعم جميع الصيغ الرئيسية بما في ذلك PDF، و DOCX، والنص المباشر.</p>
              </div>
              <div className="space-y-6 relative">
                <div className="text-7xl font-black text-outline-variant/20 font-headline italic" style={{ direction: "ltr", textAlign: "right" }}>02</div>
                <h3 className="text-2xl font-bold text-on-surface border-b border-primary/20 pb-2 inline-block">تحليل الذكاء الاصطناعي</h3>
                <p className="text-on-surface-variant leading-relaxed text-lg">يقوم الذكاء الاصطناعي الخاص بنا بتحديد الفجوات وإصلاح الكلمات المفتاحية ومشاكل التنسيق التي تعيق وصولك.</p>
                <div className="hidden md:block absolute -left-8 lg:-left-12 top-1/2 -translate-y-1/2 text-outline-variant/20 rotate-180">
                  <span className="material-symbols-outlined text-4xl">trending_flat</span>
                </div>
              </div>
              <div className="space-y-6">
                <div className="text-7xl font-black text-outline-variant/20 font-headline italic" style={{ direction: "ltr", textAlign: "right" }}>03</div>
                <h3 className="text-2xl font-bold text-on-surface border-b border-primary/20 pb-2 inline-block">تحميل ملف PDF</h3>
                <p className="text-on-surface-variant leading-relaxed text-lg">احصل على ملف PDF بتصميم نظيف ومتوافق تماماً مع أنظمة الفرز (ATS)، جاهز للتقديم الفوري.</p>
              </div>
            </div>
          </section>
        </main>

        <footer className="bg-[#0e0e13] border-t border-outline-variant/10">
          <div className="flex flex-col md:flex-row justify-between items-center px-4 md:px-8 py-10 max-w-7xl mx-auto gap-8">
            <div className="text-xl font-black text-primary font-headline tracking-tighter" style={{ direction: "ltr" }}>FixYourCV</div>
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
              <a className="text-on-surface-variant hover:text-primary transition-colors font-body text-sm" href="mailto:your@email.com">تواصل معنا</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors font-body text-sm" href="https://twitter.com/yourhandle">تويتر 𝕏</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors font-body text-sm" href="https://github.com/yourusername">جيت هب</a>
            </div>
            <div className="text-primary/40 font-mono text-xs" style={{ direction: "ltr" }}>
              © 2024 FixYourCV. AI-Powered Excellence.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
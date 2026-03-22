import { useState, useRef, useEffect } from "react";
import * as mammoth from "mammoth";
import jsPDF from "jspdf";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&family=JetBrains+Mono:wght@400;500&family=Cairo:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --bg: #f4f4fe; --surface: #ffffff; --surface2: #ebebfa;
    --border: #d5d5ef; --accent: #6C63FF; --accent2: #8B83FF;
    --text: #111118; --muted: #7070a0; --danger: #ff4545;
  }
  body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; min-height: 100vh; }
  .app { max-width: 1100px; margin: 0 auto; padding: 40px 24px 80px; }
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 56px; padding: 20px 0; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; background: var(--bg); }
  .header::before { content: ""; position: absolute; inset: 0; backdrop-filter: blur(10px); z-index: -1; }
  .header-left, .header-right { flex: 1; }
  .header-right { display: flex; gap: 10px; justify-content: flex-end; }
  .header-center { display: flex; flex-direction: column; align-items: center; text-align: center; }
  @media (max-width: 700px) {
    .header { flex-direction: column-reverse; gap: 24px; }
    .header-right { justify-content: center; }
    .header-left { display: none; }
  }
  .logo-area h1 { font-family: 'Space Grotesk', sans-serif; font-size: clamp(2rem, 5vw, 3.2rem); line-height: 1.05; letter-spacing: -1px; }
  .logo-area h1 span { background: linear-gradient(135deg, var(--accent2) 0%, var(--accent) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .logo-area p { color: var(--muted); font-family: 'JetBrains Mono', monospace; font-size: 1rem; margin-top: 8px; letter-spacing: 0.05em; }
  .badge { background: linear-gradient(135deg, var(--accent2) 0%, var(--accent) 100%); color: #fff; font-size: 0.9rem; font-weight: 700; padding: 4px 10px; border-radius: 2px; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 8px; display: inline-block; }
  .ar { direction: rtl; text-align: right; font-family: 'Cairo', 'Inter', Tahoma, Arial, sans-serif; font-weight: 600; }
  .ar-center { direction: rtl; text-align: center; font-family: 'Cairo', 'Inter', Tahoma, Arial, sans-serif; font-weight: 600; }
  .main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
  @media (max-width: 700px) { .main-grid { grid-template-columns: 1fr; } }
  .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
  .panel-header { display: flex; align-items: center; gap: 10px; padding: 16px 20px; border-bottom: 1px solid var(--border); background: var(--surface2); }
  .panel-header .num { font-family: 'JetBrains Mono', monospace; font-size: 1rem; color: var(--accent); background: rgba(108,99,255,0.12); padding: 2px 8px; border-radius: 2px; }
  .panel-header h2 { font-size: 1.25rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
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
  .upload-zone h3 { font-size: 1.35rem; font-weight: 700; margin-bottom: 6px; }
  .upload-zone p { font-size: 1.05rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; font-weight: 500; }
  .file-loaded { border: 1px solid rgba(108,99,255,0.35); background: rgba(108,99,255,0.06); border-radius: 4px; padding: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .file-loaded .file-info { flex: 1; min-width: 0; }
  .file-loaded .file-name { font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--accent); }
  .file-loaded .file-meta { font-size: 0.7rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; margin-top: 2px; }
  .btn-remove { background: none; border: 1px solid var(--border); color: var(--muted); padding: 4px 10px; cursor: pointer; font-size: 0.75rem; border-radius: 2px; font-family: 'Inter', sans-serif; transition: all 0.2s; white-space: nowrap; }
  .btn-remove:hover { border-color: var(--danger); color: var(--danger); }
  .cv-textarea { width: 100%; min-height: 220px; background: var(--bg); border: 1px solid var(--border); color: var(--text); font-family: 'JetBrains Mono', monospace; font-size: 0.95rem; line-height: 1.6; padding: 14px; border-radius: 4px; resize: vertical; transition: border-color 0.2s; margin-top: 16px; }
  .cv-textarea:focus { outline: none; border-color: var(--accent); }
  .cv-textarea::placeholder { color: var(--muted); font-size: 1.05rem; }
  .field-label { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; margin-top: 16px; display: block; }
  .job-input { width: 100%; background: var(--bg); border: 1px solid var(--border); color: var(--text); font-family: 'Inter', sans-serif; font-size: 0.9rem; padding: 10px 14px; border-radius: 4px; transition: border-color 0.2s; }
  .job-input:focus { outline: none; border-color: var(--accent); }
  .job-input::placeholder { color: var(--muted); font-size: 1.05rem; }
  .btn-convert { width: 100%; margin-top: 20px; padding: 14px; background: linear-gradient(135deg, var(--accent2) 0%, var(--accent) 100%); color: #fff; border: none; font-family: 'Inter', sans-serif; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border-radius: 4px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .btn-convert:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 4px 20px rgba(108,99,255,0.4); }
  .btn-convert:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .output-empty { min-height: 380px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--muted); text-align: center; }
  .output-empty .arrow { font-size: 2rem; animation: float 2s ease-in-out infinite; }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  .output-empty p { font-size: 1.05rem; font-family: 'JetBrains Mono', monospace; font-weight: 500; }
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
  .tip { background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; padding: 12px; font-size: 0.9rem; font-weight: 500; color: var(--muted); font-family: 'JetBrains Mono', monospace; line-height: 1.5; }
  .tip strong { color: var(--text); display: block; margin-bottom: 2px; font-size: 1rem; font-weight: 700; }
  .tips-grid.ar .tip { font-family: 'Cairo', 'Inter', Tahoma, Arial, sans-serif; font-size: 0.9rem; font-weight: 500; }
  .tips-grid.ar .tip strong { font-size: 1rem; font-weight: 700; }
  .loading-state { min-height: 380px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
  .loading-state .big-spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
  .loading-state p { font-size: 0.8rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; animation: pulse 1.5s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
  .footer { text-align: center; margin-top: 60px; padding-top: 24px; border-top: 1px solid var(--border); font-size: 0.7rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
  /* AD SLOT */
  .ad-slot { margin-top: 48px; margin-bottom: 8px; width: 100%; }
  .ad-placeholder { width: 100%; min-height: 90px; border: 1.5px dashed var(--border); border-radius: 4px; display: flex; align-items: center; justify-content: center; background: var(--surface); color: var(--muted); font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.5; }
  /* PUB CONTENT */
  .pub-content { margin-top: 64px; border-top: 1px solid var(--border); padding-top: 48px; }
  .pub-section { margin-bottom: 40px; }
  .pub-section h2 { font-family: 'Space Grotesk', sans-serif; font-size: clamp(1.6rem, 4vw, 2.2rem); margin-bottom: 16px; color: var(--text); }
  .pub-section h3 { font-family: 'Inter', sans-serif; font-size: 1.25rem; font-weight: 700; margin-top: 24px; margin-bottom: 8px; color: var(--text); }
  .pub-section p { font-size: 1.05rem; color: var(--muted); line-height: 1.75; margin-bottom: 16px; }
  .faq-item { background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; padding: 20px; margin-bottom: 12px; }
  .faq-item h4 { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; color: var(--text); }
  .faq-item p { font-size: 0.95rem; color: var(--muted); line-height: 1.6; margin: 0; }
  .pub-content.ar h2, .pub-content.ar h3, .pub-content.ar h4, .pub-content.ar p { font-family: 'Cairo', 'Inter', Tahoma, Arial, sans-serif; }

  /* CONTACT SECTION */
  .contact { margin-top: 64px; padding-top: 48px; border-top: 1px solid var(--border); text-align: center; }
  .contact-label { font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; }
  .contact h2 { font-family: 'Space Grotesk', sans-serif; font-size: clamp(1.6rem, 4vw, 2.4rem); letter-spacing: -0.5px; margin-bottom: 10px; }
  .contact h2 span { color: var(--accent); }
  .contact p { font-size: 1.15rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; font-weight: 500; max-width: 480px; margin: 0 auto 32px; line-height: 1.7; }
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
  .hero-sub { font-size: 1.15rem; font-weight: 500; color: var(--muted); font-family: 'JetBrains Mono', monospace; line-height: 1.75; max-width: 500px; margin-bottom: 30px; }
  .hero-sub.ar { font-size: 1.15rem; font-family: 'Cairo', 'Inter', Tahoma, Arial, sans-serif; font-weight: 500; }
  .hero-stats { display: flex; gap: 32px; flex-wrap: wrap; }
  .hero-stat .num { font-family: 'Space Grotesk', sans-serif; font-size: 1.9rem; color: var(--accent); display: block; line-height: 1; }
  .hero-stat .label { font-size: 0.68rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; letter-spacing: 0.06em; margin-top: 2px; display: block; }
  /* HOW IT WORKS */
  .how-strip { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 4px; overflow: hidden; margin-bottom: 20px; }
  .how-step { background: var(--surface); padding: 20px; display: flex; align-items: flex-start; gap: 14px; }
  .how-num { font-family: 'Space Grotesk', sans-serif; font-size: 2rem; color: var(--accent); opacity: 0.35; line-height: 1; flex-shrink: 0; }
  .how-text h4 { font-size: 1.1rem; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.03em; }
  .how-text p { font-size: 0.95rem; font-weight: 500; color: var(--muted); font-family: 'JetBrains Mono', monospace; line-height: 1.55; }
  .how-strip.ar .how-text h4 { font-family: 'Cairo', 'Inter', Tahoma, Arial, sans-serif; font-size: 1.1rem; }
  .how-strip.ar .how-text p { font-family: 'Cairo', 'Inter', Tahoma, Arial, sans-serif; font-size: 0.95rem; font-weight: 500; }
  @media (max-width: 600px) { .how-strip { grid-template-columns: 1fr; } }
  /* TRUST BADGES */
  .trust-badges { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 32px; }
  .trust-badge { display: flex; align-items: center; gap: 5px; padding: 5px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 100px; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; font-weight: 500; color: var(--muted); }
  .trust-badges.ar .trust-badge { font-family: 'Cairo', 'Inter', Tahoma, Arial, sans-serif; font-size: 0.85rem; font-weight: 500; }
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
  /* ARABIC SCALING */
  [dir="rtl"] .contact p, [dir="rtl"] .upload-zone p, [dir="rtl"] .upload-zone h3, [dir="rtl"] .output-empty p, [dir="rtl"] .cv-textarea::placeholder, [dir="rtl"] .job-input::placeholder {
    font-family: 'Cairo', 'Inter', Tahoma, Arial, sans-serif;
    font-weight: 600;
  }
  [dir="rtl"] .contact p { font-size: 1.15rem; }
  [dir="rtl"] .upload-zone h3 { font-size: 1.35rem; font-weight: 700; }
  [dir="rtl"] .upload-zone p { font-size: 1.05rem; }
  [dir="rtl"] .output-empty p { font-size: 1.05rem; }
  [dir="rtl"] .cv-textarea::placeholder, [dir="rtl"] .job-input::placeholder { font-size: 1.05rem; }
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
                  {r.contact && <div style={{ color: "#777" }}>{r.contact}</div>}
                </div>
              ))}
            </div>
          )}</>
      )}
    </div>
  );
}

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
const DICT = {
  en: {
    navSubtitle: "The #1 AI Resume Optimizer", heroBadge: "AI-Powered Career Catalyst",
    heroTitle1: "Land more interviews, ", heroTitle2: "starting today",
    heroSub: "Transform your messy experience into a high-performance ATS-optimized CV in seconds. Let the Luminescent Curator handle the precision.",
    stat1: "10K+", stat1Lbl: "Resumes Optimized", stat2: "91%", stat2Lbl: "Average ATS Score", stat3: "Free", stat3Lbl: "Forever",
    trust1: "Free to use", trust2: "No account needed", trust3: "We don't store your CV",
    trust4: "Instant PDF Export", trust5: "AI-Powered Analysis", trust6: "ATS-Friendly Format",
    step1num: "01", step1title: "Your CV", dropArea: "Drop your CV here", supports: "Supports PDF, DOCX, or TXT",
    reading: "Reading your CV...", extracting: "Extracting text from your file", found: "Found {word} words",
    remove: "Remove file", paste: "Or paste your resume text directly here...",
    jobLabel: "Target Job Title (Optional)", jobPh: "e.g., Senior Software Engineer...",
    convert: "Optimize & Generate PDF", converting: "Optimizing...", step2num: "02", step2title: "Preview & Results",
    statusLabel: "Status Update", statusTitle: "ATS Compatibility Score", scoreMax: "Out of 100 — ",
    scoreGood: "Excellent! Your CV is ready and meets top standards.", scoreOk: "Good, but a few tweaks will increase your chances.", scoreBad: "Needs major improvements to land interviews.",
    download: "Export PDF", copy: "Copy Text", copied: "Copied!", guideTitle: "Precision in three steps",
    g1num: "01", g1title: "Upload CV", g1desc: "Securely upload your current resume. We support all major formats including PDF, DOCX, and TXT.",
    g2num: "02", g2title: "AI Analysis", g2desc: "Our proprietary AI identifies gaps, keywords, and formatting issues that hold you back from top roles.",
    g3num: "03", g3title: "Export PDF", g3desc: "Receive a clean, ATS-compliant PDF ready for submission. Optimized for both humans and bots.",
    footerText: "© 2026 FlipYourCV. AI-Powered Excellence.", contact: "Contact", twitter: "Twitter 𝕏", github: "GitHub",
    guideAtsTitle: "The Ultimate Guide to ATS CV Optimization",
    guideAtsP1: "An Applicant Tracking System (ATS) is a software application that enables the electronic handling of recruitment needs. Over 98% of Fortune 500 companies use ATS software to filter resumes. If your CV is not formatted correctly, or lacks the exact keywords from the job description, the ATS will automatically reject it before a human ever sees it.",
    guideAtsH1: "Why Traditional Resumes Fail",
    guideAtsP2: "Many job seekers use complex templates, multiple columns, images, and unique fonts to stand out. While visually appealing to a human, these elements confuse ATS parsing algorithms. Our AI Optimizer strips away unreadable formatting and rebuilds your resume in a clean, linear textual format that scores 100% on ATS parsers.",
    guideAtsH2: "How Our AI Keyword Optimization Works",
    guideAtsP3: "By analyzing the target job title you provide, our AI contextualizes your experience and ensures that industry-standard terminology is appropriately highlighted. This guarantees that when the recruiter searches their database for specific skills, your profile ranks at the top.",
    faqTitle: "Frequently Asked Questions",
    faq1Q: "Is this resume optimizer really free?",
    faq1A: "Yes, our core ATS formatting and optimization tool is completely free to use. We believe everyone deserves a fair chance at landing their dream job without format-related rejections.",
    faq2Q: "Do I need to create an account to use the service?",
    faq2A: "No account is required. We prioritize your privacy and convenience. Simply upload your CV, optimize it, and download the resulting PDF immediately.",
    faq3Q: "Are my personal details saved on your servers?",
    faq3A: "Absolutely not. We process your resume entirely in memory for the duration of the conversion. Once your optimized PDF is generated, all data is discarded. We do not store, share, or sell your personal data.",
    faq4Q: "Which formats are supported for upload?",
    faq4A: "You can upload your current resume in PDF, DOCX, or direct TXT format. Our system will extract the raw text and restructure it intelligently."
  },
  ar: {
    navSubtitle: "الأداة الأولى لتحسين السيرة الذاتية", heroBadge: "مدعوم بالذكاء الاصطناعي",
    heroTitle1: "احصل على مقابلات عمل أكثر، ", heroTitle2: "ابتداءً من اليوم",
    heroSub: "قم برفع سيرتك الذاتية واحصل على نسخة PDF محسنة ومصممة باحترافية لتتخطى أنظمة (ATS) في ثوانٍ — مجاناً بالكامل.",
    stat1: "10K+", stat1Lbl: "سيرة ذاتية حسنت", stat2: "91%", stat2Lbl: "متوسط التقييم", stat3: "مجاناً", stat3Lbl: "دائماً",
    trust1: "مجاني الاستخدام", trust2: "لا حاجة لإنشاء حساب", trust3: "لا نحتفظ بسيرتك الذاتية",
    trust4: "تصدير PDF فوري", trust5: "مدعوم بالذكاء الاصطناعي", trust6: "متوافق مع أنظمة التوظيف (ATS)",
    step1num: "01", step1title: "سيرتك الذاتية", dropArea: "ضع سيرتك الذاتية هنا", supports: "ندعم ملفات PDF، DOCX، أو TXT",
    reading: "جاري قراءة سيرتك الذاتية...", extracting: "استخراج النص من الملف الخاص بك", found: "تعرّف على {word} كلمة",
    remove: "حذف الملف", paste: "أو الصق نص سيرتك الذاتية مباشرة هنا...",
    jobLabel: "المسمى الوظيفي المستهدف (اختياري)", jobPh: "مثال: مهندس برمجيات أول...",
    convert: "تحويل وإنشاء PDF", converting: "جاري التحويل...", step2num: "02", step2title: "المعاينة والنتائج",
    statusLabel: "تحديث الحالة", statusTitle: "معدل اجتياز الـ ATS", scoreMax: "من 100 — ",
    scoreGood: "ممتاز! السيرة جاهزة وتواكب أفضل المعايير.", scoreOk: "جيد، لكن القليل من التحسينات ستزيد فرصك.", scoreBad: "يحتاج إلى تحسين جذري للحصول على مقابلات.",
    download: "تحميل PDF", copy: "نسخ النص", copied: "تم النسخ!", guideTitle: "الدقة في ثلاث خطوات",
    g1num: "01", g1title: "رفع السيرة الذاتية", g1desc: "قم برفع سيرتك الذاتية بأمان. نحن ندعم جميع الصيغ الرئيسية بما في ذلك PDF، و DOCX، والنص المباشر.",
    g2num: "02", g2title: "تحليل الذكاء الاصطناعي", g2desc: "يقوم الذكاء الاصطناعي الخاص بنا بتحديد الفجوات وإصلاح الكلمات المفتاحية ومشاكل التنسيق التي تعيق وصولك.",
    g3num: "03", g3title: "تصدير ملف PDF", g3desc: "احصل على ملف PDF بتصميم نظيف ومتوافق تماماً مع أنظمة الفرز (ATS)، جاهز للتقديم الفوري.",
    footerText: "© 2026 FlipYourCV. AI-Powered Excellence.", contact: "تواصل معنا", twitter: "تويتر 𝕏", github: "جيت هب",
    guideAtsTitle: "الدليل الشامل لتحسين السيرة الذاتية لأنظمة ATS",
    guideAtsP1: "نظام تتبع المتقدمين (ATS) هو برنامج يُمكّن من التعامل الإلكتروني مع احتياجات التوظيف. أكثر من 98٪ من شركات فورتشن 500 تستخدم هذا النظام لفرز السير الذاتية. إذا لم تكن سيرتك مصاغة بشكل صحيح، أو تفتقر إلى الكلمات المفتاحية الدقيقة، سيرفضها النظام تلقائيًا قبل أن يراها أي شخص.",
    guideAtsH1: "لماذا تفشل السير الذاتية التقليدية",
    guideAtsP2: "يستخدم العديد من الباحثين عن عمل قوالب معقدة، وأعمدة متعددة، وصور، وخطوط فريدة للتميز. رغم أن هذه العناصر جذابة للعين البشرية، إلا أنها تربك خوارزميات أنظمة التوظيف. تقوم الأداة الخاصة بنا بإزالة التنسيقات غير المقروءة وتعيد بناء السيرة الذاتية بنسق نصي نقي ونظيف يحقق نسبة 100٪ في الاختبارات.",
    guideAtsH2: "كيف يعمل تحسين الذكاء الاصطناعي",
    guideAtsP3: "عبر تحليل المسمى الوظيفي المستهدف، يفهم الذكاء الاصطناعي الخاص بنا خبراتك ويضمن تسليط الضوء على المصطلحات القياسية في مجالك. هذا يضمن أنه عندما يبحث مسؤول التوظيف عن مهارات معينة، يظهر ملفك في الصدارة.",
    faqTitle: "الأسئلة الشائعة",
    faq1Q: "هل هذه الأداة مجانية حقاً؟",
    faq1A: "نعم، أداة التحسين الأساسية الخاصة بنا مجانية بالكامل. نحن نؤمن بأن الجميع يستحق فرصة عادلة للحصول على وظيفة أحلامه بعيداً عن أخطاء التنسيق.",
    faq2Q: "هل أحتاج لإنشاء حساب لاستخدام الخدمة؟",
    faq2A: "لا حاجة لإنشاء أي حساب. نحن نضع خصوصيتك في المقام الأول. قم برفع سيرتك، حسنها، وحمل الـ PDF فوراً.",
    faq3Q: "هل يتم حفظ بياناتي الشخصية على خوادمكم؟",
    faq3A: "مطلقاً. يتم معالجة السيرة الذاتية بشكل مؤقت أثناء التحويل فقط. بمجرد انتهاء العملية، يتم التخلص من جميع البيانات. لا نقوم بتخزين أو مشاركة بياناتك.",
    faq4Q: "ما هي الصيغ المدعومة للرفع؟",
    faq4A: "يمكنك رفع سيرتك الذاتية الحالية بصيغ PDF أو DOCX أو TXT. سيقوم نظامنا باستخراج النص الخام وإعادة هيكلته بذكاء وصياغته بشكل صحيح."
  }
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState("en"); // <-- Default to English
  const t = (key, params) => { let s = DICT[lang][key] || ""; if (params?.word) s = s.replace("{word}", params.word); return s; };

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
  const [turnstileToken, setTurnstileToken] = useState("");
  const fileInputRef = useRef();
  const turnstileRef = useRef();

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
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (_) { }
  }, []);

  // Render Cloudflare Turnstile CAPTCHA widget
  useEffect(() => {
    if (!window.turnstile || !turnstileRef.current) return;
    // Clear any previous widget
    turnstileRef.current.innerHTML = "";
    window.turnstile.render(turnstileRef.current, {
      sitekey: "0x4AAAAAACtiYlNeMBElx1HD",
      action: "cv_conversion",
      callback: (token) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
      theme: theme === "dark" ? "dark" : "light",
    });
  }, [theme]);

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
    if (!turnstileToken) { showToast("Please complete the security check."); return; }
    setLoading(true); setResult(null);
    let msgIdx = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    const interval = setInterval(() => { msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length; setLoadingMsg(LOADING_MESSAGES[msgIdx]); }, 2000);
    try {
      const timestamp = Date.now().toString();
      const payloadString = cvContent + jobTitle + timestamp;
      const encoder = new TextEncoder();
      const encodedPayload = encoder.encode(payloadString);
      const hashBuffer = await crypto.subtle.digest("SHA-256", encodedPayload);
      const signature = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-app-timestamp": timestamp,
          "x-app-signature": signature
        },
        body: JSON.stringify({ cvText: cvContent, jobTitle, turnstileToken }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong");
      setResult(data.result);
    } catch (e) {
      showToast("Error: " + e.message);
    } finally {
      clearInterval(interval);
      setLoading(false);
      // Reset turnstile after each attempt
      setTurnstileToken("");
      if (window.turnstile && turnstileRef.current) {
        turnstileRef.current.innerHTML = "";
        window.turnstile.render(turnstileRef.current, {
          sitekey: "0x4AAAAAACtiYlNeMBElx1HD",
          action: "cv_conversion",
          callback: (token) => setTurnstileToken(token),
          "expired-callback": () => setTurnstileToken(""),
          theme: theme === "dark" ? "dark" : "light",
        });
      }
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
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="app" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="header" style={{ direction: "ltr" }}>
          <div className="header-left"></div>

          <div className="logo-area header-center">
            <h1><span style={{ color: "var(--accent)" }}>FlipYourCV</span></h1>
            <span className={`badge ${lang === 'ar' ? 'ar' : ''}`} style={{ marginTop: 12, fontSize: '1rem' }}>{t("navSubtitle")}</span>
          </div>

          <div className="header-right">
            <button className="theme-btn" style={{ fontSize: "14px", fontWeight: "bold" }} onClick={() => setLang(l => l === "en" ? "ar" : "en")} aria-label="Toggle language">
              {lang === "en" ? "عربي" : "EN"}
            </button>
            <button className="theme-btn" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} aria-label="Toggle theme">
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        {/* ── HERO ── */}
        <div className={`hero ${lang === 'ar' ? 'ar-center' : ''}`} style={{ textAlign: "center" }}>
          <div className="hero-tagline" style={{ justifyContent: "center" }}><span style={{ direction: "ltr" }}>AI-Powered Resume Optimizer</span></div>
          <h2>{t("heroTitle1")}<br /><span>{t("heroTitle2")}</span></h2>
          <p className={`hero-sub ${lang === 'ar' ? 'ar' : ''}`} style={{ margin: "0 auto 30px" }}>{t("heroSub")}</p>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div className={`how-strip ${lang === 'ar' ? 'ar' : ''}`} style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
          {[
            ["1", t("g1title"), t("g1desc")],
            ["2", t("g2title"), t("g2desc")],
            ["3", t("g3title"), t("g3desc")]
          ].map(([n, tx, d]) => (
            <div className="how-step" key={n}>
              <div className="how-num">{n}</div>
              <div className="how-text"><h4>{tx}</h4><p>{d}</p></div>
            </div>
          ))}
        </div>

        {/* ── TRUST BADGES ── */}
        <div className={`trust-badges ${lang === 'ar' ? 'ar' : ''}`} style={{ justifyContent: "center", direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
          {[
            ["✓", t("trust1")],
            ["✓", t("trust2")],
            ["✓", t("trust3")],
            ["✓", t("trust4")],
            ["✓", t("trust5")],
            ["✓", t("trust6")]
          ].map(([c, tx]) => (
            <div className="trust-badge" key={tx}><span className="check">{c}</span>{tx}</div>
          ))}
        </div>

        <div className="main-grid" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
          <div>
            <div className={`panel ${lang === 'ar' ? 'ar' : ''}`}>
              <div className="panel-header" style={lang === 'ar' ? { direction: 'ltr', justifyContent: 'flex-end', fontFamily: 'Cairo' } : {}}><span className="num" style={lang === 'ar' ? { marginRight: '12px' } : {}}>01</span><h2>{t("step1title")}</h2></div>
              <div className="panel-body">
                {!file && !extracting ? (
                  <div className={`upload-zone ${dragging ? "dragging" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}>
                    <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={(e) => handleFile(e.target.files[0])} />
                    <span className="upload-icon">📄</span>
                    <h3>{t("dropArea")}</h3>
                    <p>{t("supports")}</p>
                  </div>
                ) : extracting ? (
                  <div className="upload-zone" style={{ pointerEvents: "none" }}>
                    <div className="extract-overlay">
                      <div className="big-spinner" />
                      <p>{t("reading")}</p>
                      <small>{t("extracting")}</small>
                    </div>
                    <span className="upload-icon" style={{ opacity: 0.15 }}>📄</span>
                    <h3 style={{ opacity: 0.15 }}>{t("dropArea")}</h3>
                    <p style={{ opacity: 0.15 }}>{t("supports")}</p>
                  </div>
                ) : (
                  <div className="file-loaded" style={{ flexDirection: lang === 'ar' ? "row-reverse" : "row", textAlign: lang === 'ar' ? "right" : "left" }}>
                    <span>✅</span>
                    <div className="file-info" style={lang === 'ar' ? { marginLeft: "auto", marginRight: 0 } : { marginRight: "auto", marginLeft: 0 }}>
                      <div className="file-name" style={{ direction: "ltr", textAlign: lang === 'ar' ? "right" : "left" }}>{file.name}</div>
                      <div className="file-meta">{(file.size / 1024).toFixed(1)} KB · {t("found", { word: rawText.split(/\s+/).length })}</div>
                    </div>
                    <button className="btn-remove" onClick={reset}>{t("remove")}</button>
                  </div>
                )}
                <textarea className={`cv-textarea ${lang === 'ar' ? 'ar' : ''}`} placeholder={t("paste")} value={rawText} onChange={(e) => setRawText(e.target.value)} rows={8} maxLength={20000} />
                <div style={{ textAlign: lang === 'ar' ? 'left' : 'right', fontSize: '0.68rem', fontFamily: "'JetBrains Mono', monospace", color: rawText.length > 18000 ? 'var(--danger)' : 'var(--muted)', marginTop: 4, opacity: rawText.length > 0 ? 1 : 0 }}>
                  {rawText.length.toLocaleString()} / 20,000
                </div>
                <span className={`field-label ${lang === 'ar' ? 'ar' : ''}`}>{t("jobLabel")}</span>
                <input className={`job-input ${lang === 'ar' ? 'ar' : ''}`} placeholder={t("jobPh")} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} maxLength={200} />

                <div ref={turnstileRef} style={{ margin: '12px 0', display: 'flex', justifyContent: 'center' }}></div>
                <button className="btn-convert" style={{ flexDirection: lang === 'ar' ? "row-reverse" : "row" }} onClick={convert} disabled={loading || !rawText.trim() || !turnstileToken}>
                  {loading ? <><div className="spinner" /> {t("converting")}</> : <>{lang === 'ar' ? '←' : ''} {t("convert")} {lang === 'en' ? '→' : ''}</>}
                </button>
              </div>
            </div>
            <div className={`tips-grid ${lang === 'ar' ? 'ar' : ''}`} style={{ marginTop: 16 }}>
              {lang === 'ar' ? [
                ["بدون جداول/أعمدة", "أنظمة ATS لا يمكنها قراءة التخطيطات متعددة الأعمدة"],
                ["خطوط بسيطة", "Arial, Calibri, Times New Roman"],
                ["عناوين قياسية", "استخدم العناوين التي تتوقعها أنظمة ATS"],
                ["الكلمات المفتاحية", "طابق الكلمات الموجودة في الوصف الوظيفي"]
              ].map(([tx, d]) => (
                <div className="tip" key={tx}><strong>{tx}</strong>{d}</div>
              )) : [
                ["No Tables/Columns", "ATS systems cannot read multi-column layouts"],
                ["Simple Fonts", "Arial, Calibri, Times New Roman"],
                ["Standard Headings", "Use standard headings ATS expects"],
                ["Keywords", "Match keywords found in the job description"]
              ].map(([tx, d]) => (
                <div className="tip" key={tx}><strong>{tx}</strong>{d}</div>
              ))}
            </div>
          </div>

          <div className={`panel ${lang === 'ar' ? 'ar' : ''}`}>
            <div className="panel-header" style={lang === 'ar' ? { direction: 'ltr', justifyContent: 'flex-end', fontFamily: 'Cairo' } : {}}><span className="num" style={lang === 'ar' ? { marginRight: '12px' } : {}}>02</span><h2>{t("step2title")}</h2></div>
            <div className="panel-body">
              {loading ? (
                <div className="loading-state"><div className="big-spinner" /><p style={{ direction: "ltr" }}>{loadingMsg}</p></div>
              ) : result ? (
                <>
                  {result.score != null && (
                    <div className="score-card" style={{ flexDirection: lang === 'ar' ? "row-reverse" : "row" }}>
                      <div className="score-num" style={{ direction: "ltr" }}>{displayScore}</div>
                      <div className="score-details" style={{ textAlign: lang === 'ar' ? "right" : "left" }}>
                        <h4>{t("statusTitle")}</h4>
                        <p>{t("scoreMax")} {result.score >= 80 ? t("scoreGood") : result.score >= 60 ? t("scoreOk") : t("scoreBad")}</p>
                        <div className="score-bar" style={{ transform: lang === 'ar' ? "rotate(180deg)" : "none" }}><div className="score-bar-fill" style={{ width: `${result.score}%` }} /></div>
                      </div>
                    </div>
                  )}
                  <div style={{ direction: "ltr", textAlign: "left" }}><CVPreview data={result} /></div>
                  {result.tips?.length > 0 && (
                    <div className="tips-list">
                      {result.tips.map((tip, i) => <div className="tip-item" style={{ flexDirection: lang === 'ar' ? "row-reverse" : "row" }} key={i}>{tip}</div>)}
                    </div>
                  )}
                  <div className="output-actions" style={{ flexDirection: lang === 'ar' ? "row-reverse" : "row" }}>
                    <button className="btn-action highlight" onClick={() => generatePDF(result)}>⬇ {t("download")}</button>
                    <button className="btn-action" onClick={copyAsText}>{copied ? `✓ ${t("copied")}` : `⎘ ${t("copy")}`}</button>
                    <button className="btn-action primary" onClick={reset}>{t("remove")}</button>
                  </div>
                </>
              ) : (
                <div className="output-empty">
                  <svg width="56" height="70" viewBox="0 0 56 70" fill="none" style={{ color: "var(--border)", marginBottom: 4 }}>
                    <rect x="1" y="1" width="54" height="68" rx="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
                    <rect x="10" y="18" width="36" height="2" rx="1" fill="currentColor" opacity="0.5" />
                    <rect x="10" y="26" width="28" height="2" rx="1" fill="currentColor" opacity="0.3" />
                    <rect x="10" y="34" width="32" height="2" rx="1" fill="currentColor" opacity="0.3" />
                    <rect x="10" y="42" width="24" height="2" rx="1" fill="currentColor" opacity="0.2" />
                    <rect x="10" y="50" width="30" height="2" rx="1" fill="currentColor" opacity="0.2" />
                    <rect x="10" y="11" width="18" height="4" rx="2" fill="currentColor" opacity="0.45" />
                  </svg>
                  <p>{lang === 'ar' ? 'ارفع سيرتك الذاتية واضغط على تحويل' : 'Upload your CV and press optimize'}</p>
                  <p style={{ opacity: 0.5 }}>{lang === 'ar' ? 'سيتم إنشاء ملف PDF متوافق ونظيف' : 'A clean, ATS-compliant PDF will be generated'}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── PUBLISHER CONTENT AREA (FOR SEO & ADSENSE) ── */}
        <div className={`pub-content ${lang === 'ar' ? 'ar' : ''}`} style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
          <div className="pub-section">
            <h2>{t("guideAtsTitle")}</h2>
            <p>{t("guideAtsP1")}</p>
            <h3>{t("guideAtsH1")}</h3>
            <p>{t("guideAtsP2")}</p>
            <h3>{t("guideAtsH2")}</h3>
            <p>{t("guideAtsP3")}</p>
          </div>

          <div className="pub-section">
            <h2>{t("faqTitle")}</h2>

            <div className="faq-item">
              <h4>{t("faq1Q")}</h4>
              <p>{t("faq1A")}</p>
            </div>
            <div className="faq-item">
              <h4>{t("faq2Q")}</h4>
              <p>{t("faq2A")}</p>
            </div>
            <div className="faq-item">
              <h4>{t("faq3Q")}</h4>
              <p>{t("faq3A")}</p>
            </div>
            <div className="faq-item">
              <h4>{t("faq4Q")}</h4>
              <p>{t("faq4A")}</p>
            </div>
          </div>
        </div>

        {/* ── AD SLOT ── */}
        <div className="ad-slot">
          <ins className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client="ca-pub-2579012016746124"
            data-ad-slot="auto"
            data-ad-format="auto"
            data-full-width-responsive="true" />
        </div>

        {/* ── CONTACT SECTION — edit the details below ── */}
        <div className={`contact ${lang === 'ar' ? 'ar-center' : ''}`} style={{ textAlign: "center", direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
          <div className="contact-label" style={{ direction: "ltr" }}>// get in touch</div>
          <h2>{lang === 'ar' ? 'دعنا' : 'Get in'} <span>{lang === 'ar' ? 'نتواصل' : 'touch'}</span></h2>
          <p>{lang === 'ar' ? 'هل لديك سؤال، اقتراح، أو تريد فقط إلقاء التحية؟ لا تتردد في التواصل معي — يسعدني سماع رأيك.' : 'Have a question, feedback, or just want to say hi? Feel free to reach out — I\'d love to hear from you.'}</p>
          <div className="contact-links" style={{ justifyContent: "center", flexDirection: lang === 'ar' ? "row-reverse" : "row" }}>
            <a className="contact-link" href="mailto:info@flipyourcv.tech" style={{ direction: "ltr", fontWeight: "normal", fontFamily: "'JetBrains Mono', monospace" }}>
              <span className="icon">✉</span> info@flipyourcv.tech
            </a>
          </div>
        </div>
        {/* ───────────────────────────────────────────── */}
        <div className="footer" style={{ direction: "ltr", textAlign: "center" }}>
          <div>{t("footerText")}</div>
          <div style={{ marginTop: 4, opacity: 0.7 }}>Made by Atlas</div>
        </div>
      </div>
    </>
  );
}
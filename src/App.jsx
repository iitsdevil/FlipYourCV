import { useState, useRef } from "react";
import * as mammoth from "mammoth";
import jsPDF from "jspdf";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --bg: #0a0a0a; --surface: #111111; --surface2: #1a1a1a;
    --border: #2a2a2a; --accent: #c8f542; --accent2: #f5e642;
    --text: #f0f0f0; --muted: #666; --danger: #ff4545;
  }
  body { background: var(--bg); color: var(--text); font-family: 'Syne', sans-serif; min-height: 100vh; }
  .app { max-width: 1100px; margin: 0 auto; padding: 40px 24px 80px; }
  .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 56px; padding-bottom: 32px; border-bottom: 1px solid var(--border); }
  .logo-area h1 { font-family: 'DM Serif Display', serif; font-size: clamp(2rem, 5vw, 3.2rem); line-height: 1.05; letter-spacing: -1px; }
  .logo-area h1 span { color: var(--accent); }
  .logo-area p { color: var(--muted); font-family: 'DM Mono', monospace; font-size: 1rem; margin-top: 8px; letter-spacing: 0.05em; }
  .badge { background: var(--accent); color: #0a0a0a; font-size: 0.9rem; font-weight: 700; padding: 4px 10px; border-radius: 2px; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 8px; display: inline-block; }
  .main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
  @media (max-width: 700px) { .main-grid { grid-template-columns: 1fr; } }
  .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
  .panel-header { display: flex; align-items: center; gap: 10px; padding: 16px 20px; border-bottom: 1px solid var(--border); background: var(--surface2); }
  .panel-header .num { font-family: 'DM Mono', monospace; font-size: 0.7rem; color: var(--accent); background: rgba(200,245,66,0.1); padding: 2px 8px; border-radius: 2px; }
  .panel-header h2 { font-size: 0.85rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  .panel-body { padding: 20px; }
  .upload-zone { border: 1.5px dashed var(--border); border-radius: 4px; padding: 48px 24px; text-align: center; cursor: pointer; transition: all 0.2s; position: relative; }
  .upload-zone:hover, .upload-zone.dragging { border-color: var(--accent); background: rgba(200,245,66,0.03); }
  .upload-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
  .upload-icon { font-size: 2.5rem; margin-bottom: 12px; display: block; }
  .upload-zone h3 { font-size: 1rem; font-weight: 600; margin-bottom: 6px; }
  .upload-zone p { font-size: 0.8rem; color: var(--muted); font-family: 'DM Mono', monospace; }
  .file-loaded { border: 1px solid rgba(200,245,66,0.3); background: rgba(200,245,66,0.04); border-radius: 4px; padding: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .file-loaded .file-info { flex: 1; min-width: 0; }
  .file-loaded .file-name { font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--accent); }
  .file-loaded .file-meta { font-size: 0.7rem; color: var(--muted); font-family: 'DM Mono', monospace; margin-top: 2px; }
  .btn-remove { background: none; border: 1px solid var(--border); color: var(--muted); padding: 4px 10px; cursor: pointer; font-size: 0.75rem; border-radius: 2px; font-family: 'Syne', sans-serif; transition: all 0.2s; white-space: nowrap; }
  .btn-remove:hover { border-color: var(--danger); color: var(--danger); }
  .cv-textarea { width: 100%; min-height: 220px; background: var(--bg); border: 1px solid var(--border); color: var(--text); font-family: 'DM Mono', monospace; font-size: 0.78rem; line-height: 1.6; padding: 14px; border-radius: 4px; resize: vertical; transition: border-color 0.2s; margin-top: 16px; }
  .cv-textarea:focus { outline: none; border-color: var(--accent); }
  .cv-textarea::placeholder { color: var(--muted); }
  .field-label { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; margin-top: 16px; display: block; }
  .job-input { width: 100%; background: var(--bg); border: 1px solid var(--border); color: var(--text); font-family: 'Syne', sans-serif; font-size: 0.9rem; padding: 10px 14px; border-radius: 4px; transition: border-color 0.2s; }
  .job-input:focus { outline: none; border-color: var(--accent); }
  .job-input::placeholder { color: var(--muted); }
  .btn-convert { width: 100%; margin-top: 20px; padding: 14px; background: var(--accent); color: #0a0a0a; border: none; font-family: 'Syne', sans-serif; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border-radius: 4px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .btn-convert:hover:not(:disabled) { background: var(--accent2); transform: translateY(-1px); }
  .btn-convert:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .spinner { width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.3); border-top-color: #0a0a0a; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .output-empty { min-height: 380px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--muted); text-align: center; }
  .output-empty .arrow { font-size: 2rem; animation: float 2s ease-in-out infinite; }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  .output-empty p { font-size: 0.8rem; font-family: 'DM Mono', monospace; }
  .output-actions { display: flex; gap: 10px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); flex-wrap: wrap; }
  .btn-action { flex: 1; min-width: 100px; padding: 10px; background: none; border: 1px solid var(--border); color: var(--text); font-family: 'Syne', sans-serif; font-size: 0.78rem; font-weight: 600; cursor: pointer; border-radius: 4px; transition: all 0.2s; letter-spacing: 0.05em; }
  .btn-action:hover { border-color: var(--accent); color: var(--accent); }
  .btn-action.primary { background: var(--surface2); }
  .btn-action.highlight { background: var(--accent); color: #0a0a0a; border-color: var(--accent); }
  .btn-action.highlight:hover { background: var(--accent2); border-color: var(--accent2); color: #0a0a0a; }
  .score-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; padding: 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 20px; }
  .score-num { font-family: 'DM Serif Display', serif; font-size: 2.8rem; color: var(--accent); line-height: 1; min-width: 70px; }
  .score-details { flex: 1; }
  .score-details h4 { font-size: 0.85rem; font-weight: 700; margin-bottom: 4px; }
  .score-details p { font-size: 0.72rem; color: var(--muted); font-family: 'DM Mono', monospace; }
  .score-bar { width: 100%; height: 4px; background: var(--border); border-radius: 2px; margin-top: 8px; overflow: hidden; }
  .score-bar-fill { height: 100%; background: var(--accent); border-radius: 2px; transition: width 1s ease; }
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
  .tip-item { display: flex; gap: 8px; padding: 8px 12px; background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; margin-bottom: 6px; font-size: 0.75rem; color: var(--muted); font-family: 'DM Mono', monospace; line-height: 1.5; }
  .tip-item::before { content: '→'; color: var(--accent); flex-shrink: 0; }
  .tips-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 16px; }
  .tip { background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; padding: 12px; font-size: 0.72rem; color: var(--muted); font-family: 'DM Mono', monospace; line-height: 1.5; }
  .tip strong { color: var(--text); display: block; margin-bottom: 2px; font-size: 0.75rem; }
  .loading-state { min-height: 380px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
  .loading-state .big-spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
  .loading-state p { font-size: 0.8rem; color: var(--muted); font-family: 'DM Mono', monospace; animation: pulse 1.5s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
  .error-box { background: rgba(255,69,69,0.08); border: 1px solid rgba(255,69,69,0.3); border-radius: 4px; padding: 12px 16px; font-size: 0.8rem; color: #ff7070; font-family: 'DM Mono', monospace; margin-top: 12px; line-height: 1.5; }
  .footer { text-align: center; margin-top: 60px; padding-top: 24px; border-top: 1px solid var(--border); font-size: 0.7rem; color: var(--muted); font-family: 'DM Mono', monospace; }
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
  const margin = 50;
  const contentW = pageW - margin * 2;
  let y = 50;

  const checkPage = (needed = 20) => {
    if (y + needed > pageH - 40) { doc.addPage(); y = 50; }
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
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef();

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
    setError("");
    const MAX_FILE_SIZE_MB = 10;
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File is too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Please upload a file under ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    try { const text = await extractText(f); setFile(f); setRawText(text); }
    catch (e) { setError(e.message); }
  };

  const convert = async () => {
    const cvContent = rawText.trim();
    if (!cvContent) { setError("Please upload a CV or paste your CV text."); return; }
    setLoading(true); setResult(null); setError("");
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
      setError("Error: " + e.message);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const reset = () => { setFile(null); setRawText(""); setResult(null); setError(""); setJobTitle(""); };

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
          <div>
            <div className="panel">
              <div className="panel-header"><span className="num">01</span><h2>Your CV</h2></div>
              <div className="panel-body">
                {!file ? (
                  <div className={`upload-zone ${dragging ? "dragging" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}>
                    <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={(e) => handleFile(e.target.files[0])} />
                    <span className="upload-icon">📄</span>
                    <h3>Drop your CV here</h3>
                    <p>PDF, DOCX, or TXT supported</p>
                  </div>
                ) : (
                  <div className="file-loaded">
                    <span>✅</span>
                    <div className="file-info">
                      <div className="file-name">{file.name}</div>
                      <div className="file-meta">{(file.size / 1024).toFixed(1)} KB · {rawText.split(/\s+/).length} words extracted</div>
                    </div>
                    <button className="btn-remove" onClick={reset}>Remove</button>
                  </div>
                )}
                <textarea className="cv-textarea" placeholder="Or paste your CV text directly here..." value={rawText} onChange={(e) => setRawText(e.target.value)} rows={8} />
                <span className="field-label">Target Job Title (optional)</span>
                <input className="job-input" placeholder="e.g. Senior Software Engineer..." value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                {error && <div className="error-box">⚠ {error}</div>}
                <button className="btn-convert" onClick={convert} disabled={loading || !rawText.trim()}>
                  {loading ? <><div className="spinner" /> Converting...</> : <>Convert & Generate PDF →</>}
                </button>
              </div>
            </div>
            <div className="tips-grid" style={{ marginTop: 16 }}>
              {[["No Tables/Columns","ATS can't read multi-column layouts"],["Simple Fonts","Arial, Calibri, Times New Roman"],["Standard Sections","Exact headers ATS expects"],["Keywords Matter","Mirror the job description"]].map(([t,d]) => (
                <div className="tip" key={t}><strong>{t}</strong>{d}</div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><span className="num">02</span><h2>ATS Optimized CV</h2></div>
            <div className="panel-body">
              {loading ? (
                <div className="loading-state"><div className="big-spinner" /><p>{loadingMsg}</p></div>
              ) : result ? (
                <>
                  {result.score != null && (
                    <div className="score-card">
                      <div className="score-num">{result.score}</div>
                      <div className="score-details">
                        <h4>ATS Compatibility Score</h4>
                        <p>out of 100 — {result.score >= 80 ? "Excellent!" : result.score >= 60 ? "Good, minor tweaks needed" : "Needs improvement"}</p>
                        <div className="score-bar"><div className="score-bar-fill" style={{ width: `${result.score}%` }} /></div>
                      </div>
                    </div>
                  )}
                  <CVPreview data={result} />
                  {result.tips?.length > 0 && (
                    <div className="tips-list">
                      {result.tips.map((tip, i) => <div className="tip-item" key={i}>{tip}</div>)}
                    </div>
                  )}
                  <div className="output-actions">
                    <button className="btn-action highlight" onClick={() => generatePDF(result)}>⬇ Download PDF</button>
                    <button className="btn-action primary" onClick={reset}>New CV</button>
                  </div>
                </>
              ) : (
                <div className="output-empty">
                  <span className="arrow">↑</span>
                  <p>Upload your CV and click convert</p>
                  <p style={{ opacity: 0.5 }}>A clean ATS PDF will be generated</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="footer">ATS.CV — Powered by AI · Your CV is never stored · Free to use</div>
      </div>
    </>
  );
}
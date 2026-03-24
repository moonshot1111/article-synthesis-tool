import { useState } from "react";

const PUBLICATION_BIAS = {
  "nytimes.com": { score: -35, label: "New York Times" },
  "washingtonpost.com": { score: -40, label: "Washington Post" },
  "theguardian.com": { score: -45, label: "The Guardian" },
  "msnbc.com": { score: -55, label: "MSNBC" },
  "huffpost.com": { score: -55, label: "HuffPost" },
  "vox.com": { score: -50, label: "Vox" },
  "theatlantic.com": { score: -30, label: "The Atlantic" },
  "slate.com": { score: -50, label: "Slate" },
  "motherjones.com": { score: -60, label: "Mother Jones" },
  "foxnews.com": { score: 55, label: "Fox News" },
  "nypost.com": { score: 45, label: "New York Post" },
  "breitbart.com": { score: 70, label: "Breitbart" },
  "dailywire.com": { score: 60, label: "The Daily Wire" },
  "nationalreview.com": { score: 45, label: "National Review" },
  "washingtonexaminer.com": { score: 40, label: "Washington Examiner" },
  "theblaze.com": { score: 60, label: "The Blaze" },
  "reuters.com": { score: -5, label: "Reuters" },
  "apnews.com": { score: -5, label: "AP News" },
  "bbc.com": { score: -10, label: "BBC" },
  "bbc.co.uk": { score: -10, label: "BBC" },
  "bloomberg.com": { score: 5, label: "Bloomberg" },
  "wsj.com": { score: 15, label: "Wall Street Journal" },
  "ft.com": { score: 5, label: "Financial Times" },
  "economist.com": { score: 0, label: "The Economist" },
  "politico.com": { score: -10, label: "Politico" },
  "thehill.com": { score: -10, label: "The Hill" },
  "axios.com": { score: -5, label: "Axios" },
  "npr.org": { score: -20, label: "NPR" },
  "cnn.com": { score: -35, label: "CNN" },
  "cbsnews.com": { score: -20, label: "CBS News" },
  "nbcnews.com": { score: -20, label: "NBC News" },
  "abcnews.go.com": { score: -20, label: "ABC News" },
  "time.com": { score: -20, label: "Time" },
  "newsweek.com": { score: -15, label: "Newsweek" },
  "usatoday.com": { score: -10, label: "USA Today" },
  "reason.com": { score: 25, label: "Reason" },
  "thedispatch.com": { score: 15, label: "The Dispatch" },
  "foreignpolicy.com": { score: -15, label: "Foreign Policy" },
  "foreignaffairs.com": { score: -5, label: "Foreign Affairs" },
  "spectator.co.uk": { score: 35, label: "The Spectator" },
};

function detectPublication(url) {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    for (const [d, data] of Object.entries(PUBLICATION_BIAS)) {
      if (host === d || host.endsWith("." + d)) return data;
    }
  } catch {}
  return null;
}

function scoreToLabel(s) {
  if (s <= -55) return "Far Left";
  if (s <= -30) return "Left-Leaning";
  if (s <= -10) return "Center-Left";
  if (s <= 10) return "Center";
  if (s <= 30) return "Center-Right";
  if (s <= 55) return "Right-Leaning";
  return "Far Right";
}

function scoreToColor(s) {
  if (s <= -40) return "#1a6bb5";
  if (s <= -15) return "#5b9bd5";
  if (s <= 10) return "#7a7a7a";
  if (s <= 35) return "#d97070";
  return "#c0392b";
}

function SpectrumBar({ score, label, title }) {
  const pct = Math.round(((score + 100) / 200) * 100);
  const color = scoreToColor(score);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{title}</span>
        <span style={{ fontSize: 13, fontWeight: 500, color }}>{label}</span>
      </div>
      <div style={{ position: "relative", height: 26, background: "linear-gradient(to right,#1a6bb5,#5b9bd5,#aaa,#d97070,#c0392b)", borderRadius: 13 }}>
        <div style={{ position: "absolute", left: `calc(${pct}% - 9px)`, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, background: "white", border: `3px solid ${color}`, borderRadius: "50%", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", zIndex: 2 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {["Far Left", "Center", "Far Right"].map(l => <span key={l} style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{l}</span>)}
      </div>
    </div>
  );
}

function PartisanCard({ item, idx }) {
  const c = item.lean === "left" ? "#1a6bb5" : item.lean === "right" ? "#c0392b" : "#7a7a7a";
  const bg = item.lean === "left" ? "#e8f0fb" : item.lean === "right" ? "#fbeaea" : "#f0f0f0";
  const lbl = item.lean === "left" ? "Left-leaning" : item.lean === "right" ? "Right-leaning" : "Neutral framing";
  return (
    <div style={{ borderLeft: `3px solid ${c}`, padding: "10px 14px", marginBottom: 12, background: "var(--color-background-secondary)", borderRadius: "0 8px 8px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 4, background: bg, color: c }}>{lbl}</span>
        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Statement {idx + 1}</span>
      </div>
      <p style={{ fontSize: 14, fontStyle: "italic", margin: "0 0 6px", color: "var(--color-text-primary)", lineHeight: 1.5 }}>"{item.quote}"</p>
      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>{item.explanation}</p>
    </div>
  );
}

const API_BASE = "";

export default function App() {
  const [input, setInput] = useState("");
  const [inputType, setInputType] = useState("url");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState("");

  async function analyze() {
    const val = input.trim();
    if (!val) { setError("Please enter a URL or paste article text."); return; }
    setError(""); setResult(null); setLoading(true);

    let articleText = val;
    let sourceUrl = "";
    let pubData = null;

    if (inputType === "url") {
      try { new URL(val); } catch { setError("Please enter a valid URL."); setLoading(false); return; }
      sourceUrl = val;
      pubData = detectPublication(val);
      setPhase("Fetching article...");
      try {
        const r = await fetch(`${API_BASE}/api/fetch-article`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: val }),
        });
        const d = await r.json();
        if (r.status === 429) { setError("Too many requests — please wait a moment and try again."); setLoading(false); return; }
        if (!r.ok) throw new Error(d.error || "fetch_failed");
        if (!d.text || d.text.length < 100) throw new Error("too_short");
        articleText = d.text;
      } catch (e) {
        setError(
          e.message === "too_short" ? "Not enough article text found. Try pasting the text directly." :
          e.message === "paywall"   ? "This article is behind a paywall. Please paste the text directly." :
          "Could not fetch the article. Try pasting the text directly."
        );
        setLoading(false); return;
      }
    }

    setPhase("Analyzing with AI...");
    try {
      const pubInfo = pubData ? `Article is from ${pubData.label}.` : sourceUrl ? `Source URL: ${sourceUrl}` : "";
      const r = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: articleText.substring(0, 8000), pubInfo }),
      });
      const d = await r.json();
      if (r.status === 429) { setError("Too many requests — please wait a moment and try again."); setLoading(false); return; }
      if (!r.ok) throw new Error(d.error || "analyze_failed");
      setResult({ ...d, pubData, sourceUrl });
    } catch {
      setError("Analysis failed. Please try again.");
    }
    setLoading(false); setPhase("");
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 500, margin: "0 0 4px", color: "var(--color-text-primary)" }}>Article Synthesis Tool</h2>
        <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: 0 }}>Paste any news URL for instant summary, bias detection, and political spectrum analysis.</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {["url", "text"].map(t => (
          <button key={t} onClick={() => { setInputType(t); setInput(""); setResult(null); setError(""); }}
            style={{ fontSize: 13, padding: "5px 14px", borderRadius: 6, border: `1.5px solid ${inputType === t ? "var(--color-border-primary)" : "var(--color-border-tertiary)"}`, background: inputType === t ? "var(--color-background-secondary)" : "transparent", color: "var(--color-text-primary)", cursor: "pointer", fontWeight: inputType === t ? 500 : 400 }}>
            {t === "url" ? "URL" : "Paste text"}
          </button>
        ))}
      </div>

      {inputType === "url"
        ? <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && analyze()} placeholder="https://www.nytimes.com/..." style={{ width: "100%", boxSizing: "border-box", fontSize: 14, padding: "9px 12px", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", marginBottom: 10 }} />
        : <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Paste full article text here..." rows={7} style={{ width: "100%", boxSizing: "border-box", fontSize: 14, padding: "9px 12px", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", marginBottom: 10, resize: "vertical", lineHeight: 1.5 }} />
      }

      {error && <p style={{ fontSize: 13, color: "var(--color-text-danger)", marginBottom: 10 }}>{error}</p>}

      <button onClick={analyze} disabled={loading} style={{ padding: "9px 22px", fontSize: 14, fontWeight: 500, borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
        {loading ? (phase || "Analyzing...") : "Analyze article →"}
      </button>

      {result && (
        <div style={{ marginTop: 28 }}>
          <div style={{ background: "var(--color-background-secondary)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>TL;DR</div>
            <p style={{ fontSize: 15, fontWeight: 500, margin: 0, color: "var(--color-text-primary)", lineHeight: 1.5 }}>{result.tldr}</p>
          </div>
          <div style={{ background: "var(--color-background-secondary)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Summary</div>
            <p style={{ fontSize: 14, margin: 0, color: "var(--color-text-primary)", lineHeight: 1.7 }}>{result.summary}</p>
          </div>
          <div style={{ background: "var(--color-background-secondary)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Political spectrum</div>
            <SpectrumBar score={result.contentScore} label={scoreToLabel(result.contentScore)} title="This article's content" />
            {result.pubData && <SpectrumBar score={result.pubData.score} label={scoreToLabel(result.pubData.score)} title={`${result.pubData.label} (publication avg.)`} />}
            {result.contentBias && <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "10px 0 0", lineHeight: 1.5, borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 10 }}>{result.contentBias}</p>}
          </div>
          {result.partisanStatements?.length > 0 && (
            <div style={{ background: "var(--color-background-secondary)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Partisan statements & framing</div>
              {result.partisanStatements.map((s, i) => <PartisanCard key={i} item={s} idx={i} />)}
            </div>
          )}
          <button onClick={() => { setResult(null); setInput(""); }} style={{ fontSize: 13, color: "var(--color-text-secondary)", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
            ← Analyze another article
          </button>
        </div>
      )}
    </div>
  );
}

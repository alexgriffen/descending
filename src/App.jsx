import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";


console.log(import.meta.env.VITE_SUPABASE_URL);

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(date);

const difficultyConfig = {
  easy:   { label: "Easy",   color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  medium: { label: "Medium", color: "#facc15", bg: "rgba(250,204,21,0.12)" },
  hard:   { label: "Hard",   color: "#f97316", bg: "rgba(249,115,22,0.12)" },
};

const emptyForm = {
  date: new Date().toISOString().split("T")[0],
  difficulty: "easy",
  what_did: "", what_body: "", what_produced: "",
  anchor_count: "", attention_on: "points",
  reset_done: false, summary_sentence: "",
};

const PRE_RIDE_STEPS = [
  { id: "read_log",    label: "Read every log entry out loud",       sub: "All three fields. Every entry." },
  { id: "sentence",   label: "Say your summary sentence aloud",      sub: 'e.g. "Every descent I completed produced nothing."' },
  { id: "body_scan",  label: "Notice where that lands in your body", sub: "Chest? Hands? Jaw? That felt sense is what you carry to the bike." },
  { id: "body_check", label: "Pre-descent body scan",                sub: "Jaw soft → hands ~50% grip → 4-in / 6-out breath → eyeline to furthest point." },
];

const RESET_STEPS = [
  { id: "stop",    label: "Stop and stand still — 20 seconds", sub: "Don't analyze. Just let your body register: movement ended, nothing went wrong." },
  { id: "breathe", label: "Three breaths: in 4 / out 6",       sub: "Same extended exhale as the body scan. Vagus nerve. Parasympathetic." },
  { id: "say",     label: 'Say it out loud: "I did that."',    sub: "Statement of fact. No celebration, no analysis. Just close the file." },
];

export default function DescentLog() {
  const [entries, setEntries]         = useState([]);
  const [form, setForm]               = useState(emptyForm);
  const [view, setView]               = useState("log");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [saveState, setSaveState]     = useState("idle");
  const [loadState, setLoadState]     = useState("loading");
  const [preChecked, setPreChecked]   = useState({});
  const [resetChecked, setResetChecked] = useState({});

  // ── Load entries on mount ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("descents")
        .select("*")
        .order("date", { ascending: false });
      if (error) { setLoadState("error"); return; }
      setEntries(data ?? []);
      setLoadState("ready");
    })();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────
  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    if (!form.what_did || !form.what_body || !form.what_produced) return;
    setSaveState("saving");
    const entry = { ...form, id: Date.now() };
    const { error } = await supabase.from("descents").insert([entry]);
    if (error) {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
      return;
    }
    setEntries(e => [entry, ...e]);
    setForm(emptyForm);
    setResetChecked({});
    setSaveState("saved");
    setTimeout(() => { setSaveState("idle"); setView("log"); }, 1200);
  };

  const submitLabel = () => {
    if (saveState === "saving") return "Saving…";
    if (saveState === "saved")  return "✓ Saved";
    if (saveState === "error")  return "⚠ Save failed";
    return "Save Entry";
  };
  const submitStyle = () => {
    if (saveState === "saved")  return { ...s.submitBtn, ...s.submitBtnSaved };
    if (saveState === "error")  return { ...s.submitBtn, ...s.submitBtnError };
    if (saveState === "saving") return { ...s.submitBtn, opacity: 0.6 };
    return s.submitBtn;
  };

  const preAllDone   = PRE_RIDE_STEPS.every(st => preChecked[st.id]);
  const resetAllDone = RESET_STEPS.every(st => resetChecked[st.id]);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div style={s.root}>
      <div style={s.bgNoise} />

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.logoMark}>▽</div>
          <div>
            <div style={s.title}>Descent Evidence Log</div>
            <div style={s.subtitle}>Rewriting the threat file — one descent at a time</div>
          </div>
        </div>
        <div style={s.statsRow}>
          <div style={s.stat}>
            <div style={s.statNum}>{entries.length}</div>
            <div style={s.statLabel}>Descents</div>
          </div>
          <div style={s.statDivider} />
          <div style={s.stat}>
            <div style={{ ...s.statNum, color: "#4ade80" }}>
              {entries.filter(e => e.what_produced).length}
            </div>
            <div style={s.statLabel}>Nothing wrong</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={s.nav}>
        {["log","preride","new"].map(v => (
          <button key={v} style={{ ...s.navBtn, ...(view === v ? s.navBtnActive : {}) }}
            onClick={() => { setView(v); setSelectedEntry(null); if (v === "preride") { setPreChecked({}); setResetChecked({}); } }}>
            { v === "log" ? "Log" : v === "preride" ? "Pre-Ride" : "+ Log Entry" }
          </button>
        ))}
        <div style={s.dbIndicator}>
          { loadState === "loading" && <span style={{ color: "#475569" }}>Connecting…</span> }
          { loadState === "ready"   && <span style={{ color: "#4ade80" }}>● Supabase</span> }
          { loadState === "error"   && <span style={{ color: "#f97316" }}>⚠ DB error</span> }
        </div>
      </div>

      <div style={s.content}>

        {/* ── LOG VIEW ── */}
        {view === "log" && (
          <div>
            {loadState === "loading" && <div style={s.stateMsg}>Loading entries…</div>}
            {loadState === "error"   && <div style={{ ...s.stateMsg, color: "#f97316" }}>Could not connect to Supabase. Check your project settings.</div>}
            {loadState === "ready" && entries.length === 0 && (
              <div style={s.empty}>
                <div style={s.emptyIcon}>◎</div>
                <div style={s.emptyText}>No entries yet.</div>
                <div style={s.emptySubtext}>Complete a descent, then log it within 30 minutes.</div>
                <button style={s.emptyBtn} onClick={() => setView("new")}>Add First Entry</button>
              </div>
            )}
            {loadState === "ready" && entries.length > 0 && (
              <div style={s.entriesList}>
                {entries.map(entry => {
                  const diff = difficultyConfig[entry.difficulty] || difficultyConfig.easy;
                  return (
                    <div key={entry.id} style={s.card} onClick={() => { setSelectedEntry(entry); setView("detail"); }}>
                      <div style={s.cardTop}>
                        <div style={s.cardDate}>{formatDate(new Date(entry.date + "T12:00:00"))}</div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          {(entry.reset_done === true || entry.reset_done === "true") && <div style={s.resetBadge}>✓ Reset</div>}
                          <div style={{ ...s.badge, background: diff.bg, color: diff.color }}>{diff.label}</div>
                        </div>
                      </div>
                      <div style={s.cardPreview}>{entry.what_did}</div>
                      <div style={s.cardFooter}>
                        <div style={s.cardResult}><span style={s.resultDot}>●</span>{entry.what_produced || "—"}</div>
                        {entry.anchor_count && <div style={s.anchorChip}>{entry.anchor_count} anchor pts</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── PRE-RIDE VIEW ── */}
        {view === "preride" && (
          <div style={s.form}>
            <div style={s.sectionHeader}>
              <div style={s.sectionTitle}>Evidence Review Protocol</div>
              <div style={s.sectionSub}>Do this before you get on the bike. Tick each step as you go.</div>
            </div>

            <div style={s.logReadout}>
              <div style={s.logReadoutLabel}>Your evidence — read this out loud:</div>
              {entries.length === 0
                ? <div style={{ color: "#475569", fontSize: 13, fontStyle: "italic" }}>No entries yet — this will populate after your first descent.</div>
                : [...entries].reverse().map(entry => {
                    const diff = difficultyConfig[entry.difficulty] || difficultyConfig.easy;
                    return (
                      <div key={entry.id} style={s.logReadoutEntry}>
                        <div style={s.logReadoutTop}>
                          <span style={s.logReadoutDate}>{formatDate(new Date(entry.date + "T12:00:00"))}</span>
                          <span style={{ ...s.badge, fontSize: 10, background: diff.bg, color: diff.color }}>{diff.label}</span>
                        </div>
                        <div style={s.logReadoutField}><span style={s.logReadoutFieldLabel}>What I did: </span>{entry.what_did}</div>
                        <div style={s.logReadoutField}><span style={s.logReadoutFieldLabel}>What my body did: </span>{entry.what_body}</div>
                        <div style={s.logReadoutField}><span style={s.logReadoutFieldLabel}>What it produced: </span>{entry.what_produced}</div>
                      </div>
                    );
                  })
              }
            </div>

            <div style={s.checklistGroup}>
              {PRE_RIDE_STEPS.map(step => (
                <div key={step.id} style={{ ...s.checkItem, ...(preChecked[step.id] ? s.checkItemDone : {}) }}
                  onClick={() => setPreChecked(p => ({ ...p, [step.id]: !p[step.id] }))}>
                  <div style={{ ...s.checkbox, ...(preChecked[step.id] ? s.checkboxDone : {}) }}>{preChecked[step.id] && "✓"}</div>
                  <div>
                    <div style={s.checkLabel}>{step.label}</div>
                    <div style={s.checkSub}>{step.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {preAllDone && (
              <div style={s.allDoneBanner}>You're ready. Carry that felt sense to the bike.</div>
            )}

            <div style={s.divider} />

            <div style={s.sectionHeader}>
              <div style={s.sectionTitle}>Post-Descent Reset</div>
              <div style={s.sectionSub}>Run this immediately at the bottom of every descent. 2 minutes.</div>
            </div>

            <div style={s.checklistGroup}>
              {RESET_STEPS.map(step => (
                <div key={step.id} style={{ ...s.checkItem, ...(resetChecked[step.id] ? s.checkItemDone : {}) }}
                  onClick={() => setResetChecked(p => ({ ...p, [step.id]: !p[step.id] }))}>
                  <div style={{ ...s.checkbox, ...(resetChecked[step.id] ? s.checkboxDone : {}) }}>{resetChecked[step.id] && "✓"}</div>
                  <div>
                    <div style={s.checkLabel}>{step.label}</div>
                    <div style={s.checkSub}>{step.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {resetAllDone && (
              <div style={{ ...s.allDoneBanner, background: "rgba(74,222,128,0.08)", borderColor: "rgba(74,222,128,0.25)", color: "#4ade80" }}>
                Cycle closed. Now log the entry.
                <button style={s.logNowBtn} onClick={() => setView("new")}>→ Log Entry</button>
              </div>
            )}
          </div>
        )}

        {/* ── NEW ENTRY VIEW ── */}
        {view === "new" && (
          <div style={s.form}>
            <div style={s.formTitle}>Log Entry</div>
            <div style={s.formSubtitle}>Transfer from your notes. Within 30 minutes of finishing.</div>

            <div style={s.row}>
              <div style={s.fieldGroup}>
                <label style={s.label}>Date</label>
                <input type="date" value={form.date} onChange={e => handleChange("date", e.target.value)} style={s.input} />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Difficulty</label>
                <div style={s.diffRow}>
                  {Object.entries(difficultyConfig).map(([key, cfg]) => (
                    <button key={key}
                      style={{ ...s.diffBtn, ...(form.difficulty === key ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color } : {}) }}
                      onClick={() => handleChange("difficulty", key)}>{cfg.label}</button>
                  ))}
                </div>
              </div>
            </div>

            {[
              ["what_did",      "Field 1 — What you did",                       "Gradient, surface, familiarity, how far you rode it.",              "e.g. Easy roller on Mines Road, dry. Rode the full 0.3mi without stopping.", 3],
              ["what_body",     "Field 2 — What your body did",                 "What threat signals fired, where you felt them, how they changed.", "e.g. Chest pressure at the top. Reduced halfway down. Used pick-a-point.", 3],
              ["what_produced", "Field 3 — What the descent actually produced", "Not what you feared — what actually happened.",                     "e.g. Nothing went wrong. Road was clear, bike felt stable, made it to the bottom fine.", 2],
            ].map(([field, label, hint, placeholder, rows]) => (
              <div key={field} style={s.fieldGroup}>
                <label style={s.label}>{label}</label>
                <div style={s.fieldHint}>{hint}</div>
                <textarea value={form[field]} onChange={e => handleChange(field, e.target.value)}
                  placeholder={placeholder} style={s.textarea} rows={rows} />
              </div>
            ))}

            <div style={s.fieldGroup}>
              <label style={s.label}>Summary sentence</label>
              <div style={s.fieldHint}>The one sentence you said aloud after reading the log.</div>
              <input value={form.summary_sentence} onChange={e => handleChange("summary_sentence", e.target.value)}
                placeholder='e.g. "Every descent I completed this week produced nothing."' style={s.input} />
            </div>

            <div style={s.row}>
              <div style={s.fieldGroup}>
                <label style={s.label}>Anchor Points Used</label>
                <input type="number" min="0" value={form.anchor_count}
                  onChange={e => handleChange("anchor_count", e.target.value)}
                  placeholder="e.g. 6" style={{ ...s.input, width: "100px" }} />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Attention mostly on…</label>
                <div style={s.diffRow}>
                  {[["points","Anchor Points"],["fear","The Fear"]].map(([val, lbl]) => (
                    <button key={val}
                      style={{ ...s.diffBtn, ...(form.attention_on === val ? { background: "rgba(148,163,184,0.2)", color: "#e2e8f0", borderColor: "#94a3b8" } : {}) }}
                      onClick={() => handleChange("attention_on", val)}>{lbl}</button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ ...s.checkItem, ...(form.reset_done ? s.checkItemDone : {}), cursor: "pointer" }}
              onClick={() => handleChange("reset_done", !form.reset_done)}>
              <div style={{ ...s.checkbox, ...(form.reset_done ? s.checkboxDone : {}) }}>{form.reset_done && "✓"}</div>
              <div>
                <div style={s.checkLabel}>Post-descent reset completed</div>
                <div style={s.checkSub}>Stopped → 3 breaths → "I did that."</div>
              </div>
            </div>

            <button style={submitStyle()} onClick={handleSubmit} disabled={saveState === "saving"}>
              {submitLabel()}
            </button>
          </div>
        )}

        {/* ── DETAIL VIEW ── */}
        {view === "detail" && selectedEntry && (
          <div style={s.form}>
            <button style={s.backBtn} onClick={() => setView("log")}>← Back to log</button>
            <div style={s.detailDate}>
              {formatDate(new Date(selectedEntry.date + "T12:00:00"))}
              <span style={{ ...s.badge, marginLeft: 10,
                background: (difficultyConfig[selectedEntry.difficulty] || difficultyConfig.easy).bg,
                color:      (difficultyConfig[selectedEntry.difficulty] || difficultyConfig.easy).color }}>
                {(difficultyConfig[selectedEntry.difficulty] || difficultyConfig.easy).label}
              </span>
              {(selectedEntry.reset_done === true || selectedEntry.reset_done === "true") &&
                <span style={{ ...s.resetBadge, marginLeft: 8 }}>✓ Reset</span>}
            </div>

            {[
              ["Field 1 — What you did",                       selectedEntry.what_did],
              ["Field 2 — What your body did",                 selectedEntry.what_body],
              ["Field 3 — What the descent actually produced", selectedEntry.what_produced],
            ].map(([label, value]) => (
              <div key={label} style={s.detailBlock}>
                <div style={s.detailLabel}>{label}</div>
                <div style={s.detailValue}>{value}</div>
              </div>
            ))}

            {selectedEntry.summary_sentence && (
              <div style={s.detailBlock}>
                <div style={s.detailLabel}>Summary Sentence</div>
                <div style={{ ...s.detailValue, fontStyle: "italic" }}>"{selectedEntry.summary_sentence}"</div>
              </div>
            )}

            {selectedEntry.anchor_count && (
              <div style={s.detailBlock}>
                <div style={s.detailLabel}>Anchor Points</div>
                <div style={s.detailValue}>
                  {selectedEntry.anchor_count} points — attention mostly on{" "}
                  <strong>{selectedEntry.attention_on === "points" ? "anchor points" : "the fear"}</strong>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", background: "#0c0f14", color: "#e2e8f0", fontFamily: "'Georgia','Times New Roman',serif", position: "relative", overflow: "hidden" },
  bgNoise: { position: "fixed", inset: 0, backgroundImage: `radial-gradient(ellipse at 20% 50%, rgba(30,58,92,0.3) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(20,45,70,0.2) 0%, transparent 50%)`, pointerEvents: "none", zIndex: 0 },
  header: { position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "28px 32px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexWrap: "wrap", gap: 16 },
  headerLeft: { display: "flex", alignItems: "center", gap: 16 },
  logoMark: { fontSize: 28, color: "#60a5fa", lineHeight: 1 },
  title: { fontSize: 22, fontWeight: "bold", letterSpacing: "-0.5px", color: "#f1f5f9" },
  subtitle: { fontSize: 12, color: "#64748b", marginTop: 2, fontStyle: "italic" },
  statsRow: { display: "flex", alignItems: "center", gap: 20 },
  stat: { textAlign: "center" },
  statNum: { fontSize: 24, fontWeight: "bold", color: "#e2e8f0", lineHeight: 1 },
  statLabel: { fontSize: 11, color: "#475569", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.08em" },
  statDivider: { width: 1, height: 32, background: "rgba(255,255,255,0.08)" },
  nav: { position: "relative", zIndex: 1, display: "flex", gap: 4, alignItems: "center", padding: "14px 32px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexWrap: "wrap" },
  navBtn: { background: "transparent", border: "1px solid transparent", color: "#64748b", padding: "7px 18px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontFamily: "Georgia,serif" },
  navBtnActive: { background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.3)", color: "#93c5fd" },
  dbIndicator: { marginLeft: "auto", fontSize: 12, padding: "5px 12px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 5 },
  content: { position: "relative", zIndex: 1, maxWidth: 700, margin: "0 auto", padding: "28px 24px 60px" },
  stateMsg: { textAlign: "center", color: "#475569", fontStyle: "italic", padding: "60px 20px", fontSize: 14 },
  empty: { textAlign: "center", padding: "60px 20px" },
  emptyIcon: { fontSize: 40, color: "#1e3a5f", marginBottom: 16 },
  emptyText: { fontSize: 18, color: "#475569", marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: "#334155", fontStyle: "italic", marginBottom: 24 },
  emptyBtn: { background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.3)", color: "#93c5fd", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontFamily: "Georgia,serif" },
  entriesList: { display: "flex", flexDirection: "column", gap: 12 },
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "16px 20px", cursor: "pointer" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardDate: { fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" },
  badge: { fontSize: 11, padding: "2px 10px", borderRadius: 20, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em" },
  resetBadge: { fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "rgba(96,165,250,0.1)", color: "#60a5fa", fontWeight: "bold" },
  cardPreview: { fontSize: 14, color: "#94a3b8", lineHeight: 1.5, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardResult: { fontSize: 13, color: "#4ade80", display: "flex", alignItems: "center", gap: 6 },
  resultDot: { fontSize: 8 },
  anchorChip: { fontSize: 11, color: "#475569", background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 4 },
  form: { display: "flex", flexDirection: "column", gap: 22 },
  formTitle: { fontSize: 20, fontWeight: "bold", color: "#f1f5f9", letterSpacing: "-0.3px" },
  formSubtitle: { fontSize: 13, color: "#475569", fontStyle: "italic", marginTop: -14 },
  sectionHeader: { display: "flex", flexDirection: "column", gap: 4 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", color: "#f1f5f9", letterSpacing: "-0.2px" },
  sectionSub: { fontSize: 13, color: "#475569", fontStyle: "italic" },
  divider: { borderTop: "1px solid rgba(255,255,255,0.06)", margin: "4px 0" },
  logReadout: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "16px", display: "flex", flexDirection: "column", gap: 14 },
  logReadoutLabel: { fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 },
  logReadoutEntry: { display: "flex", flexDirection: "column", gap: 5, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.04)" },
  logReadoutTop: { display: "flex", alignItems: "center", gap: 10, marginBottom: 2 },
  logReadoutDate: { fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" },
  logReadoutField: { fontSize: 13, color: "#94a3b8", lineHeight: 1.5 },
  logReadoutFieldLabel: { color: "#64748b", fontStyle: "italic" },
  checklistGroup: { display: "flex", flexDirection: "column", gap: 10 },
  checkItem: { display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", cursor: "pointer" },
  checkItemDone: { background: "rgba(96,165,250,0.06)", borderColor: "rgba(96,165,250,0.2)" },
  checkbox: { width: 22, height: 22, borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, color: "#93c5fd", marginTop: 1 },
  checkboxDone: { background: "rgba(96,165,250,0.2)", borderColor: "rgba(96,165,250,0.5)" },
  checkLabel: { fontSize: 14, color: "#e2e8f0", marginBottom: 3 },
  checkSub: { fontSize: 12, color: "#475569", fontStyle: "italic" },
  allDoneBanner: { background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.25)", borderRadius: 8, padding: "14px 18px", color: "#93c5fd", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  logNowBtn: { background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: "Georgia,serif", whiteSpace: "nowrap" },
  row: { display: "flex", gap: 20, flexWrap: "wrap" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 180 },
  label: { fontSize: 13, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" },
  fieldHint: { fontSize: 12, color: "#475569", fontStyle: "italic", marginTop: -2 },
  input: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "9px 12px", color: "#e2e8f0", fontSize: 14, fontFamily: "Georgia,serif", outline: "none" },
  textarea: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "10px 12px", color: "#e2e8f0", fontSize: 14, fontFamily: "Georgia,serif", outline: "none", resize: "vertical", lineHeight: 1.6 },
  diffRow: { display: "flex", gap: 6 },
  diffBtn: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 14px", color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "Georgia,serif" },
  submitBtn: { background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.4)", color: "#93c5fd", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontSize: 15, fontFamily: "Georgia,serif", alignSelf: "flex-start" },
  submitBtnSaved: { background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.4)", color: "#4ade80" },
  submitBtnError: { background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)", color: "#f97316" },
  backBtn: { background: "transparent", border: "none", color: "#475569", cursor: "pointer", fontSize: 13, fontFamily: "Georgia,serif", padding: 0, alignSelf: "flex-start" },
  detailDate: { fontSize: 18, fontWeight: "bold", color: "#f1f5f9", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 },
  detailBlock: { borderLeft: "2px solid rgba(96,165,250,0.2)", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6 },
  detailLabel: { fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" },
  detailValue: { fontSize: 15, color: "#94a3b8", lineHeight: 1.6 },
};

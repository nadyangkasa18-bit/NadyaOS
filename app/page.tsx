"use client";

import { useEffect, useMemo, useState } from "react";

type View = "today" | "capture" | "memory";
type TaskState = "ready" | "done";

type Task = {
  id: string;
  title: string;
  project: string;
  minutes: number;
  xp: number;
  reason: string;
  accent: "violet" | "yellow" | "blue" | "coral";
  state: TaskState;
};

type Note = {
  id: string;
  text: string;
  kind: "note" | "task" | "decision" | "idea";
  project: string;
  createdAt: string;
};

const seedTasks: Task[] = [
  {
    id: "aita-direction",
    title: "Turn the AITA × OtterWay direction into one clear product story",
    project: "AITA",
    minutes: 45,
    xp: 24,
    reason: "High-impact decision · unblocks the next product steps",
    accent: "violet",
    state: "ready",
  },
  {
    id: "wedding-booklet",
    title: "Decide the final wedding booklet sections",
    project: "Wedding",
    minutes: 20,
    xp: 12,
    reason: "Easy decision · prevents the booklet from lingering",
    accent: "yellow",
    state: "ready",
  },
  {
    id: "otterway-ticket",
    title: "Write the OtterWay edit-event enhancement ticket",
    project: "OtterWay",
    minutes: 15,
    xp: 10,
    reason: "Small task · closes an open product loop",
    accent: "blue",
    state: "ready",
  },
  {
    id: "reply-vendor",
    title: "Reply to the outstanding wedding vendor message",
    project: "Life admin",
    minutes: 8,
    xp: 8,
    reason: "Fast admin · remove it from your head",
    accent: "coral",
    state: "ready",
  },
];

const seedNotes: Note[] = [
  {
    id: "m1",
    text: "AITA is travel intelligence, not necessarily a destination. Distribution could live through WhatsApp, Telegram, OtterWay, and partners.",
    kind: "decision",
    project: "AITA",
    createdAt: "Aug 26",
  },
  {
    id: "m2",
    text: "The daily interface should hide the master backlog. Nadya should see one task now, two or three next, and trust the system to remember the rest.",
    kind: "decision",
    project: "Nadya OS",
    createdAt: "Today",
  },
  {
    id: "m3",
    text: "Gamification should reward execution, not punish broken streaks. Each day is a fresh run with XP and unlockable game time.",
    kind: "idea",
    project: "Nadya OS",
    createdAt: "Today",
  },
  {
    id: "m4",
    text: "Wedding room booklet: itinerary, transport, dress code, nearby ideas, note from us, plus one playful interactive element.",
    kind: "note",
    project: "Wedding",
    createdAt: "Aug 19",
  },
];

const navItems: { id: View; label: string; glyph: string }[] = [
  { id: "today", label: "Today", glyph: "✦" },
  { id: "capture", label: "Capture", glyph: "+" },
  { id: "memory", label: "Memory", glyph: "⌘" },
];

export default function Home() {
  const [view, setView] = useState<View>("today");
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [notes, setNotes] = useState<Note[]>(seedNotes);
  const [xp, setXp] = useState(32);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [captureText, setCaptureText] = useState("");
  const [captureKind, setCaptureKind] = useState<Note["kind"]>("note");
  const [memoryQuery, setMemoryQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("nadya-os-prototype");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.tasks) setTasks(parsed.tasks);
      if (parsed.notes) setNotes(parsed.notes);
      if (typeof parsed.xp === "number") setXp(parsed.xp);
    } catch {
      // Prototype storage should never block the interface.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "nadya-os-prototype",
      JSON.stringify({ tasks, notes, xp })
    );
  }, [tasks, notes, xp]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const remaining = tasks.filter((task) => task.state !== "done");
  const current = remaining[0];
  const upcoming = remaining.slice(1, 4);
  const completed = tasks.filter((task) => task.state === "done").length;
  const rewardTarget = 50;
  const rewardProgress = Math.min(100, (xp / rewardTarget) * 100);

  const memoryResults = useMemo(() => {
    const query = memoryQuery.trim().toLowerCase();
    if (!query) return notes;
    return notes.filter((note) =>
      `${note.text} ${note.project} ${note.kind}`.toLowerCase().includes(query)
    );
  }, [memoryQuery, notes]);

  function completeTask(id: string) {
    const task = tasks.find((item) => item.id === id);
    if (!task || task.state === "done") return;
    setTasks((items) =>
      items.map((item) => (item.id === id ? { ...item, state: "done" } : item))
    );
    setXp((value) => value + task.xp);
    setActiveTask(null);
    setToast(`+${task.xp} XP · quest complete`);
    if (navigator.vibrate) navigator.vibrate([35, 30, 55]);
  }

  function saveCapture() {
    const text = captureText.trim();
    if (!text) return;
    const newNote: Note = {
      id: `${Date.now()}`,
      text,
      kind: captureKind,
      project: "Inbox",
      createdAt: "Just now",
    };
    setNotes((items) => [newNote, ...items]);

    if (captureKind === "task") {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: text,
        project: "Inbox",
        minutes: 15,
        xp: 8,
        reason: "New capture · waiting for AI prioritization",
        accent: "blue",
        state: "ready",
      };
      setTasks((items) => [...items, newTask]);
    }

    setCaptureText("");
    setToast(captureKind === "task" ? "Task remembered" : "Memory saved");
    setView("today");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">N</div>
          <div>
            <strong>Nadya OS</strong>
            <span>personal operating system</span>
          </div>
        </div>

        <nav className="desktop-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "nav-item active" : "nav-item"}
              onClick={() => setView(item.id)}
            >
              <span className="nav-glyph">{item.glyph}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="mini-status">
            <span className="status-dot" />
            Prototype mode
          </div>
          <p>Your data is only stored on this device for now.</p>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="mobile-brand">
            <div className="brand-mark small">N</div>
            <strong>Nadya OS</strong>
          </div>
          <div className="date-chip">TUE · SEP 01</div>
          <button className="profile-chip" aria-label="Profile">
            NA
          </button>
        </header>

        {view === "today" && (
          <div className="page today-page">
            <section className="editorial-heading">
              <div>
                <p className="eyebrow">TODAY’S RUN</p>
                <h1>
                  Good afternoon.<br />
                  <span>One thing at a time.</span>
                </h1>
              </div>
              <div className="day-score">
                <strong>{completed}</strong>
                <span>quests cleared</span>
              </div>
            </section>

            {current ? (
              <section className={`hero-quest ${current.accent}`}>
                <div className="quest-number">01</div>
                <div className="quest-main">
                  <div className="quest-meta-row">
                    <span>MAIN QUEST</span>
                    <span>{current.project}</span>
                  </div>
                  <h2>{current.title}</h2>
                  <p className="why-now">{current.reason}</p>
                  <div className="quest-footer">
                    <div className="task-stats">
                      <span>◷ {current.minutes} min</span>
                      <span>✦ {current.xp} XP</span>
                    </div>
                    <div className="quest-actions">
                      {activeTask === current.id ? (
                        <button className="primary-button complete" onClick={() => completeTask(current.id)}>
                          Mark complete ✓
                        </button>
                      ) : (
                        <button className="primary-button" onClick={() => setActiveTask(current.id)}>
                          Start quest →
                        </button>
                      )}
                    </div>
                  </div>
                  {activeTask === current.id && (
                    <div className="focus-strip">
                      <span className="pulse-dot" /> Focus mode on. Everything else can wait.
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <section className="hero-quest done-state">
                <div className="quest-main">
                  <p className="eyebrow">RUN COMPLETE</p>
                  <h2>You cleared everything queued for today.</h2>
                  <p>Go play something. The backlog will still be here tomorrow.</p>
                </div>
              </section>
            )}

            <section className="lower-grid">
              <div className="up-next panel">
                <div className="section-title-row">
                  <div>
                    <p className="eyebrow">QUEUED FOR YOU</p>
                    <h3>Up next</h3>
                  </div>
                  <span className="quiet-label">AI ordered</span>
                </div>

                <div className="task-list">
                  {upcoming.length ? (
                    upcoming.map((task, index) => (
                      <button
                        className="task-row"
                        key={task.id}
                        onClick={() => setToast("The order is protected so you don’t have to reprioritize.")}
                      >
                        <span className={`task-index ${task.accent}`}>{String(index + 2).padStart(2, "0")}</span>
                        <span className="task-copy">
                          <strong>{task.title}</strong>
                          <small>{task.project} · {task.minutes} min</small>
                        </span>
                        <span className="task-xp">+{task.xp}</span>
                      </button>
                    ))
                  ) : (
                    <p className="empty-copy">Nothing else queued. Nice.</p>
                  )}
                </div>
              </div>

              <div className="reward-card panel">
                <div className="reward-top">
                  <div>
                    <p className="eyebrow">NEXT UNLOCK</p>
                    <h3>30 min game time</h3>
                  </div>
                  <div className="game-token">🎮</div>
                </div>
                <div className="xp-line">
                  <strong>{xp} XP</strong>
                  <span>{Math.max(0, rewardTarget - xp)} to unlock</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${rewardProgress}%` }} />
                </div>
                <p className="reward-note">
                  {xp >= rewardTarget
                    ? "Unlocked. You earned it — no guilt attached."
                    : "No streaks. No punishment. Just today’s run."}
                </p>
              </div>
            </section>

            <button className="capture-bar" onClick={() => setView("capture")}>
              <span className="capture-plus">+</span>
              <span>
                <strong>Dump something from your head</strong>
                <small>task, thought, decision, random idea — sorting is not your job</small>
              </span>
              <span className="shortcut">⌘ K</span>
            </button>
          </div>
        )}

        {view === "capture" && (
          <div className="page capture-page">
            <section className="editorial-heading compact">
              <div>
                <p className="eyebrow">ZERO-ADMIN CAPTURE</p>
                <h1>
                  Get it out.<br />
                  <span>I’ll remember it.</span>
                </h1>
              </div>
            </section>

            <section className="capture-studio">
              <div className="capture-type-row">
                {(["note", "task", "decision", "idea"] as Note["kind"][]).map((kind) => (
                  <button
                    key={kind}
                    className={captureKind === kind ? "type-pill active" : "type-pill"}
                    onClick={() => setCaptureKind(kind)}
                  >
                    {kind}
                  </button>
                ))}
              </div>
              <textarea
                autoFocus
                value={captureText}
                onChange={(event) => setCaptureText(event.target.value)}
                placeholder="Type the messy version. “Need to ask Matt about the booklet, and Glen said...”"
              />
              <div className="capture-studio-footer">
                <div className="ai-preview">
                  <span className="spark">✦</span>
                  <span>
                    <strong>Later: AI auto-sorts this</strong>
                    <small>projects · people · tasks · decisions · connections</small>
                  </span>
                </div>
                <button className="primary-button" onClick={saveCapture} disabled={!captureText.trim()}>
                  Save to brain →
                </button>
              </div>
            </section>

            <div className="capture-hint-grid">
              <div><span>01</span><strong>Write naturally</strong><p>No tags. No folders. No perfect phrasing.</p></div>
              <div><span>02</span><strong>Close the app</strong><p>You shouldn’t need to “process” your inbox later.</p></div>
              <div><span>03</span><strong>Trust retrieval</strong><p>Ask for it when you need it instead of remembering where it lives.</p></div>
            </div>
          </div>
        )}

        {view === "memory" && (
          <div className="page memory-page">
            <section className="editorial-heading compact memory-heading">
              <div>
                <p className="eyebrow">SECOND BRAIN</p>
                <h1>
                  Ask your past self<br />
                  <span>anything.</span>
                </h1>
              </div>
            </section>

            <div className="memory-search-wrap">
              <span className="search-icon">⌕</span>
              <input
                value={memoryQuery}
                onChange={(event) => setMemoryQuery(event.target.value)}
                placeholder="What did we decide about AITA and OtterWay?"
              />
              <span className="memory-count">{memoryResults.length}</span>
            </div>

            <section className="memory-grid">
              {memoryResults.map((note, index) => (
                <article className={`memory-card memory-${index % 4}`} key={note.id}>
                  <div className="memory-card-top">
                    <span className={`memory-kind ${note.kind}`}>{note.kind}</span>
                    <span>{note.createdAt}</span>
                  </div>
                  <p>{note.text}</p>
                  <div className="memory-project">↳ {note.project}</div>
                </article>
              ))}
              {!memoryResults.length && (
                <div className="no-memory">
                  <strong>No exact match.</strong>
                  <p>In the connected version, semantic search will find related thoughts even when the wording is different.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </section>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={view === item.id ? "mobile-nav-item active" : "mobile-nav-item"}
            onClick={() => setView(item.id)}
          >
            <span>{item.glyph}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

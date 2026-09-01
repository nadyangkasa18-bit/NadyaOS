"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent, type TouchEvent } from "react";

type View = "today" | "capture" | "memory";
type TaskState = "ready" | "done";
type Accent = "violet" | "lime" | "yellow" | "blue" | "coral";
type CaptureKind = "note" | "task" | "decision" | "idea";

type Task = {
  id: string;
  title: string;
  project: string;
  minutes: number;
  xp: number;
  reason: string;
  accent: Accent;
  state: TaskState;
};

type Note = {
  id: string;
  text: string;
  kind: CaptureKind;
  project: string;
  createdAt: string;
  minutes?: number;
};

type CaptureDraft = {
  id: string;
  text: string;
  kind: CaptureKind;
  minutes?: number;
};

type Habit = {
  id: string;
  title: string;
  cue: string;
  minutes: number;
  xp: number;
  done: boolean;
};

const seedTasks: Task[] = [
  {
    id: "aita-direction",
    title: "Turn the AITA × OtterWay direction into one clear product story",
    project: "AITA",
    minutes: 45,
    xp: 24,
    reason: "High impact · unblocks the next product steps",
    accent: "violet",
    state: "ready",
  },
  {
    id: "wedding-booklet",
    title: "Decide the final wedding booklet sections",
    project: "Wedding",
    minutes: 20,
    xp: 12,
    reason: "Small decision · stops this from lingering",
    accent: "lime",
    state: "ready",
  },
  {
    id: "otterway-ticket",
    title: "Write the OtterWay edit-event enhancement ticket",
    project: "OtterWay",
    minutes: 15,
    xp: 10,
    reason: "Quick close · removes an open product loop",
    accent: "blue",
    state: "ready",
  },
  {
    id: "reply-vendor",
    title: "Reply to the outstanding wedding vendor message",
    project: "Life admin",
    minutes: 8,
    xp: 8,
    reason: "Fast admin · get it out of your head",
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
    text: "The daily interface should hide the master backlog. Show one thing now, a few things next, and remember the rest.",
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

const seedHabits: Habit[] = [
  {
    id: "shutdown-reset",
    title: "Reset the workspace",
    cue: "When work ends",
    minutes: 2,
    xp: 4,
    done: false,
  },
  {
    id: "tomorrow-first",
    title: "Write tomorrow's first move",
    cue: "Then",
    minutes: 2,
    xp: 4,
    done: false,
  },
  {
    id: "close-loop",
    title: "Close the laptop and leave",
    cue: "Then",
    minutes: 1,
    xp: 3,
    done: false,
  },
];

const navItems: { id: View; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "capture", label: "Capture" },
  { id: "memory", label: "Memory" },
];

function NavIcon({ name }: { name: View }) {
  if (name === "capture") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    );
  }

  if (name === "memory") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5v-16Z" />
        <path d="M5 18.5A2.5 2.5 0 0 1 7.5 16H19" />
        <path d="M9 7h6M9 10h5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5 14.2 9l5.3 2.2-5.3 2.2L12 19l-2.2-5.6-5.3-2.2L9.8 9 12 3.5Z" />
    </svg>
  );
}

function formatToday() {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());
}

function taskXp(minutes: number) {
  return Math.max(6, Math.min(30, Math.round(minutes / 5) * 2 + 4));
}

export default function Home() {
  const [view, setView] = useState<View>("today");
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [notes, setNotes] = useState<Note[]>(seedNotes);
  const [habits, setHabits] = useState<Habit[]>(seedHabits);
  const [xp, setXp] = useState(32);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [questIndex, setQuestIndex] = useState(0);
  const [captureText, setCaptureText] = useState("");
  const [captureKind, setCaptureKind] = useState<CaptureKind>("task");
  const [captureMinutes, setCaptureMinutes] = useState(15);
  const [captureBatch, setCaptureBatch] = useState<CaptureDraft[]>([]);
  const [memoryQuery, setMemoryQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [dateLabel, setDateLabel] = useState("Today");
  const swipeStartX = useRef<number | null>(null);

  useEffect(() => {
    setDateLabel(formatToday());
    const saved = window.localStorage.getItem("nadya-os-prototype");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.tasks)) setTasks(parsed.tasks);
        if (Array.isArray(parsed.notes)) setNotes(parsed.notes);
        if (Array.isArray(parsed.habits)) setHabits(parsed.habits);
        if (typeof parsed.xp === "number") setXp(parsed.xp);
      } catch {
        // Local prototype data should never block the interface.
      }
    }
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    window.localStorage.setItem(
      "nadya-os-prototype",
      JSON.stringify({ tasks, notes, habits, xp })
    );
  }, [tasks, notes, habits, xp, hasLoaded]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    document.body.style.overflow = activeTask ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeTask]);

  const remaining = useMemo(
    () => tasks.filter((task) => task.state !== "done"),
    [tasks]
  );

  useEffect(() => {
    setQuestIndex((index) => Math.min(index, Math.max(remaining.length - 1, 0)));
  }, [remaining.length]);

  const selectedQuest = remaining[questIndex];
  const activeQuest = tasks.find(
    (task) => task.id === activeTask && task.state !== "done"
  );
  const rewardTarget = 50;
  const rewardProgress = Math.min(100, (xp / rewardTarget) * 100);
  const habitsDone = habits.filter((habit) => habit.done).length;
  const nextHabitIndex = habits.findIndex((habit) => !habit.done);

  const memoryResults = useMemo(() => {
    const query = memoryQuery.trim().toLowerCase();
    if (!query) return notes;
    return notes.filter((note) =>
      `${note.text} ${note.project} ${note.kind}`.toLowerCase().includes(query)
    );
  }, [memoryQuery, notes]);

  function moveQuest(direction: number) {
    if (remaining.length < 2) return;
    setQuestIndex((index) => (index + direction + remaining.length) % remaining.length);
    if (navigator.vibrate) navigator.vibrate(8);
  }

  function handleSwipeEnd(clientX: number) {
    if (swipeStartX.current === null) return;
    const delta = clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(delta) < 48) return;
    moveQuest(delta < 0 ? 1 : -1);
  }

  function startQuest(id: string) {
    setActiveTask(id);
    if (navigator.vibrate) navigator.vibrate([22, 18, 32]);
  }

  function completeTask(id: string) {
    const task = tasks.find((item) => item.id === id);
    if (!task || task.state === "done") return;
    setTasks((items) =>
      items.map<Task>((item) =>
        item.id === id ? { ...item, state: "done" } : item
      )
    );
    setXp((value) => value + task.xp);
    setActiveTask(null);
    setQuestIndex(0);
    setToast(`+${task.xp} XP · quest cleared`);
    if (navigator.vibrate) navigator.vibrate([35, 30, 55]);
  }

  function completeHabit(id: string, index: number) {
    if (index > nextHabitIndex && nextHabitIndex !== -1) return;
    const habit = habits.find((item) => item.id === id);
    if (!habit || habit.done) return;
    setHabits((items) =>
      items.map((item) => (item.id === id ? { ...item, done: true } : item))
    );
    setXp((value) => value + habit.xp);
    setToast(`Habit linked · +${habit.xp} XP`);
    if (navigator.vibrate) navigator.vibrate(20);
  }

  function addCaptureToBatch() {
    const text = captureText.trim();
    if (!text) return;
    setCaptureBatch((items) => [
      ...items,
      {
        id: `draft-${Date.now()}`,
        text,
        kind: captureKind,
        minutes: captureKind === "task" ? captureMinutes : undefined,
      },
    ]);
    setCaptureText("");
    setToast("Added to this capture batch");
    if (navigator.vibrate) navigator.vibrate(10);
  }

  function removeCaptureDraft(id: string) {
    setCaptureBatch((items) => items.filter((item) => item.id !== id));
  }

  function saveCaptureBatch() {
    const currentText = captureText.trim();
    const drafts: CaptureDraft[] = [
      ...captureBatch,
      ...(currentText
        ? [
            {
              id: `draft-${Date.now()}`,
              text: currentText,
              kind: captureKind,
              minutes: captureKind === "task" ? captureMinutes : undefined,
            } as CaptureDraft,
          ]
        : []),
    ];

    if (!drafts.length) return;
    const now = Date.now();
    const newNotes: Note[] = drafts.map((draft, index) => ({
      id: `memory-${now}-${index}`,
      text: draft.text,
      kind: draft.kind,
      project: "Inbox",
      createdAt: "Just now",
      minutes: draft.minutes,
    }));
    const newTasks: Task[] = drafts
      .filter((draft) => draft.kind === "task")
      .map((draft, index) => {
        const minutes = draft.minutes ?? 15;
        return {
          id: `task-${now}-${index}`,
          title: draft.text,
          project: "Inbox",
          minutes,
          xp: taskXp(minutes),
          reason: "Fresh capture · ready for prioritization",
          accent: "blue" as Accent,
          state: "ready" as TaskState,
        };
      });

    setNotes((items) => [...newNotes.reverse(), ...items]);
    if (newTasks.length) setTasks((items) => [...items, ...newTasks]);
    setCaptureBatch([]);
    setCaptureText("");
    setToast(`${drafts.length} ${drafts.length === 1 ? "item" : "items"} saved · keep going if you want`);
  }

  return (
    <main className="app-root">
      <aside className="desktop-rail" aria-label="Main navigation">
        <button className="app-mark" onClick={() => setView("today")} aria-label="Nadya OS home">
          N
        </button>
        <nav className="rail-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "rail-item active" : "rail-item"}
              onClick={() => setView(item.id)}
              aria-label={item.label}
              title={item.label}
            >
              <NavIcon name={item.id} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="rail-xp">
          <span>{xp}</span>
          <small>XP</small>
        </div>
      </aside>

      <section className="app-surface">
        <header className="app-header">
          <div className="header-brand">
            <span className="header-dot" />
            <span>Nadya OS</span>
          </div>
          <div className="header-meta">
            <span className="mono-date">{dateLabel}</span>
            <span className="xp-pill">{xp} XP</span>
          </div>
        </header>

        {view === "today" && (
          <div className="screen today-screen">
            <section className="screen-intro">
              <p className="kicker">TODAY</p>
              <h1>Your next move.</h1>
              <p className="intro-copy">You do the work. The system holds everything else.</p>
            </section>

            <section className="quest-section">
              <div className="quest-section-top">
                <div>
                  <span className="section-label">MAIN QUEST</span>
                  <span className="queue-count">
                    {remaining.length ? `${questIndex + 1} / ${remaining.length}` : "clear"}
                  </span>
                </div>
                {remaining.length > 1 && <span className="swipe-hint">Swipe to browse queue</span>}
              </div>

              {selectedQuest ? (
                <article
                  className={`quest-card ${selectedQuest.accent}`}
                  onTouchStart={(event: TouchEvent<HTMLElement>) => {
                    swipeStartX.current = event.touches[0]?.clientX ?? null;
                  }}
                  onTouchEnd={(event: TouchEvent<HTMLElement>) => {
                    handleSwipeEnd(event.changedTouches[0]?.clientX ?? 0);
                  }}
                >
                  <div className="quest-card-glow" />
                  <div className="quest-card-top">
                    <span className="project-chip">{selectedQuest.project}</span>
                    <span className="quest-position mono-text">{String(questIndex + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="quest-card-body">
                    <h2>{selectedQuest.title}</h2>
                    <p>{selectedQuest.reason}</p>
                  </div>
                  <div className="quest-card-bottom">
                    <div className="quest-stats mono-text">
                      <span>{selectedQuest.minutes} MIN</span>
                      <span>+{selectedQuest.xp} XP</span>
                    </div>
                    <button className="start-button" onClick={() => startQuest(selectedQuest.id)}>
                      Start
                      <span>↗</span>
                    </button>
                  </div>
                </article>
              ) : (
                <article className="quest-card clear-card">
                  <div className="quest-card-body">
                    <span className="section-label">RUN COMPLETE</span>
                    <h2>Nothing is asking for you right now.</h2>
                    <p>Use the space. Play something, go outside, or capture what comes next.</p>
                  </div>
                </article>
              )}

              {remaining.length > 1 && (
                <div className="quest-pagination">
                  <button onClick={() => moveQuest(-1)} aria-label="Previous quest">←</button>
                  <div className="quest-dots" aria-label="Quest position">
                    {remaining.map((task, index) => (
                      <button
                        key={task.id}
                        className={index === questIndex ? "quest-dot active" : "quest-dot"}
                        onClick={() => setQuestIndex(index)}
                        aria-label={`View quest ${index + 1}`}
                      />
                    ))}
                  </div>
                  <button onClick={() => moveQuest(1)} aria-label="Next quest">→</button>
                </div>
              )}
            </section>

            <section className="today-grid">
              <article className="habit-panel panel">
                <div className="panel-heading">
                  <div>
                    <span className="section-label">HABIT STACK</span>
                    <h3>Build the chain, not the streak.</h3>
                  </div>
                  <span className="panel-count mono-text">{habitsDone}/{habits.length}</span>
                </div>
                <p className="panel-copy">One cue leads into the next. New habits join only after the anchor feels easy.</p>
                <div className="habit-list">
                  {habits.map((habit, index) => {
                    const locked = nextHabitIndex !== -1 && index > nextHabitIndex;
                    return (
                      <button
                        key={habit.id}
                        className={`habit-row ${habit.done ? "done" : ""} ${locked ? "locked" : ""}`}
                        onClick={() => completeHabit(habit.id, index)}
                        disabled={locked || habit.done}
                      >
                        <span className="habit-step">{habit.done ? "✓" : index + 1}</span>
                        <span className="habit-copy">
                          <small>{habit.cue}</small>
                          <strong>{habit.title}</strong>
                        </span>
                        <span className="habit-time mono-text">{habit.minutes}M</span>
                      </button>
                    );
                  })}
                </div>
                <div className="habit-rule">
                  <span>Prototype rule</span>
                  <strong>Add the next habit after 5 easy days.</strong>
                </div>
              </article>

              <article className="reward-panel panel">
                <div className="panel-heading">
                  <div>
                    <span className="section-label">NEXT UNLOCK</span>
                    <h3>30 min game time</h3>
                  </div>
                  <span className="reward-icon">◒</span>
                </div>
                <div className="reward-meter">
                  <div className="reward-numbers">
                    <strong>{xp}</strong>
                    <span className="mono-text">/ {rewardTarget} XP</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${rewardProgress}%` }} />
                  </div>
                </div>
                <p className="panel-copy">
                  {xp >= rewardTarget
                    ? "Unlocked. Use it whenever you want — no guilt attached."
                    : `${Math.max(0, rewardTarget - xp)} XP left. No streaks and no punishment.`}
                </p>
              </article>
            </section>

            <button className="quick-capture" onClick={() => setView("capture")}>
              <span className="quick-plus">+</span>
              <span>
                <strong>Capture whatever is taking up space</strong>
                <small>Tasks, notes, decisions, half-formed thoughts.</small>
              </span>
              <span className="quick-arrow">→</span>
            </button>
          </div>
        )}

        {view === "capture" && (
          <div className="screen capture-screen">
            <section className="screen-intro compact-intro">
              <p className="kicker">CAPTURE MODE</p>
              <h1>Keep going until your head feels lighter.</h1>
              <p className="intro-copy">Add a whole batch. Nothing sends you back home until you decide you're done.</p>
            </section>

            <section className="capture-composer panel">
              <div className="capture-kind-row" aria-label="Capture type">
                {(["task", "note", "decision", "idea"] as CaptureKind[]).map((kind) => (
                  <button
                    key={kind}
                    className={captureKind === kind ? "kind-pill active" : "kind-pill"}
                    onClick={() => setCaptureKind(kind)}
                  >
                    {kind}
                  </button>
                ))}
              </div>

              <textarea
                autoFocus
                value={captureText}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setCaptureText(event.target.value)}
                onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault();
                    addCaptureToBatch();
                  }
                }}
                placeholder={
                  captureKind === "task"
                    ? "What needs to get done? Write the messy version."
                    : "Write it exactly as it is in your head."
                }
              />

              {captureKind === "task" && (
                <div className="estimate-row">
                  <div>
                    <span className="field-label">TIME ESTIMATE</span>
                    <small>How long should this take if you actually focus?</small>
                  </div>
                  <div className="estimate-controls">
                    {[10, 15, 30, 45, 60].map((minutes) => (
                      <button
                        key={minutes}
                        className={captureMinutes === minutes ? "estimate-chip active" : "estimate-chip"}
                        onClick={() => setCaptureMinutes(minutes)}
                      >
                        {minutes}m
                      </button>
                    ))}
                    <label className="custom-estimate">
                      <input
                        type="number"
                        min="1"
                        max="480"
                        value={captureMinutes}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => setCaptureMinutes(Math.max(1, Number(event.target.value) || 1))}
                      />
                      <span>min</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="composer-actions">
                <span className="shortcut-hint mono-text">⌘ ENTER · ADD TO BATCH</span>
                <button className="secondary-button" onClick={addCaptureToBatch} disabled={!captureText.trim()}>
                  Add another +
                </button>
              </div>
            </section>

            <section className="batch-panel">
              <div className="batch-heading">
                <div>
                  <span className="section-label">THIS BATCH</span>
                  <h3>{captureBatch.length ? `${captureBatch.length} waiting to save` : "Nothing staged yet"}</h3>
                </div>
                {(captureBatch.length > 0 || captureText.trim()) && (
                  <button className="save-batch-button" onClick={saveCaptureBatch}>
                    Save {captureBatch.length + (captureText.trim() ? 1 : 0)} to brain
                  </button>
                )}
              </div>

              {captureBatch.length > 0 && (
                <div className="batch-list">
                  {captureBatch.map((draft, index) => (
                    <article className="batch-item" key={draft.id}>
                      <span className="batch-number mono-text">{String(index + 1).padStart(2, "0")}</span>
                      <div className="batch-copy">
                        <span className={`batch-kind ${draft.kind}`}>{draft.kind}</span>
                        <p>{draft.text}</p>
                      </div>
                      {draft.minutes && <span className="batch-minutes mono-text">{draft.minutes}m</span>}
                      <button className="remove-batch" onClick={() => removeCaptureDraft(draft.id)} aria-label="Remove from batch">×</button>
                    </article>
                  ))}
                </div>
              )}

              <button className="done-capturing" onClick={() => setView("today")}>Done capturing →</button>
            </section>
          </div>
        )}

        {view === "memory" && (
          <div className="screen memory-screen">
            <section className="screen-intro compact-intro">
              <p className="kicker">MEMORY</p>
              <h1>Ask your past self.</h1>
              <p className="intro-copy">For now this searches exact text. Later, semantic memory will connect the thought behind the words.</p>
            </section>

            <div className="memory-search panel">
              <NavIcon name="memory" />
              <input
                value={memoryQuery}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setMemoryQuery(event.target.value)}
                placeholder="Search decisions, ideas, projects..."
              />
              <span className="memory-result-count mono-text">{memoryResults.length}</span>
            </div>

            <section className="memory-list">
              {memoryResults.map((note, index) => (
                <article className="memory-row" key={note.id} style={{ animationDelay: `${Math.min(index, 5) * 35}ms` }}>
                  <div className="memory-meta">
                    <span className={`memory-kind ${note.kind}`}>{note.kind}</span>
                    <span className="mono-text">{note.createdAt}</span>
                  </div>
                  <p>{note.text}</p>
                  <div className="memory-footer">
                    <span>{note.project}</span>
                    {note.minutes && <span className="mono-text">{note.minutes} MIN</span>}
                  </div>
                </article>
              ))}
              {!memoryResults.length && (
                <div className="memory-empty panel">
                  <span>⌁</span>
                  <h3>No exact match.</h3>
                  <p>The Supabase + AI version will surface related memories even when your wording is completely different.</p>
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
            <span className="mobile-nav-icon"><NavIcon name={item.id} /></span>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {activeQuest && (
        <div className={`focus-overlay ${activeQuest.accent}`} role="dialog" aria-modal="true" aria-label="Active quest">
          <div className="focus-noise" />
          <header className="focus-header">
            <span className="focus-brand">NADYA OS · FOCUS</span>
            <button className="focus-close" onClick={() => setActiveTask(null)} aria-label="Exit focus mode">×</button>
          </header>
          <div className="focus-content">
            <div className="focus-meta mono-text">
              <span>MAIN QUEST</span>
              <span>{activeQuest.project}</span>
              <span>{activeQuest.minutes} MIN</span>
            </div>
            <h1>{activeQuest.title.toUpperCase()}</h1>
            <p>{activeQuest.reason}</p>
          </div>
          <footer className="focus-footer">
            <button className="focus-secondary" onClick={() => setActiveTask(null)}>Not now</button>
            <button className="focus-complete" onClick={() => completeTask(activeQuest.id)}>
              Complete quest <span>+{activeQuest.xp} XP</span>
            </button>
          </footer>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

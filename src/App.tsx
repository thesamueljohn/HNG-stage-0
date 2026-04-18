import { useState, useEffect } from "react";
import { TaskCard, type TaskCardProps, type Status } from "./assets/components/card";
import "./assets/components/card.css";
import "./App.css";

// ─── Storage key ───────────────────────────────────────────────────────────────
const LS_KEY = "hng-tasks-v3";

// ─── Sample / seed data ────────────────────────────────────────────────────────
const now = new Date();

function daysFromNow(n: number) {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  return d;
}

function hoursFromNow(h: number) {
  const d = new Date(now);
  d.setHours(d.getHours() + h);
  return d;
}

type TaskData = Omit<TaskCardProps, "onUpdate" | "onDelete">;

const SEED_TASKS: TaskData[] = [
  {
    // urgency: overdue — red
    id: "task-1",
    title: "Design system tokens review",
    description:
      "Audit the existing colour palette, typography scale, and spacing system. Align with the new brand guidelines released last week and document any breaking changes that affect downstream components.",
    priority: "medium",
    dueDate: hoursFromNow(-3),   // 3 hours overdue
    status: "in-progress",
    tags: ["Design", "UI", "Brand"],
  },
  {
    // urgency: critical — orange (< 6 h)
    id: "task-2",
    title: "Critical security patch deploy",
    description:
      "Apply CVE-2026-1337 patch across all nodes. Requires a coordinated rolling restart — coordinate with SRE on-call. Patch window is narrow, do not miss the maintenance window.",
    priority: "urgent",
    dueDate: hoursFromNow(4),    // 4 hours left
    status: "in-progress",
    tags: ["Security", "DevOps", "Critical"],
  },
  {
    // urgency: soon — amber (< 24 h)
    id: "task-3",
    title: "Finalise release notes",
    description:
      "Write up the changelog for v2.4.0 and get sign-off from the PM before the release tag is pushed tonight.",
    priority: "high",
    dueDate: hoursFromNow(10),   // 10 hours left
    status: "pending",
    tags: ["Release", "Docs"],
  },
  {
    // urgency: approaching — blue (< 3 days)
    id: "task-4",
    title: "Empty T33 folders",
    description:
      "Clear out all the old files and temporary folders on the production server before the nightly backup window kicks in. Verify checksums after deletion and notify the DevOps team.",
    priority: "high",
    dueDate: daysFromNow(2),     // 2 days left
    status: "pending",
    tags: ["DevOps", "Server", "Maintenance"],
  },
  {
    // urgency: normal — no tint (far deadline)
    id: "task-5",
    title: "Plan Q3 roadmap session",
    description:
      "Schedule a cross-functional meeting to align on the Q3 product priorities. Prepare a draft agenda and share a pre-read doc one week in advance.",
    priority: "low",
    dueDate: daysFromNow(14),    // 2 weeks away
    status: "pending",
    tags: ["Strategy", "Planning"],
  },
  {
    // urgency: done — faded, no accent
    id: "task-6",
    title: "Write Q2 sprint retrospective",
    description:
      "Summarise wins, blockers, and action items from this sprint cycle. Share the doc with the team by EOD.",
    priority: "low",
    dueDate: daysFromNow(-1),    // was due yesterday but done
    status: "done",
    tags: ["Management", "Docs"],
  },
];

// ─── localStorage helpers ──────────────────────────────────────────────────────
function loadTasks(): TaskData[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return SEED_TASKS;
    const parsed = JSON.parse(raw) as Array<Omit<TaskData, "dueDate"> & { dueDate: string }>;
    return parsed.map((t) => ({ ...t, dueDate: new Date(t.dueDate) }));
  } catch {
    return SEED_TASKS;
  }
}

function saveTasks(tasks: TaskData[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(tasks));
  } catch {
    // quota exceeded
  }
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [tasks, setTasks] = useState<TaskData[]>(loadTasks);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function handleUpdate(id: string, patch: Partial<Omit<TaskCardProps, "onUpdate" | "onDelete">>) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ...patch } : t
      )
    );
  }

  return (
    <main className="app-main">
      {/* ── Hero heading ── */}
      <header className="app-header">
        <div className="app-header__badge">ProcurioOS</div>
        <h1 className="app-header__title">
          Daily <span className="app-header__accent">Tasks</span>
        </h1>
        <p className="app-header__sub">
          Stay in flow. Track what matters. Ship with clarity.
        </p>
      </header>

      {/* ── Stats row ── */}
      <div className="app-stats" role="region" aria-label="Task statistics">
        <div className="app-stat">
          <span className="app-stat__num">{tasks.length}</span>
          <span className="app-stat__label">Total</span>
        </div>
        <div className="app-stat">
          <span className="app-stat__num">
            {tasks.filter((t) => t.status === "in-progress").length}
          </span>
          <span className="app-stat__label">In Progress</span>
        </div>
        <div className="app-stat">
          <span className="app-stat__num">
            {tasks.filter((t) => t.status === "done").length}
          </span>
          <span className="app-stat__label">Done</span>
        </div>
        <div className="app-stat app-stat--urgent">
          <span className="app-stat__num">
            {tasks.filter((t) => t.priority === "urgent").length}
          </span>
          <span className="app-stat__label">Urgent</span>
        </div>
      </div>

      {/* ── Cards grid ── */}
      <section className="app-grid" aria-label="Task cards">
        {tasks.length === 0 ? (
          <div className="app-empty" role="status">
            <span className="app-empty__icon">🎉</span>
            <p>All caught up! No tasks remaining.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              {...task}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))
        )}
      </section>
    </main>
  );
}

// Re-export Status for App-level convenience
export type { Status };

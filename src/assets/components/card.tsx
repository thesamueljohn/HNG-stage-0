import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type Priority = "low" | "medium" | "high" | "urgent";
export type Status = "todo" | "in-progress" | "done";

export interface TaskCardProps {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: Date;
  status: Status;
  tags: string[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleComplete?: (id: string, completed: boolean) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a Date as "Due Feb 18, 2026" */
function formatDueDate(date: Date): string {
  return `Due ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

/** Calculate a human-friendly time-remaining string accurate to seconds */
function formatTimeRemaining(date: Date): { label: string; isOverdue: boolean } {
  const now = Date.now();
  const diff = date.getTime() - now; // ms
  const absDiff = Math.abs(diff);

  const totalSeconds = Math.floor(absDiff / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  let unit: string;
  if (totalDays >= 1) {
    unit = `${totalDays} day${totalDays !== 1 ? "s" : ""}`;
  } else if (totalHours >= 1) {
    unit = `${totalHours} hour${totalHours !== 1 ? "s" : ""}`;
  } else if (totalMinutes >= 1) {
    unit = `${totalMinutes} minute${totalMinutes !== 1 ? "s" : ""}`;
  } else {
    unit = `${totalSeconds} second${totalSeconds !== 1 ? "s" : ""}`;
  }

  if (diff < 0) {
    return { label: `Overdue by ${unit}`, isOverdue: true };
  }
  return { label: `Due in ${unit}`, isOverdue: false };
}

// ─── Priority config ──────────────────────────────────────────────────────────
const priorityConfig: Record<Priority, { label: string; className: string }> = {
  low: { label: "Low", className: "priority-low" },
  medium: { label: "Medium", className: "priority-medium" },
  high: { label: "High", className: "priority-high" },
  urgent: { label: "Urgent", className: "priority-urgent" },
};

// ─── Status config ────────────────────────────────────────────────────────────
const statusConfig: Record<Status, { label: string; className: string; dot: string }> = {
  todo: { label: "To Do", className: "status-todo", dot: "dot-todo" },
  "in-progress": { label: "In Progress", className: "status-in-progress", dot: "dot-in-progress" },
  done: { label: "Done", className: "status-done", dot: "dot-done" },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function TaskCard({
  id,
  title,
  description,
  priority,
  dueDate,
  status,
  tags,
  onEdit,
  onDelete,
  onToggleComplete,
}: TaskCardProps) {
  const [completed, setCompleted] = useState(status === "done");
  const [timeRemaining, setTimeRemaining] = useState(() => formatTimeRemaining(dueDate));

  // Tick every 30 seconds to refresh relative time
  useEffect(() => {
    const tick = () => setTimeRemaining(formatTimeRemaining(dueDate));
    tick(); // immediate
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [dueDate]);

  const handleCheck = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      setCompleted(checked);
      onToggleComplete?.(id, checked);
    },
    [id, onToggleComplete]
  );

  const pCfg = priorityConfig[priority];
  const sCfg = statusConfig[completed ? "done" : status];
  const checkboxId = `task-checkbox-${id}`;
  const dueDateISO = dueDate.toISOString().split("T")[0];

  return (
    <article
      data-testid="test-todo-card"
      className={`task-card${completed ? " task-card--completed" : ""}`}
      aria-label={`Task: ${title}`}
    >
      {/* ── Top row: due date + priority ── */}
      <div className="task-card__header">
        <div className="task-card__date-group">
          <span className="task-card__date-icon">
            <CalendarIcon />
          </span>
          <time
            data-testid="test-todo-due-date"
            dateTime={dueDateISO}
            className="task-card__due-date"
          >
            {formatDueDate(dueDate)}
          </time>
        </div>

        <span
          data-testid="test-todo-priority"
          className={`task-card__priority-badge ${pCfg.className}`}
          aria-label={`Priority: ${pCfg.label}`}
        >
          {pCfg.label}
        </span>
      </div>

      {/* ── Title row with checkbox ── */}
      <div className="task-card__title-row">
        <input
          id={checkboxId}
          type="checkbox"
          data-testid="test-todo-complete-toggle"
          className="task-card__checkbox"
          checked={completed}
          onChange={handleCheck}
          aria-label={`Mark "${title}" as ${completed ? "incomplete" : "complete"}`}
        />
        <label htmlFor={checkboxId} className="task-card__checkbox-label" />

        <h2 data-testid="test-todo-title" className="task-card__title">
          {title}
        </h2>
      </div>

      {/* ── Description ── */}
      <p data-testid="test-todo-description" className="task-card__description">
        {description}
      </p>

      {/* ── Time remaining ── */}
      <div className="task-card__time-row">
        <span className={`task-card__clock-icon ${timeRemaining.isOverdue ? "overdue" : ""}`}>
          <ClockIcon />
        </span>
        <time
          data-testid="test-todo-time-remaining"
          dateTime={dueDateISO}
          className={`task-card__time-remaining ${timeRemaining.isOverdue ? "task-card__time-remaining--overdue" : ""}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {timeRemaining.label}
        </time>
      </div>

      {/* ── Tags ── */}
      <ul
        data-testid="test-todo-tags"
        className="task-card__tags"
        role="list"
        aria-label="Task categories"
      >
        {tags.map((tag) => (
          <li
            key={tag}
            data-testid={`test-todo-tag-${tag.toLowerCase().replace(/\s+/g, "-")}`}
            className="task-card__tag"
            role="listitem"
          >
            {tag}
          </li>
        ))}
      </ul>

      {/* ── Footer: status + actions ── */}
      <div className="task-card__footer">
        <span
          data-testid="test-todo-status"
          className={`task-card__status ${sCfg.className}`}
          role="status"
          aria-label={`Status: ${sCfg.label}`}
        >
          <span className={`task-card__status-dot ${sCfg.dot}`} aria-hidden="true" />
          {sCfg.label}
        </span>

        <div className="task-card__actions">
          <button
            data-testid="test-todo-edit-button"
            className="task-card__btn task-card__btn--edit"
            onClick={() => onEdit?.(id)}
            aria-label={`Edit task: ${title}`}
            title="Edit task"
          >
            <EditIcon />
            <span>Edit</span>
          </button>

          <button
            data-testid="test-todo-delete-button"
            className="task-card__btn task-card__btn--delete"
            onClick={() => onDelete?.(id)}
            aria-label={`Delete task: ${title}`}
            title="Delete task"
          >
            <DeleteIcon />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export default TaskCard;
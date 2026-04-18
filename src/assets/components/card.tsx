import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ChangeEvent,
  type FormEvent,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type Priority = "low" | "medium" | "high" | "urgent";
export type Status = "pending" | "in-progress" | "done";

export interface TaskCardProps {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: Date;
  status: Status;
  tags: string[];
  onUpdate?: (id: string, patch: Partial<Omit<TaskCardProps, "onUpdate" | "onDelete">>) => void;
  onDelete?: (id: string) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const COLLAPSE_THRESHOLD = 120; // chars — collapse if description is longer

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a Date as "Due Feb 18, 2026" */
function formatDueDate(date: Date): string {
  return `Due ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

/** Calculate a human-friendly time-remaining string */
function formatTimeRemaining(date: Date): { label: string; isOverdue: boolean } {
  const now = Date.now();
  const diff = date.getTime() - now;
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

/** Format a Date for <input type="date"> → YYYY-MM-DD */
function toDateInputValue(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ─── Priority config (badge only — no indicator colour) ─────────────────────
const priorityConfig: Record<Priority, { label: string; badgeClass: string }> = {
  low:    { label: "Low",    badgeClass: "priority-low"    },
  medium: { label: "Medium", badgeClass: "priority-medium" },
  high:   { label: "High",   badgeClass: "priority-high"   },
  urgent: { label: "Urgent", badgeClass: "priority-urgent" },
};

// ─── Urgency classification ─────────────────────────────────────────────────
/** Classify deadline urgency; drives the left-border indicator + card tint. */
type Urgency = "overdue" | "critical" | "soon" | "approaching" | "normal" | "done";

function getUrgency(dueDate: Date, status: Status): Urgency {
  if (status === "done") return "done";
  const msLeft = dueDate.getTime() - Date.now();
  if (msLeft < 0)                    return "overdue";      // past due
  if (msLeft < 6 * 60 * 60 * 1000)  return "critical";     // < 6 h
  if (msLeft < 24 * 60 * 60 * 1000) return "soon";         // < 24 h
  if (msLeft < 3 * 24 * 60 * 60 * 1000) return "approaching"; // < 3 days
  return "normal";                                          // far deadline
}

// ─── Status config ────────────────────────────────────────────────────────────
const statusConfig: Record<Status, { label: string; badgeClass: string; dotClass: string }> = {
  pending:     { label: "Pending",     badgeClass: "status-todo",        dotClass: "dot-todo" },
  "in-progress": { label: "In Progress", badgeClass: "status-in-progress", dotClass: "dot-in-progress" },
  done:        { label: "Done",        badgeClass: "status-done",        dotClass: "dot-done" },
};

const ALL_STATUSES: Status[] = ["pending", "in-progress", "done"];
const ALL_PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];

// ─── Icons ────────────────────────────────────────────────────────────────────
function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

function ChevronDownIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
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
  onUpdate,
  onDelete,
}: TaskCardProps) {
  // ── Core state ──────────────────────────────────────────────────────────────
  const [currentStatus, setCurrentStatus] = useState<Status>(status);
  const [currentPriority, setCurrentPriority] = useState<Priority>(priority);
  const [currentTitle, setCurrentTitle] = useState(title);
  const [currentDescription, setCurrentDescription] = useState(description);
  const [currentDueDate, setCurrentDueDate] = useState(dueDate);
  const [currentTags] = useState(tags);

  // Derived
  const isDone = currentStatus === "done";

  // ── Edit mode ───────────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState({
    title: currentTitle,
    description: currentDescription,
    priority: currentPriority,
    dueDate: toDateInputValue(currentDueDate),
  });
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const firstEditInputRef = useRef<HTMLInputElement>(null);

  // ── Expand / Collapse ────────────────────────────────────────────────────────
  const isLongDesc = description.length > COLLAPSE_THRESHOLD;
  const [expanded, setExpanded] = useState(!isLongDesc);

  // ── Time remaining ───────────────────────────────────────────────────────────
  const [timeInfo, setTimeInfo] = useState(() => formatTimeRemaining(currentDueDate));

  useEffect(() => {
    if (isDone) return; // freeze timer when done
    const tick = () => setTimeInfo(formatTimeRemaining(currentDueDate));
    tick();
    const intervalId = setInterval(tick, 30_000);
    return () => clearInterval(intervalId);
  }, [currentDueDate, isDone]);

  // ── Edit handlers ────────────────────────────────────────────────────────────
  const openEdit = useCallback(() => {
    setEditDraft({
      title: currentTitle,
      description: currentDescription,
      priority: currentPriority,
      dueDate: toDateInputValue(currentDueDate),
    });
    setIsEditing(true);
  }, [currentTitle, currentDescription, currentPriority, currentDueDate]);

  useEffect(() => {
    if (isEditing) firstEditInputRef.current?.focus();
  }, [isEditing]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    // Return focus to Edit button
    requestAnimationFrame(() => editButtonRef.current?.focus());
  }, []);

  const saveEdit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const newTitle = editDraft.title.trim() || currentTitle;
      const newDesc = editDraft.description;
      const newPriority = editDraft.priority;
      const newDueDate = editDraft.dueDate ? new Date(editDraft.dueDate) : currentDueDate;

      setCurrentTitle(newTitle);
      setCurrentDescription(newDesc);
      setCurrentPriority(newPriority);
      setCurrentDueDate(newDueDate);

      onUpdate?.(id, {
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        dueDate: newDueDate,
        status: currentStatus,
        tags: currentTags,
      });

      setIsEditing(false);
      requestAnimationFrame(() => editButtonRef.current?.focus());
    },
    [editDraft, currentTitle, currentDueDate, currentStatus, currentTags, id, onUpdate]
  );

  // ── Checkbox / Status sync ───────────────────────────────────────────────────
  const handleCheckboxChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      const newStatus: Status = checked ? "done" : "pending";
      setCurrentStatus(newStatus);
      onUpdate?.(id, { status: newStatus });
    },
    [id, onUpdate]
  );

  const handleStatusChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const newStatus = e.target.value as Status;
      setCurrentStatus(newStatus);
      onUpdate?.(id, { status: newStatus });
    },
    [id, onUpdate]
  );

  // ── Computed values ──────────────────────────────────────────────────────────
  const pCfg = priorityConfig[currentPriority];
  const sCfg = statusConfig[currentStatus];
  const checkboxId = `task-checkbox-${id}`;
  const dueDateISO = currentDueDate.toISOString().split("T")[0];
  const urgency = getUrgency(currentDueDate, currentStatus);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <article
      data-testid="test-todo-card"
      className={[
        "task-card",
        `task-card--urg-${urgency}`,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`Task: ${currentTitle}`}
    >
      {/* ── Urgency accent bar (left-border indicator) ─── */}
      <span
        data-testid="test-todo-priority-indicator"
        className={`task-card__priority-indicator urg-bar-${urgency}`}
        aria-hidden="true"
      />

      {/* ═══════════════ EDIT FORM ═══════════════ */}
      {isEditing ? (
        <form
          data-testid="test-todo-edit-form"
          className="task-card__edit-form"
          onSubmit={saveEdit}
          noValidate
          aria-label={`Edit task: ${currentTitle}`}
        >
          <div className="edit-form__field">
            <label htmlFor={`edit-title-${id}`} className="edit-form__label">
              Title
            </label>
            <input
              ref={firstEditInputRef}
              id={`edit-title-${id}`}
              data-testid="test-todo-edit-title-input"
              type="text"
              className="edit-form__input"
              value={editDraft.title}
              onChange={(e) =>
                setEditDraft((d) => ({ ...d, title: e.target.value }))
              }
              required
              maxLength={100}
              placeholder="Task title…"
            />
          </div>

          <div className="edit-form__field">
            <label htmlFor={`edit-desc-${id}`} className="edit-form__label">
              Description
            </label>
            <textarea
              id={`edit-desc-${id}`}
              data-testid="test-todo-edit-description-input"
              className="edit-form__textarea"
              value={editDraft.description}
              onChange={(e) =>
                setEditDraft((d) => ({ ...d, description: e.target.value }))
              }
              rows={3}
              maxLength={500}
              placeholder="What needs to be done?"
            />
          </div>

          <div className="edit-form__row">
            <div className="edit-form__field">
              <label htmlFor={`edit-priority-${id}`} className="edit-form__label">
                Priority
              </label>
              <select
                id={`edit-priority-${id}`}
                data-testid="test-todo-edit-priority-select"
                className="edit-form__select"
                value={editDraft.priority}
                onChange={(e) =>
                  setEditDraft((d) => ({
                    ...d,
                    priority: e.target.value as Priority,
                  }))
                }
              >
                {ALL_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="edit-form__field">
              <label htmlFor={`edit-due-${id}`} className="edit-form__label">
                Due Date
              </label>
              <input
                id={`edit-due-${id}`}
                data-testid="test-todo-edit-due-date-input"
                type="date"
                className="edit-form__input"
                value={editDraft.dueDate}
                onChange={(e) =>
                  setEditDraft((d) => ({ ...d, dueDate: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="edit-form__actions">
            <button
              type="button"
              data-testid="test-todo-cancel-button"
              className="edit-form__btn edit-form__btn--cancel"
              onClick={cancelEdit}
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="test-todo-save-button"
              className="edit-form__btn edit-form__btn--save"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        /* ═══════════════ VIEW MODE ═══════════════ */
        <>
          {/* ── Header: due date + priority badge ── */}
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
                {formatDueDate(currentDueDate)}
              </time>
            </div>

            <span
              data-testid="test-todo-priority"
              className={`task-card__priority-badge ${pCfg.badgeClass}`}
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
              checked={isDone}
              onChange={handleCheckboxChange}
              aria-label={`Mark "${currentTitle}" as ${isDone ? "incomplete" : "complete"}`}
            />
            <label htmlFor={checkboxId} className="task-card__checkbox-label" />

            <h2
              data-testid="test-todo-title"
              className="task-card__title"
            >
              {currentTitle}
            </h2>
          </div>

          {/* ── Description (collapsible) ── */}
          <div
            data-testid="test-todo-collapsible-section"
            className={`task-card__collapsible ${expanded ? "is-expanded" : "is-collapsed"}`}
            id={`collapsible-${id}`}
          >
            <p
              data-testid="test-todo-description"
              className="task-card__description"
            >
              {currentDescription}
            </p>
          </div>

          {isLongDesc && (
            <button
              data-testid="test-todo-expand-toggle"
              className="task-card__expand-toggle"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              aria-controls={`collapsible-${id}`}
            >
              {expanded ? (
                <>
                  <ChevronUpIcon /> Show less
                </>
              ) : (
                <>
                  <ChevronDownIcon /> Show more
                </>
              )}
            </button>
          )}

          {/* ── Time remaining + overdue indicator ── */}
          <div className="task-card__time-row">
            <span
              className={`task-card__clock-icon ${timeInfo.isOverdue && !isDone ? "overdue" : ""}`}
            >
              <ClockIcon />
            </span>
            <time
              data-testid="test-todo-time-remaining"
              dateTime={dueDateISO}
              className={`task-card__time-remaining ${
                isDone
                  ? "task-card__time-remaining--done"
                  : timeInfo.isOverdue
                  ? "task-card__time-remaining--overdue"
                  : ""
              }`}
              aria-live="polite"
              aria-atomic="true"
            >
              {isDone ? "Completed" : timeInfo.label}
            </time>

            {timeInfo.isOverdue && !isDone && (
              <span
                data-testid="test-todo-overdue-indicator"
                className="task-card__overdue-badge"
                role="status"
                aria-label="This task is overdue"
              >
                <AlertIcon />
                Overdue
              </span>
            )}
          </div>

          {/* ── Tags ── */}
          <ul
            data-testid="test-todo-tags"
            className="task-card__tags"
            role="list"
            aria-label="Task categories"
          >
            {currentTags.map((tag) => (
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

          {/* ── Footer: status control + actions ── */}
          <div className="task-card__footer">
            {/* Status display badge */}
            <span
              data-testid="test-todo-status"
              className={`task-card__status ${sCfg.badgeClass}`}
              role="status"
              aria-label={`Status: ${sCfg.label}`}
            >
              <span className={`task-card__status-dot ${sCfg.dotClass}`} aria-hidden="true" />
              {sCfg.label}
            </span>

            <div className="task-card__actions">
              {/* Status control dropdown */}
              <select
                data-testid="test-todo-status-control"
                className="task-card__status-select"
                value={currentStatus}
                onChange={handleStatusChange}
                aria-label="Change task status"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusConfig[s].label}
                  </option>
                ))}
              </select>

              {/* Edit button */}
              <button
                ref={editButtonRef}
                data-testid="test-todo-edit-button"
                className="task-card__btn task-card__btn--edit"
                onClick={openEdit}
                aria-label={`Edit task: ${currentTitle}`}
                title="Edit task"
              >
                <EditIcon />
                <span>Edit</span>
              </button>

              {/* Delete button */}
              <button
                data-testid="test-todo-delete-button"
                className="task-card__btn task-card__btn--delete"
                onClick={() => onDelete?.(id)}
                aria-label={`Delete task: ${currentTitle}`}
                title="Delete task"
              >
                <DeleteIcon />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </>
      )}
    </article>
  );
}

export default TaskCard;
import { useEffect, useRef, type FormEvent } from "react";
import type { TaskCardProps, Priority, Status } from "./card";

export interface EditModalProps {
  task: Omit<TaskCardProps, "onEdit" | "onDelete" | "onToggleComplete">;
  onSave: (updated: Omit<TaskCardProps, "onEdit" | "onDelete" | "onToggleComplete">) => void;
  onClose: () => void;
}

const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];
const STATUSES: Status[] = ["pending", "in-progress", "done"];

function statusLabel(s: Status) {
  return s === "in-progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1);
}

export function EditModal({ task, onSave, onClose }: EditModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus trap on open
  useEffect(() => {
    firstInputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const rawDate = fd.get("dueDate") as string;
    const dueDate = rawDate ? new Date(rawDate) : task.dueDate;

    const rawTags = fd.get("tags") as string;
    const tags = rawTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onSave({
      ...task,
      title: (fd.get("title") as string).trim() || task.title,
      description: (fd.get("description") as string).trim(),
      priority: fd.get("priority") as Priority,
      status: fd.get("status") as Status,
      dueDate,
      tags,
    });
  }

  // Format Date to YYYY-MM-DD for <input type="date">
  const dueDateValue = task.dueDate.toISOString().split("T")[0];

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit task: ${task.title}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-panel" ref={dialogRef}>
        <header className="modal-header">
          <h2 className="modal-title">Edit Task</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close edit modal"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="modal-field">
            <label htmlFor="edit-title" className="modal-label">Title</label>
            <input
              ref={firstInputRef}
              id="edit-title"
              name="title"
              type="text"
              className="modal-input"
              defaultValue={task.title}
              required
              maxLength={100}
              placeholder="Task title…"
            />
          </div>

          {/* Description */}
          <div className="modal-field">
            <label htmlFor="edit-description" className="modal-label">Description</label>
            <textarea
              id="edit-description"
              name="description"
              className="modal-textarea"
              defaultValue={task.description}
              rows={3}
              maxLength={500}
              placeholder="What needs to be done?"
            />
          </div>

          {/* Priority + Status row */}
          <div className="modal-row">
            <div className="modal-field">
              <label htmlFor="edit-priority" className="modal-label">Priority</label>
              <select id="edit-priority" name="priority" className="modal-select" defaultValue={task.priority}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-field">
              <label htmlFor="edit-status" className="modal-label">Status</label>
              <select id="edit-status" name="status" className="modal-select" defaultValue={task.status}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{statusLabel(s)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due date */}
          <div className="modal-field">
            <label htmlFor="edit-due-date" className="modal-label">Due Date</label>
            <input
              id="edit-due-date"
              name="dueDate"
              type="date"
              className="modal-input"
              defaultValue={dueDateValue}
            />
          </div>

          {/* Tags */}
          <div className="modal-field">
            <label htmlFor="edit-tags" className="modal-label">
              Tags <span className="modal-hint">(comma-separated)</span>
            </label>
            <input
              id="edit-tags"
              name="tags"
              type="text"
              className="modal-input"
              defaultValue={task.tags.join(", ")}
              placeholder="DevOps, Backend, Urgent…"
            />
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" className="modal-btn modal-btn--cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-btn modal-btn--save">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

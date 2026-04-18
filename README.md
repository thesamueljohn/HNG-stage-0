# HNG Stage 1A — Advanced Interactive Todo Card

An advanced, stateful **Task Card** component that extends Stage 0 with inline editing, status transitions, priority indicators, expand/collapse behaviour, and granular time management. Built as a single card component — not a full task manager.

---

## 🚀 What Changed from Stage 0

| Feature | Stage 0 | Stage 1A |
|---|---|---|
| Edit mode | External floating modal | **Inline edit form** on the card itself |
| Status | Display-only badge | **Interactive dropdown** + synced checkbox |
| Priority | Text badge only | Text badge **+ left-border colour indicator** |
| Description | Static 2-line clamp | **Collapsible** (expand/Show more toggle) |
| Time | Rolling 30 s updates | Rolling updates **+ "Completed" when done + Overdue badge** |
| Overdue | Red time text | Red text **+ animated "Overdue" pill badge** |
| Visual states | Greyed-out on done | Done (green) · In Progress (blue) · Overdue (red) accents |
| Status values | `todo / in-progress / done` | `pending / in-progress / done` (spec-aligned) |
| Persistence | `hng-tasks-v1` key | `hng-tasks-v2` key (fresh seed on first load) |

---

## ✨ Features

| Feature | Detail |
|---|---|
| **All required `data-testid` attributes** | Every element wired for automated testing (Stage 0 + Stage 1A) |
| **Inline edit form** | Appears inside the card; replaces view-mode content while editing |
| **Status control** | `<select>` dropdown to transition Pending → In Progress → Done |
| **Checkbox ↔ status sync** | Checking sets status "Done"; unchecking reverts to "Pending"; manual status "Done" checks the box |
| **Priority indicator** | Coloured left-border accent: grey (low) · amber (medium) · red (high) · white/pulse (urgent) |
| **Expand / collapse** | Descriptions over 120 chars are collapsed by default; toggle is keyboard-accessible |
| **Overdue badge** | Animated pill badge + red text when past due date (hidden when done) |
| **Done = Completed** | Timer freezes and displays "Completed" when status is "Done" |
| **Time granularity** | "Due in 2 days" · "Due in 3 hours" · "Due in 45 minutes" · "Overdue by 1 hour" |
| **Focus management** | Edit mode: first input auto-focused; Cancel/Save returns focus to Edit button |
| **Dark + light themes** | `prefers-color-scheme` — full variable set for both |
| **Semantic HTML** | `<article>`, `<h2>`, `<p>`, `<time>`, `<ul>`, `<button>`, `<form>`, `<select>` |
| **ARIA labels** | Every interactive and status element has `aria-label` or `role` |
| **localStorage** | Tasks auto-saved; rehydrated on reload |

---

## 🧪 `data-testid` Mapping

### Stage 0 (still present)

| Element | `data-testid` |
|---|---|
| Card container (`<article>`) | `test-todo-card` |
| Task title (`<h2>`) | `test-todo-title` |
| Description (`<p>`) | `test-todo-description` |
| Priority badge (`<span>`) | `test-todo-priority` |
| Due date (`<time>`) | `test-todo-due-date` |
| Time remaining (`<time>`) | `test-todo-time-remaining` |
| Status display (`<span>`) | `test-todo-status` |
| Checkbox (`<input type="checkbox">`) | `test-todo-complete-toggle` |
| Tags list (`<ul>`) | `test-todo-tags` |
| Individual tag (`<li>`) | `test-todo-tag-{tag-name}` |
| Edit button (`<button>`) | `test-todo-edit-button` |
| Delete button (`<button>`) | `test-todo-delete-button` |

### Stage 1A (new)

| Element | `data-testid` |
|---|---|
| Edit form container | `test-todo-edit-form` |
| Title input | `test-todo-edit-title-input` |
| Description textarea | `test-todo-edit-description-input` |
| Priority select | `test-todo-edit-priority-select` |
| Due date input | `test-todo-edit-due-date-input` |
| Save button | `test-todo-save-button` |
| Cancel button | `test-todo-cancel-button` |
| Status control dropdown | `test-todo-status-control` |
| Priority indicator (border) | `test-todo-priority-indicator` |
| Expand/collapse toggle | `test-todo-expand-toggle` |
| Collapsible section | `test-todo-collapsible-section` |
| Overdue indicator badge | `test-todo-overdue-indicator` |

---

## 🚀 Running Locally

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/thesamueljohn/HNG-stage-0.git
cd HNG-stage-0

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Then open **http://localhost:5173** in your browser.

### Build for production

```bash
npm run build
npm run preview  # preview the production bundle locally
```

---

## 🏗️ Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 6 | Type safety |
| Vite | 8 | Dev server & bundler |

---

## 🎨 Design Decisions

### Inline edit form (not a modal)
Stage 1A replaces the floating modal approach with an **inline form** rendered directly inside the card. This keeps focus naturally within the card, avoids z-index stacking issues, and matches the spec requirement that the card "enter edit mode" when Edit is clicked.

### Priority indicator — left border accent
The `data-testid="test-todo-priority-indicator"` is implemented as a **4 px coloured left-border bar** on the card. This is:
- Always visible without adding clutter
- Immediately scannable at a glance across multiple cards
- Colour-coded: grey (low) · amber (medium) · red (high) · white + pulse animation (urgent)

### Expand / collapse strategy
Descriptions longer than **120 characters** are collapsed by default using CSS `max-height` + a `mask-image` fade-out gradient. The toggle button uses `aria-expanded` and `aria-controls` for screen-reader compatibility. Keyboard users can reach it via Tab and activate with Enter/Space.

### Status ↔ Checkbox sync
Three-way sync: checking the box → status `"done"` · unchecking → `"pending"` · using the status dropdown → updates the checkbox checked state. Always consistent, zero desync.

### Time freezing on Done
When `status === "done"`, the `setInterval` is never started (the effect returns early), and the time display shows `"Completed"` with a green tint. The overdue badge is also suppressed.

### Status values
Stage 0 used `"todo"`. Stage 1A aligns with the spec's `"pending"` label. A new localStorage key (`hng-tasks-v2`) ensures a clean seed on first load — preventing stale `"todo"` strings from old storage bleeding in.

---

## 📁 Project Structure

```
src/
├── assets/
│   └── components/
│       ├── card.tsx   # TaskCard component (all Stage 0+1A logic & testIds)
│       ├── card.css   # Component-level styles (inline form, indicator, states)
│       └── EditModal.tsx  # Legacy modal (kept; not used in Stage 1A cards)
├── App.tsx            # Page shell + localStorage persistence
├── App.css            # Page-level layout styles
├── index.css          # Global reset
└── main.tsx           # React entry point
index.html             # HTML shell (meta, title)
```

---

## ♿ Accessibility Notes

| Concern | Implementation |
|---|---|
| Edit form focus | `firstEditInputRef.current?.focus()` on form open |
| Edit form close | Focus returns to Edit button via `editButtonRef.current?.focus()` |
| Checkbox label | Explicit `<label htmlFor>` association + descriptive `aria-label` |
| Overdue badge | `role="status"` + `aria-label="This task is overdue"` |
| Time remaining | `aria-live="polite" aria-atomic="true"` for screen-reader announcements |
| Status control | `aria-label="Change task status"` on the `<select>` |
| Expand toggle | `aria-expanded` + `aria-controls` targeting the collapsible section id |
| Keyboard nav | All interactive elements reachable by Tab; focus rings via `:focus-visible` |
| Priority indicator | `aria-hidden="true"` (decorative visual; semantic info in badge) |

---

## ⚖️ Known Limitations

| Limitation | Notes |
|---|---|
| No tag editing in inline form | Tags were omitted from the inline form to keep the card compact. A future version could add a tag chip input. |
| Collapse threshold is fixed | 120 chars is hardcoded. Could be a prop or CSS-driven in a future iteration. |
| Date input browser-specific | `<input type="date">` appearance varies by browser/OS; no polyfill applied. |
| 30 s timer granularity | Time shown can be up to 30 s stale. Satisfies the spec's 30–60 s requirement. |
| Single-card focus | This is intentionally one card component, not a full list app; no filtering/sorting UI. |

# HNG Stage 0 — Task Command Center

A high-fidelity, interactive **Task Card** component built as the core UI element for a productivity app. It's designed to feel polished and "alive" — exactly the kind of detail-obsessed component you'd find in an early-stage startup's design system.

---

## ✨ Features

| Feature | Detail |
|---|---|
| **All required `data-testid` attributes** | Every element wired for automated testing |
| **Live time display** | "Due in 3 days", "Overdue by 2 hours" — refreshes every 30 s |
| **Real checkbox** | `<input type="checkbox">` with proper `<label>` association |
| **Semantic HTML** | `<article>`, `<h2>`, `<p>`, `<time>`, `<ul>`, `<button>` |
| **ARIA labels** | Every visual-only element gets an `aria-label` |
| **4 priority levels** | Low / Medium / High / Urgent (with pulsing badge animation) |
| **3 status states** | To Do / In Progress (blinking dot) / Done |
| **Tag chips** | Dynamic `data-testid="test-todo-tag-{tag-name}"` per tag |
| **Edit & Delete actions** | Icon + text buttons with focus-visible ring |
| **Completed state** | Strikethrough title, desaturated card |
| **Dark premium theme** | Radial-gradient background, glassmorphism elements |
| **Responsive** | Single-column on mobile, 2-column grid on desktop |

---

## 🧪 `data-testid` Mapping

| Element | `data-testid` |
|---|---|
| Card container (`<article>`) | `test-todo-card` |
| Task title (`<h2>`) | `test-todo-title` |
| Description (`<p>`) | `test-todo-description` |
| Priority badge (`<span>`) | `test-todo-priority` |
| Due date (`<time>`) | `test-todo-due-date` |
| Time remaining (`<time>`) | `test-todo-time-remaining` |
| Status indicator (`<span>`) | `test-todo-status` |
| Checkbox (`<input type="checkbox">`) | `test-todo-complete-toggle` |
| Tags list (`<ul>`) | `test-todo-tags` |
| Individual tag (`<li>`) | `test-todo-tag-{tag-name}` |
| Edit button (`<button>`) | `test-todo-edit-button` |
| Delete button (`<button>`) | `test-todo-delete-button` |

---

## 🚀 Running Locally

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/HNG-stage-0.git
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
| Tailwind CSS | 4 | Utility CSS (available, but card uses vanilla CSS) |

---

## 🎨 Design Decisions

### Vanilla CSS for the card
Although the project has Tailwind CSS v4 installed, the card styles were written in **vanilla CSS** (`card.css`). This gives:
- Full control over custom properties and animations (e.g., the urgent badge pulse)
- Easier isolation for component-level CSS
- Cleaner class names that map directly to BEM-style selectors for testing

### Time formatting strategy
The `formatTimeRemaining()` helper computes the difference in milliseconds and normalises through days → hours → minutes → seconds. The `useEffect` re-runs every **30 seconds** (matching the spec's "30–60 s" requirement). The `<time>` element carries a `dateTime` attribute set to the ISO date string for machine readability.

### Checkbox semantics
The spec requires a real `<input type="checkbox">`. The visible custom checkbox is styled via `appearance: none` + CSS pseudo-elements — no hidden input tricks. The `<label>` is explicitly associated via `htmlFor={checkboxId}`, where `checkboxId` is derived from the task ID, ensuring uniqueness.

### Status after toggle
When a card is checked "complete", the `status` prop in the parent is updated to `"done"`. Un-checking moves it back to `"in-progress"`. This keeps status and completion in sync without requiring a separate API call in the demo.

### Priority "Urgent" animation
The urgent badge has a subtle CSS `box-shadow` pulse animation (`@keyframes pulse-urgent`) to draw attention without being distracting.

---

## ⚖️ Trade-offs

| Decision | Trade-off |
|---|---|
| No edit modal implemented | `onEdit` fires an `alert()` in the demo. A real app would replace this with a drawer/modal component. |
| Tags formatted as lowercase-with-dashes | `"DevOps"` → `test-todo-tag-devops`. Consistent and URL-safe, but lossy for display if the tag contains mixed case that matters. |
| 30 s refresh interval | Spec allows 30–60 s; 30 s chosen for the best perceived freshness. Could be configurable. |
| Dark-only theme | The design is dark-only to match the premium startup aesthetic requested. Light-mode variant would need a `prefers-color-scheme` extension. |

---

## 📁 Project Structure

```
src/
├── assets/
│   └── components/
│       ├── card.tsx   # TaskCard component (all testIds + logic)
│       └── card.css   # Component-level styles
├── App.tsx            # Page shell with demo tasks
├── App.css            # Page-level layout styles
├── index.css          # Global reset
└── main.tsx           # React entry point
index.html             # HTML shell (meta, title)
```

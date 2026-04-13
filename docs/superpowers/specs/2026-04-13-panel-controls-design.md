# CSS Studio — Panel Controls & Interaction Mode Design Spec

**Date:** 2026-04-13  
**Status:** Approved

---

## Overview

Two improvements to the CSS Studio editing experience:

1. **Granular panel collapse controls** — individual collapse buttons per panel plus a global Focus/Test mode that collapses all panels and suspends the editing bridge so the page can be interacted with naturally.
2. **Resizable panels with persistence** — drag handles on each panel boundary with localStorage-persisted widths.

---

## Feature 1: Panel Collapse Controls

### Individual Panel Collapse Buttons

Each panel (Layers, Properties) gets a small collapse button on its inner edge (the edge facing the preview iframe).

- **Layers panel** — collapse button on its right edge (chevron-left icon). Clicking hides the panel. A thin strip or icon on the preview's left edge acts as the re-expand trigger.
- **Properties panel** — collapse button on its left edge (chevron-right icon). Clicking hides the panel. A thin strip or icon on the preview's right edge acts as the re-expand trigger.

When a panel is individually collapsed this way, the iframe expands to fill the space. Editing mode (selection, hover overlays) remains active — only that panel is hidden.

### Global Focus Mode (Toolbar Button)

A **Focus** button in the toolbar (eye/target icon). Behavior when activated:

- Collapses all open panels (Layers and Properties) simultaneously.
- **Suspends the iframe selection bridge** — the injected hover/click overlay script stops responding to pointer events (pointer-events: none on the overlay, or a flag checked by the bridge script). Clicks pass through to the page naturally.
- Toolbar shows a persistent **"Editing Off"** pill indicator so it's always clear the mode is active.
- **Keyboard shortcut `F`** toggles Focus mode at any time (when focus is not inside a text input).

When exiting Focus mode (clicking Focus again or pressing `F`):

- Panels restore to the state they were in before Focus was activated (which were open, which were closed).
- The iframe selection bridge re-enables immediately.

### State Restoration

Before entering Focus mode, a snapshot of `{ layersOpen, propertiesPanelOpen }` is saved to a ref. On exit, this snapshot is applied.

---

## Feature 2: Resizable Panels with Persistence

### Drag Handles

A 4px drag strip is placed:
- On the **right edge** of the Layers panel (between Layers and Preview).
- On the **left edge** of the Properties panel (between Preview and Properties).

On hover the cursor changes to `col-resize`. Dragging uses `pointerdown → pointermove → pointerup` (with `setPointerCapture`) to track delta and update the corresponding panel width in state.

### Constraints

| Panel | Min | Max | Default |
|---|---|---|---|
| Layers | 120px | 400px | 180px |
| Properties | 200px | 520px | 260px |

Values clamp within these bounds during drag.

### localStorage Persistence

- **Keys:** `css-studio:layers-width`, `css-studio:props-width`
- **Write:** on `pointerup` (drag end), not during drag (avoids thrashing storage).
- **Read:** on mount, before first render. If the stored value is outside the constraint range, it clamps silently.
- **Failure:** if `localStorage` is unavailable (e.g. private mode quota), falls back to defaults without error.

### Hook

A new `usePanelResize(key, defaultWidth, min, max)` hook encapsulates: reading from localStorage on mount, returning `[width, handleRef]` where `handleRef` is attached to the drag strip element.

---

## Component Changes

| File | Change |
|---|---|
| `src/App.jsx` | Add `focusMode`, `previewPanelCollapsed` state; snapshot ref for panel state; `F` key handler; pass new props to panels and toolbar |
| `src/components/Toolbar.jsx` | Add Focus button + "Editing Off" pill indicator |
| `src/components/Preview.jsx` | Accept `editingEnabled` prop; when false, set overlay pointer-events to none via a flag in the injected bridge script |
| `src/components/LayersPanel.jsx` | Add collapse button (chevron); accept `width` prop and `dragHandleRef` for resize strip |
| `src/components/PropertiesPanel.jsx` | Add collapse button (chevron); accept `width` prop and `dragHandleRef` for resize strip |
| `src/hooks/usePanelResize.js` | New hook: localStorage read on mount, pointer drag tracking, clamped width state |

---

## Key Behaviors

- **Focus mode is stateless to the user** — no edits are lost; style overrides are preserved across mode transitions.
- **`F` shortcut is a no-op when a text input is focused** — checked via `document.activeElement.tagName`.
- **Drag handles are always visible** (a subtle 4px strip), not just on hover — discoverability.
- **Panel collapse and Focus mode are independent** — you can have Properties collapsed and Layers open, then enter Focus mode (both collapse), then exit (Properties stays collapsed, Layers reopens).

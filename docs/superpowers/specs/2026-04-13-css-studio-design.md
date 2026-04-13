# CSS Studio — Design Spec

**Date:** 2026-04-13  
**Status:** Approved

---

## Overview

CSS Studio is a visual, on-page CSS editing tool. It is a **self-contained single HTML file** — built with Vite + React and bundled via `vite-plugin-singlefile` — so it requires no server, installs, or network connection to use. You open a local HTML file or paste raw HTML into it, then visually select and style elements with immediate live feedback.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 |
| Build | Vite + `vite-plugin-singlefile` |
| Output | Single portable `.html` file |
| Styling (tool UI) | Tailwind CSS (purged at build) |
| Preview sandbox | `<iframe srcdoc="...">` |
| No external runtime deps | All assets inlined at build |

The existing Vite/React/Tailwind workspace setup is the right starting point. A new project directory is initialized at `_ANTI-ROOT/css-studio/`.

---

## Layout

### Default (2-panel)

```
┌─────────────────────────────────────────────────────────┐
│  TOOLBAR: CSS Studio | Open File | Paste HTML | ⊞Layers | ↓Export │
├─────────────────────────────────────────┬───────────────┤
│                                         │               │
│           PREVIEW (iframe)              │  PROPERTIES   │
│                                         │    PANEL      │
│       live element selection            │   (260px)     │
│       highlight + handles               │               │
│                                         │               │
└─────────────────────────────────────────┴───────────────┘
```

### With Layers toggled (3-panel)

```
┌─────────────────────────────────────────────────────────┐
│  TOOLBAR                                                 │
├──────────────┬──────────────────────────┬───────────────┤
│  DOM TREE    │                          │               │
│  (180px)     │    PREVIEW (iframe)      │  PROPERTIES   │
│              │                          │    PANEL      │
│  collapsible │    element selection     │   (260px)     │
│  tree of     │    highlight + handles   │               │
│  elements    │                          │               │
└──────────────┴──────────────────────────┴───────────────┘
```

The Layers panel is toggled via a toolbar button. When hidden, preview gets the full left area.

---

## Content Loading

Two methods, both accessible from the toolbar:

1. **Open File** — native file picker (`<input type="file" accept=".html">`) reads the file and injects it into the iframe via `srcdoc`.
2. **Paste HTML** — a modal with a `<textarea>` where raw HTML is pasted. Clicking "Apply" sets `srcdoc` to the pasted content.

The currently loaded HTML string is held in React state. All style mutations are tracked as a diff on top of this original string.

---

## Element Selection

- **Hover** — dashed outline overlay on the hovered element (injected script inside iframe communicates via `postMessage`)
- **Click** — selects element; blue highlight ring + corner handles appear; breadcrumb selector path updates in property panel header
- **Right-click** — context menu (see DOM Manipulation below)
- **Double-click** — activates inline `contenteditable` on text nodes

Because `srcdoc` iframes are same-origin with the parent document, the parent can access `iframe.contentDocument` directly. The Preview component injects a small `<script>` into the srcdoc HTML string before setting it, which attaches pointer event listeners and writes selections back to a shared ref. No `postMessage` needed — direct DOM access is used throughout.

---

## DOM Manipulation (Context Menu)

Right-clicking a selected element opens a context menu with:

| Action | Behavior |
|---|---|
| Edit text | Enables `contenteditable` on the element |
| Duplicate | Clones the element and inserts it after itself |
| Move up | Swaps element with previous sibling |
| Move down | Swaps element with next sibling |
| Add sibling | Inserts a new `<div>` after the element |
| Delete | Removes the element from the DOM |

All DOM mutations are applied to the live iframe DOM and also reflected in the tracked HTML string so export stays in sync.

---

## Property Panel

### Header
- Breadcrumb selector path: `body > section.hero > h1`
- Anchors the panel to the currently selected element

### Tabs

| Tab | Sections |
|---|---|
| **Layout** | Box model (visual margin/padding), Display (block/flex/grid/none), Flex controls (direction/align/justify/gap/wrap), Grid basics (columns/rows/gap), Sizing (W/H/min-W/max-W/min-H/max-H) |
| **Type** | Font family, Size, Weight, Style, Line-height, Letter-spacing, Text align, Color, Text decoration |
| **Color** | Background color, Text color, Border (color/width/style/radius), Background gradient (linear with color stops + angle) |
| **FX** | Transform (rotate/scale/translateX/translateY/skew), Box shadow (x/y/blur/spread/color/opacity), Text shadow, Opacity, Transition (property/duration/easing), Visibility |

### Controls

Each property field uses the appropriate control type:
- **Sliders** with numeric input for numeric values (font-size, opacity, rotate, etc.)
- **Segmented button groups** for enum values (display, flex-direction, text-align)
- **Color swatch + hex input** for color values
- **HSL gradient picker** with alpha channel for color editing
- **Dropdowns** for font-family, easing curves, etc.

### Live CSS Strip

A fixed strip at the bottom of the right panel, always visible, showing the full generated CSS for the selected element as it updates in real time.

---

## CSS Token System

Every property field supports both **raw values** and **CSS custom property references** (tokens).

### Token Discovery
On HTML load, the tool parses all `--custom-property` declarations from `:root {}` in any `<style>` blocks and from inline styles. Tokens are grouped by inferred type:
- **Colors** — values that parse as colors (`#hex`, `rgb()`, `hsl()`, named colors)
- **Spacing** — values that are lengths (`px`, `rem`, `em`, `%`)
- **Typography** — values for font properties

### Token Manager
Accessible from the Layers panel (a dedicated "Tokens" tab within it). Shows all detected tokens with their resolved values. Supports:
- Editing a token's value (updates everywhere it's used in the preview live)
- Adding a new token
- Deleting a token

### Per-Field Toggle
Every property input has a `# raw` / `⬡ token` toggle button:
- **raw** — shows the direct value input (slider, color picker, etc.)
- **token** — shows a dropdown of compatible tokens (filtered by type: only color tokens appear for color fields, only spacing tokens for margin/padding, etc.)

When a token is selected, the generated CSS outputs `var(--token-name)` instead of a raw value.

---

## Export

Three outputs, accessible from the Export button in the toolbar (opens a modal):

| Output | Description |
|---|---|
| **CSS Diff** | Only the changed properties, as a valid CSS stylesheet. Grouped by selector. "Copy" button copies to clipboard. |
| **Full HTML Download** | The original HTML with a `<style>` block injected at the end of `<head>` containing all modified styles. Preserves all original markup. |
| **Live CSS Panel** | Toggle switch — when on, the live CSS strip at the bottom of the right panel is always expanded and shows the full generated stylesheet updating in real time. |

---

## State Model

```
AppState {
  originalHtml: string          // raw HTML as loaded/pasted
  selectedSelector: string      // CSS selector of selected element
  styleOverrides: Map<selector, CSSProperties>  // all edits made
  tokens: Map<name, { value, type }>            // CSS custom properties
  layersPanelOpen: boolean
  activeTab: 'layout' | 'type' | 'color' | 'fx'
  liveCssPanelExpanded: boolean
}
```

Style overrides are a flat map from selector → property object. On any edit, the override map is updated, a new `<style>` block is synthesized, and the iframe's `<head>` is patched in-place (no full reload).

---

## Known Limitations

- **External resources in srcdoc** — `srcdoc` iframes have no base URL, so relative paths to images, fonts, and stylesheets in the loaded HTML will not resolve. Users should load HTML with absolute URLs or inline resources, or run a local server. This is a v1 constraint.
- **Cross-site pages** — the tool edits HTML you supply; it cannot inject into arbitrary third-party URLs.

---

## Key Behaviors

- **No full iframe reload on edits** — styles are patched by injecting/updating a `<style id="css-studio-overrides">` tag directly in the iframe document
- **Selector specificity** — generated selectors use the element's existing class/id when available; falls back to a structural nth-child path
- **Token edits propagate live** — changing a token value in the Token Manager patches `:root` in the iframe immediately
- **Undo/redo** — Cmd+Z / Cmd+Shift+Z traverse the override history stack

---

## File Structure (new project)

```
css-studio/
├── index.html
├── package.json
├── vite.config.js          # vite-plugin-singlefile configured
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── components/
│   │   ├── Toolbar.jsx
│   │   ├── Preview.jsx          # iframe wrapper + postMessage bridge
│   │   ├── LayersPanel.jsx      # DOM tree + Tokens tab
│   │   ├── PropertiesPanel.jsx  # tab host
│   │   ├── tabs/
│   │   │   ├── LayoutTab.jsx
│   │   │   ├── TypeTab.jsx
│   │   │   ├── ColorTab.jsx
│   │   │   └── FxTab.jsx
│   │   ├── controls/
│   │   │   ├── ColorPicker.jsx  # HSL picker + alpha + token toggle
│   │   │   ├── NumberInput.jsx  # slider + numeric + unit + token toggle
│   │   │   ├── SegmentGroup.jsx # enum toggle buttons
│   │   │   └── TokenPicker.jsx  # token dropdown
│   │   ├── ExportModal.jsx
│   │   └── LiveCssStrip.jsx
│   ├── hooks/
│   │   ├── useStyleOverrides.js  # override map + CSS synthesis
│   │   ├── useTokens.js          # token discovery + management
│   │   ├── useIframeBridge.js    # postMessage communication
│   │   └── useHistory.js         # undo/redo stack
│   └── utils/
│       ├── cssParser.js          # parse computed styles, token detection
│       ├── selectorBuilder.js    # build reliable CSS selectors
│       └── htmlExport.js         # inject styles into HTML string
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-04-13-css-studio-design.md
```

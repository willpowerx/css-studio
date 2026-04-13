# CSS Studio — Project Loader Design

**Date:** 2026-04-13
**Status:** Approved

---

## Overview

Add a "Load Project" button to the CSS Studio toolbar that accepts an entire local folder — either a raw source project or a built `dist/` — and resolves all referenced assets (CSS, JS, images, fonts) into a single self-contained HTML string before loading it into the iframe preview.

This solves the core limitation of `srcdoc` iframes having no base URL, which causes all relative asset paths to break.

---

## Approach

`webkitdirectory` file input. A standard `<input type="file" webkitdirectory>` reads the entire folder into a `FileList` where each file exposes `webkitRelativePath`. All inlining is done client-side with no server or build step. Works in Chrome, Safari, Edge.

---

## New File: `src/utils/projectLoader.js`

Single exported function: `loadProject(files: FileList): Promise<string>`

### File Map

Strip the top-level directory name prefix from every `webkitRelativePath`:

```
my-project/dist/index.html  →  dist/index.html
my-project/assets/style.css  →  assets/style.css
```

Result: `Map<relativePath, File>`

### Entry Point Resolution

Priority order — first match wins:

1. `dist/index.html`
2. `index.html`
3. First `.html` file found in the map

If no HTML file is found, throw: `"No HTML file found in the selected folder."`

### Asset Inlining

Parse the entry HTML with `DOMParser`. Process in this order:

| Source | Action |
|---|---|
| `<link rel="modulepreload">` | Remove — unnecessary in srcdoc |
| `<link rel="stylesheet" href="...">` | Read file → `<style>` block; resolve CSS `url()` and `@import` recursively |
| `<script src="...">` | Read file → inline `<script>`; skip `.ts`, `.tsx`, `.jsx` silently |
| `<img src="...">` | Read file → base64 data URL attribute |
| CSS `url(...)` | Read file → base64 data URL; handles fonts, images, SVGs |
| CSS `@import "..."` | Read file → inline CSS text; recurse |

**Path resolution rules:**
- External URLs (`http://`, `https://`, `//`, `data:`, `blob:`) — skip, leave as-is
- Absolute paths starting with `/` — resolve from project root (strip leading `/`)
- Relative paths — resolve against the directory of the referencing file
- Query strings and hash fragments stripped before lookup

**Silent skip conditions:**
- Path not found in file map
- File has extension `.ts`, `.tsx`, `.jsx` (source-only, can't inline raw)
- External URL

Serialise back with `'<!DOCTYPE html>\n' + doc.documentElement.outerHTML`.

---

## Modified File: `src/components/Toolbar.jsx`

### New imports

```js
import { FolderOpen, Loader2 } from 'lucide-react'
import { loadProject } from '../utils/projectLoader'
```

### New state

```js
const [loading, setLoading] = useState(false)
```

### New ref

```js
const folderRef = useRef()
```

The `webkitdirectory` attribute is set imperatively on mount via a callback ref, since JSX does not reliably pass non-standard HTML attributes:

```js
const folderCallbackRef = (el) => {
  folderRef.current = el
  if (el) el.setAttribute('webkitdirectory', '')
}
```

### New handler

```js
async function handleFolder(e) {
  const files = e.target.files
  if (!files?.length) return
  setLoading(true)
  try {
    onLoadHtml(await loadProject(files))
  } catch (err) {
    console.error('[CSS Studio] Project load failed:', err.message)
  } finally {
    setLoading(false)
    e.target.value = ''
  }
}
```

Errors are logged to console only — no UI error state needed (silent skip design decision).

### New button + input (placed between "Open File" and "Paste HTML")

```jsx
<button
  onClick={() => folderRef.current.click()}
  disabled={loading}
  className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors disabled:opacity-50"
>
  {loading
    ? <><Loader2 size={12} className="animate-spin" /> Loading…</>
    : <><FolderOpen size={12} /> Load Project</>
  }
</button>
<input ref={folderCallbackRef} type="file" multiple className="hidden" onChange={handleFolder} />
```

---

## Unchanged

- `src/App.jsx` — `handleLoadHtml(html)` already accepts any HTML string
- `src/components/Preview.jsx` — bridge script injection is unchanged
- All hooks, tabs, and panels — no changes

---

## Known Limitations

- **Firefox** — `webkitdirectory` not supported; the button does nothing in Firefox
- **TypeScript / JSX source** — `.ts`, `.tsx`, `.jsx` files are silently skipped; user should load a built `dist/` if the project requires compilation
- **CSS preprocessors** — `.scss`, `.less`, `.styl` files skipped silently for the same reason
- **ES module `import` in raw JS** — inline scripts with bare `import` statements will throw in srcdoc; works fine for Vite/webpack bundles since imports are already resolved
- **Very large projects** — inlining many large images/fonts may produce a very large srcdoc string; no size limit is enforced

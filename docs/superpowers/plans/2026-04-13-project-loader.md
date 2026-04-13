# Project Loader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Load Project" button to the CSS Studio toolbar that accepts a local folder, inlines all CSS/JS/image assets, and loads the result into the iframe preview.

**Architecture:** A new `projectLoader.js` utility reads a `FileList` from a `webkitdirectory` input, builds a path→File map, finds the entry HTML, parses it with `DOMParser`, and recursively inlines all resolvable assets. The resolved HTML string is passed to the existing `onLoadHtml` callback — no App.jsx changes required.

**Tech Stack:** Vanilla JS (FileReader, DOMParser, FileList), React 18, lucide-react icons. No test framework — verification is in-browser.

**Working directory:** `/Users/wb/Desktop/WB-WORK-ROOT/_HTML-DEV/_ANTI-ROOT/css-studio`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/utils/projectLoader.js` | **Create** | Build file map, find entry HTML, inline all assets |
| `src/components/Toolbar.jsx` | **Modify** | Add Load Project button + folder input + loading state |

---

## Task 1: Create `src/utils/projectLoader.js`

**Files:**
- Create: `src/utils/projectLoader.js`

- [ ] **Step 1: Create the file with the full implementation**

```js
/**
 * Loads a local folder into a single self-contained HTML string.
 * Resolves <link rel="stylesheet">, <script src>, <img src>,
 * and CSS url() / @import by inlining files from the FileList.
 */

export async function loadProject(files) {
  const fileMap = buildFileMap(files)
  const entryPath = findEntry(fileMap)
  if (!entryPath) throw new Error('No HTML file found in the selected folder.')
  const baseDir = dirOf(entryPath)
  const rawHtml = await readText(fileMap.get(entryPath))
  return resolveDocument(rawHtml, baseDir, fileMap)
}

// --- File map ---

function buildFileMap(files) {
  const map = new Map()
  let prefix = ''
  for (const file of files) {
    const path = file.webkitRelativePath || file.name
    if (!prefix && path.includes('/')) prefix = path.split('/')[0] + '/'
    const rel = prefix && path.startsWith(prefix) ? path.slice(prefix.length) : path
    if (rel) map.set(rel, file)
  }
  return map
}

function findEntry(fileMap) {
  for (const p of ['dist/index.html', 'index.html']) {
    if (fileMap.has(p)) return p
  }
  for (const [p] of fileMap) {
    if (p.endsWith('.html')) return p
  }
  return null
}

// --- Path utilities ---

function dirOf(path) {
  const i = path.lastIndexOf('/')
  return i >= 0 ? path.slice(0, i + 1) : ''
}

function resolve(base, href) {
  if (!href || /^(https?:|\/\/|data:|#|blob:)/.test(href)) return null
  const clean = decodeURIComponent(href).split('?')[0].split('#')[0]
  if (clean.startsWith('/')) return clean.slice(1)
  const parts = (base + clean).split('/')
  const out = []
  for (const p of parts) {
    if (p === '..') out.pop()
    else if (p && p !== '.') out.push(p)
  }
  return out.join('/')
}

// --- File readers ---

function readText(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = e => res(e.target.result)
    r.onerror = rej
    r.readAsText(file)
  })
}

function readDataUrl(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = e => res(e.target.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

// --- HTML resolver ---

const SKIP_EXTENSIONS = ['.ts', '.tsx', '.jsx', '.scss', '.less', '.styl']

async function resolveDocument(html, baseDir, fileMap) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // Remove modulepreload hints — not needed in srcdoc
  for (const el of [...doc.querySelectorAll('link[rel="modulepreload"]')]) el.remove()

  // Inline stylesheets
  for (const link of [...doc.querySelectorAll('link[rel="stylesheet"][href]')]) {
    const path = resolve(baseDir, link.getAttribute('href'))
    if (!path || !fileMap.has(path)) continue
    const cssText = await readText(fileMap.get(path))
    const resolved = await resolveCss(cssText, dirOf(path), fileMap)
    const style = doc.createElement('style')
    style.textContent = resolved
    link.replaceWith(style)
  }

  // Inline scripts (skip source-only extensions)
  for (const script of [...doc.querySelectorAll('script[src]')]) {
    const src = script.getAttribute('src')
    if (SKIP_EXTENSIONS.some(ext => src.endsWith(ext))) continue
    const path = resolve(baseDir, src)
    if (!path || !fileMap.has(path)) continue
    const jsText = await readText(fileMap.get(path))
    const inlined = doc.createElement('script')
    if (script.type) inlined.type = script.type
    inlined.textContent = jsText
    script.replaceWith(inlined)
  }

  // Inline images
  for (const img of [...doc.querySelectorAll('img[src]:not([src^="data:"])')]) {
    const path = resolve(baseDir, img.getAttribute('src'))
    if (!path || !fileMap.has(path)) continue
    img.setAttribute('src', await readDataUrl(fileMap.get(path)))
  }

  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML
}

// --- CSS resolver ---

async function resolveCss(css, baseDir, fileMap) {
  // Inline @import
  const importRe = /@import\s+(?:url\(["']?|["'])([^"');\s]+)["']?\)?[^;]*;/g
  const imports = []
  let m
  while ((m = importRe.exec(css)) !== null) imports.push({ match: m[0], href: m[1] })
  for (const { match, href } of imports) {
    const path = resolve(baseDir, href)
    if (!path || !fileMap.has(path)) continue
    const imported = await readText(fileMap.get(path))
    const resolved = await resolveCss(imported, dirOf(path), fileMap)
    css = css.split(match).join(resolved)
  }

  // Inline url() references (fonts, images, SVGs)
  const urlRe = /url\(["']?([^"')]+)["']?\)/g
  const urls = []
  while ((m = urlRe.exec(css)) !== null) urls.push({ match: m[0], url: m[1] })
  const seen = new Set()
  for (const { match, url } of urls) {
    if (seen.has(match)) continue
    seen.add(match)
    if (/^(data:|https?:|\/\/)/.test(url)) continue
    const path = resolve(baseDir, url)
    if (!path || !fileMap.has(path)) continue
    const dataUrl = await readDataUrl(fileMap.get(path))
    css = css.split(match).join(`url("${dataUrl}")`)
  }

  return css
}
```

- [ ] **Step 2: Verify the file was created**

```bash
ls src/utils/
```

Expected output includes: `cssParser.js  htmlExport.js  projectLoader.js  selectorBuilder.js`

- [ ] **Step 3: Commit**

```bash
git add src/utils/projectLoader.js
git commit -m "feat: projectLoader utility — inline CSS/JS/images from a folder FileList"
```

---

## Task 2: Update `src/components/Toolbar.jsx`

**Files:**
- Modify: `src/components/Toolbar.jsx`

- [ ] **Step 1: Replace the entire file**

```jsx
import { useRef, useState } from 'react'
import { Upload, Clipboard, Layers, Download, FolderOpen, Loader2 } from 'lucide-react'
import { loadProject } from '../utils/projectLoader'

export default function Toolbar({ onLoadHtml, layersOpen, onToggleLayers, onExport, canUndo, canRedo, onUndo, onRedo }) {
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteValue, setPasteValue] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()
  const folderRef = useRef()

  // webkitdirectory is non-standard — set imperatively to avoid JSX stripping it
  const folderCallbackRef = (el) => {
    folderRef.current = el
    if (el) el.setAttribute('webkitdirectory', '')
  }

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onLoadHtml(ev.target.result)
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleApply() {
    if (pasteValue.trim()) onLoadHtml(pasteValue.trim())
    setPasteOpen(false)
    setPasteValue('')
  }

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

  return (
    <>
      <div className="h-10 bg-neutral-900 border-b border-neutral-800 flex items-center px-3 gap-3 flex-shrink-0">
        <span className="text-xs font-bold tracking-widest text-neutral-200 mr-1">CSS STUDIO</span>
        <div className="h-4 w-px bg-neutral-700" />
        <button onClick={() => fileRef.current.click()} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors">
          <Upload size={12} /> Open File
        </button>
        <input ref={fileRef} type="file" accept=".html,.htm" className="hidden" onChange={handleFile} />
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
        <button onClick={() => setPasteOpen(true)} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors">
          <Clipboard size={12} /> Paste HTML
        </button>
        <div className="h-4 w-px bg-neutral-700" />
        <button onClick={onUndo} disabled={!canUndo}
          className="text-xs text-neutral-500 hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Undo (⌘Z)">↩</button>
        <button onClick={onRedo} disabled={!canRedo}
          className="text-xs text-neutral-500 hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Redo (⌘⇧Z)">↪</button>
        <div className="flex-1" />
        <button
          onClick={onToggleLayers}
          className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors ${layersOpen ? 'bg-blue-900/40 text-blue-400 border border-blue-800' : 'text-neutral-400 hover:text-neutral-200'}`}
        >
          <Layers size={12} /> Layers
        </button>
        <button onClick={onExport} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1 rounded flex items-center gap-1.5 transition-colors">
          <Download size={12} /> Export
        </button>
      </div>

      {pasteOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 w-[560px] flex flex-col gap-3">
            <div className="text-sm font-semibold text-neutral-200">Paste HTML</div>
            <textarea
              autoFocus
              value={pasteValue}
              onChange={e => setPasteValue(e.target.value)}
              placeholder="<!DOCTYPE html>..."
              className="bg-neutral-800 border border-neutral-700 rounded p-2 text-xs font-mono text-neutral-300 h-48 resize-none outline-none focus:border-blue-600"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setPasteOpen(false)} className="text-xs text-neutral-400 hover:text-neutral-200 px-3 py-1.5">Cancel</button>
              <button onClick={handleApply} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-1.5 rounded">Apply</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Verify dev server starts clean**

```bash
npm run dev
```

Expected: no build errors, server starts at `http://localhost:5173`. Open in Chrome. The toolbar should now show: `Open File | Load Project | Paste HTML | ↩ ↪ | Layers | Export`

- [ ] **Step 3: Verify — raw source folder (no build)**

Create a test project folder anywhere on disk with this structure:

```
test-project/
├── index.html
├── styles/
│   └── main.css
└── images/
    └── (any small .png or .jpg)
```

`index.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="styles/main.css">
</head>
<body>
  <h1 id="title">Hello from test project</h1>
  <p class="lead">CSS is resolved from a separate file.</p>
  <img src="images/test.png" alt="test" style="max-width:200px">
</body>
</html>
```

`styles/main.css`:
```css
body { font-family: sans-serif; padding: 32px; background: #f0f4ff; }
h1 { color: #2563eb; }
.lead { color: #555; font-size: 1.1rem; }
```

Click **Load Project**, select `test-project/`. Expected:
- Preview shows the styled page (blue heading, correct background color)
- Image renders inline (not broken)
- Click the `<h1>` — Properties panel shows `#title`
- Layers panel shows the DOM tree

- [ ] **Step 4: Verify — Vite dist folder**

Run `npm run build` in the css-studio itself (or any Vite project you have locally). Click **Load Project**, select the `dist/` folder output. Expected:
- App loads and renders correctly in the preview
- `dist/index.html` is picked automatically (not the root `index.html` of the tool)
- Hashed asset filenames (e.g., `assets/index-CTbX83r5.js`) are resolved and inlined

- [ ] **Step 5: Verify — loading state**

Select a folder with several large images. Observe that during loading the button shows a spinner and reads "Loading…" and is disabled. After load completes it returns to "Load Project".

- [ ] **Step 6: Commit**

```bash
git add src/components/Toolbar.jsx
git commit -m "feat: Load Project button — folder picker with asset inlining"
```

---

## Task 3: Production Build

- [ ] **Step 1: Build**

```bash
npm run build
```

Expected output:
```
✓ built in X.Xs
dist/index.html  ~200 kB
```

No errors. Single file output.

- [ ] **Step 2: Smoke test the build**

Open `dist/index.html` directly in Chrome (file:// URL — no server). Verify Load Project button is present and functional with a test folder.

- [ ] **Step 3: Final commit**

```bash
git add dist/index.html 2>/dev/null || true
git commit -m "chore: rebuild dist with project loader feature" --allow-empty
```

---

## Self-Review

### Spec Coverage

| Spec requirement | Task |
|---|---|
| `webkitdirectory` folder input | Task 2 (Toolbar) |
| Build file map, strip dir prefix | Task 1 (`buildFileMap`) |
| Entry: `dist/index.html` → `index.html` → first `.html` | Task 1 (`findEntry`) |
| Inline `<link rel="stylesheet">` | Task 1 (`resolveDocument`) |
| Inline `<script src>` — skip `.ts/.tsx/.jsx` | Task 1 (`resolveDocument`) |
| Inline `<img src>` as base64 | Task 1 (`resolveDocument`) |
| CSS `url()` → base64 | Task 1 (`resolveCss`) |
| CSS `@import` → inline text | Task 1 (`resolveCss`) |
| Remove `modulepreload` links | Task 1 (`resolveDocument`) |
| External URLs skipped | Task 1 (`resolve` function guard) |
| Absolute paths from project root | Task 1 (`resolve` function — `clean.startsWith('/')`) |
| `webkitdirectory` set imperatively | Task 2 (`folderCallbackRef`) |
| Spinner + disabled during load | Task 2 (`loading` state) |
| Errors logged to console only | Task 2 (`handleFolder` catch) |
| No App.jsx changes | ✓ — `onLoadHtml` interface unchanged |

All requirements covered.

### Type Consistency

- `loadProject(files: FileList)` — defined in Task 1, imported in Task 2 ✓
- `buildFileMap` returns `Map<string, File>` — used in `findEntry`, `resolve`, `resolveDocument`, `resolveCss` ✓
- `resolve(base, href)` returns `string | null` — null-checked at every call site ✓
- `dirOf(path)` returns `string` — used consistently in `resolveDocument` and `resolveCss` ✓

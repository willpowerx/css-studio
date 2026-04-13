# CSS Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-contained single-HTML-file visual CSS editor where you load HTML, click elements, and modify their styles through a panel UI with live preview.

**Architecture:** Vite + React app bundled by `vite-plugin-singlefile` into one portable HTML file. The loaded HTML renders in a same-origin `<iframe srcdoc>` so the parent can access `iframe.contentDocument` directly. Style edits are tracked as a Map of selector → CSS property objects, synthesized into a `<style>` tag that is patched into the iframe's `<head>` on every change — no iframe reload required.

**Tech Stack:** React 18, Vite, vite-plugin-singlefile, Tailwind CSS (dark theme), lucide-react (icons). No test framework — this is a visual tool; verification is in-browser.

---

## File Map

| File | Responsibility |
| --- | --- |
| `package.json` | Dependencies and scripts |
| `vite.config.js` | Vite config with singlefile plugin |
| `tailwind.config.js` | Tailwind config (dark theme, content paths) |
| `postcss.config.js` | PostCSS for Tailwind |
| `index.html` | Vite entry HTML |
| `src/main.jsx` | React root mount |
| `src/App.jsx` | Top-level layout: Toolbar + panels + all state wiring |
| `src/index.css` | Tailwind directives + global resets |
| `src/utils/cssParser.js` | Parse computed styles, detect tokens from :root, synthesize CSS strings |
| `src/utils/selectorBuilder.js` | Build a reliable CSS selector for a DOM element |
| `src/utils/htmlExport.js` | Inject `<style>` into HTML string, trigger download, format CSS diff |
| `src/hooks/useHistory.js` | Generic undo/redo stack |
| `src/hooks/useStyleOverrides.js` | Override map + CSS synthesis + iframe style patching |
| `src/hooks/useTokens.js` | Token discovery, CRUD, live :root patching |
| `src/hooks/useIframeBridge.js` | Read selected element's styles from iframe on selection |
| `src/components/Toolbar.jsx` | Top bar: file open, paste HTML modal, layers toggle, export button |
| `src/components/Preview.jsx` | Iframe wrapper: renders srcdoc with injected bridge script |
| `src/components/ContextMenu.jsx` | Right-click DOM manipulation menu |
| `src/components/LayersPanel.jsx` | Collapsible DOM tree + Tokens tab |
| `src/components/PropertiesPanel.jsx` | Tab host (Layout/Type/Color/FX) + breadcrumb + LiveCssStrip |
| `src/components/ExportModal.jsx` | CSS diff display + copy + HTML download |
| `src/components/tabs/LayoutTab.jsx` | Box model, display, flex, grid, sizing |
| `src/components/tabs/TypeTab.jsx` | Typography properties |
| `src/components/tabs/ColorTab.jsx` | Colors, borders, gradient |
| `src/components/tabs/FxTab.jsx` | Transforms, shadows, opacity, transitions |
| `src/components/controls/NumberInput.jsx` | Slider + number + unit select + token toggle |
| `src/components/controls/SegmentGroup.jsx` | Enum toggle button group |
| `src/components/controls/ColorPicker.jsx` | Color swatch + hex input + alpha + token toggle |
| `src/components/controls/TokenPicker.jsx` | Token dropdown filtered by type |
| `src/components/controls/BoxModelEditor.jsx` | Visual 4-side margin/padding editor |

---

## Task 1: Project Scaffold

**Files:**
- Create: `css-studio/package.json`
- Create: `css-studio/vite.config.js`
- Create: `css-studio/tailwind.config.js`
- Create: `css-studio/postcss.config.js`
- Create: `css-studio/index.html`
- Create: `css-studio/src/main.jsx`
- Create: `css-studio/src/App.jsx`
- Create: `css-studio/src/index.css`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "css-studio",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.462.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.15",
    "vite": "^5.4.10",
    "vite-plugin-singlefile": "^2.0.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
cd /Users/wb/Desktop/WB-WORK-ROOT/_HTML-DEV/_ANTI-ROOT/css-studio && npm install
```

- [ ] **Step 3: Create vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    target: 'esnext',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
  },
})
```

- [ ] **Step 4: Create tailwind.config.js**

```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 5: Create postcss.config.js**

```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
```

- [ ] **Step 6: Create index.html**

```html
<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CSS Studio</title>
  </head>
  <body class="bg-neutral-950 text-neutral-200">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

*, *::before, *::after { box-sizing: border-box; }
html, body, #root { height: 100%; margin: 0; }
```

- [ ] **Step 8: Create src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
```

- [ ] **Step 9: Create src/App.jsx (shell)**

```jsx
export default function App() {
  return (
    <div className="flex flex-col h-full">
      <div className="h-10 bg-neutral-900 border-b border-neutral-800 flex items-center px-3 text-xs font-bold tracking-widest text-neutral-200">
        CSS STUDIO
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 bg-neutral-800 flex items-center justify-center text-neutral-600 text-sm">
          Preview area
        </div>
        <div className="w-64 bg-neutral-900 border-l border-neutral-800 flex items-center justify-center text-neutral-600 text-sm">
          Properties
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 10: Verify dev server**

```bash
npm run dev
```

Open http://localhost:5173 — expect a dark page with "CSS STUDIO" toolbar and placeholder panels.

- [ ] **Step 11: Verify single-file build**

```bash
npm run build && open dist/index.html
```

Open `dist/index.html` directly (file:// — no server). Expect the same layout. Should be one HTML file with all JS/CSS inlined.

- [ ] **Step 12: Commit**

```bash
git init && git add -A && git commit -m "feat: scaffold css-studio with vite + react + singlefile build"
```

---

## Task 2: Utility Functions

**Files:**
- Create: `src/utils/cssParser.js`
- Create: `src/utils/selectorBuilder.js`
- Create: `src/utils/htmlExport.js`

- [ ] **Step 1: Create src/utils/cssParser.js**

```js
const EDITABLE_PROPS = [
  'display', 'flexDirection', 'alignItems', 'justifyContent', 'flexWrap', 'gap',
  'gridTemplateColumns', 'gridTemplateRows',
  'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
  'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
  'lineHeight', 'letterSpacing', 'textAlign', 'color', 'textDecoration',
  'backgroundColor', 'backgroundImage',
  'borderWidth', 'borderStyle', 'borderColor', 'borderRadius',
  'transform', 'opacity', 'boxShadow', 'textShadow',
  'transitionDuration', 'transitionTimingFunction', 'visibility',
]

export function getEditableStyles(el, computedStyle) {
  const result = {}
  for (const prop of EDITABLE_PROPS) {
    const inline = el.style[prop]
    const computed = computedStyle.getPropertyValue(
      prop.replace(/([A-Z])/g, '-$1').toLowerCase()
    )
    result[prop] = inline || computed
  }
  return result
}

export function parseTokensFromHtml(html) {
  const tokens = []
  const styleBlocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
  for (const [, css] of styleBlocks) {
    const rootMatch = css.match(/:root\s*\{([^}]*)\}/)
    if (!rootMatch) continue
    for (const [, name, rawValue] of rootMatch[1].matchAll(/--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g)) {
      const value = rawValue.trim()
      tokens.push({ name: `--${name}`, value, type: inferTokenType(value) })
    }
  }
  return tokens
}

function inferTokenType(value) {
  if (/^#[0-9a-f]{3,8}$/i.test(value)) return 'color'
  if (/^rgb|^hsl|^oklch/.test(value)) return 'color'
  try { if (CSS.supports('color', value)) return 'color' } catch (_) {}
  if (/^\d+(\.\d+)?(px|rem|em|%|vw|vh)$/.test(value)) return 'spacing'
  return 'other'
}

export function synthesizeCss(overrides) {
  return [...overrides.entries()]
    .map(([selector, props]) => {
      const declarations = Object.entries(props)
        .filter(([, v]) => v)
        .map(([k, v]) => `  ${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`)
        .join('\n')
      return declarations ? `${selector} {\n${declarations}\n}` : ''
    })
    .filter(Boolean)
    .join('\n\n')
}
```

- [ ] **Step 2: Create src/utils/selectorBuilder.js**

```js
export function buildSelector(el) {
  if (el.id) return `#${el.id}`
  const tag = el.tagName.toLowerCase()
  const classes = [...el.classList].filter(c => !c.startsWith('css-studio-'))
  const classStr = classes.length ? `.${classes.join('.')}` : ''
  if (classStr) {
    const selector = `${tag}${classStr}`
    if (el.ownerDocument?.querySelectorAll(selector).length === 1) return selector
  }
  return buildNthChildPath(el)
}

function buildNthChildPath(el) {
  const parts = []
  let node = el
  while (node && node.nodeType === 1 && node.tagName.toLowerCase() !== 'html') {
    const tag = node.tagName.toLowerCase()
    const parent = node.parentElement
    if (!parent) break
    const siblings = [...parent.children].filter(c => c.tagName === node.tagName)
    const index = siblings.indexOf(node) + 1
    parts.unshift(siblings.length > 1 ? `${tag}:nth-of-type(${index})` : tag)
    node = parent
  }
  return parts.join(' > ')
}
```

- [ ] **Step 3: Create src/utils/htmlExport.js**

```js
import { synthesizeCss } from './cssParser'

export function injectStyles(html, cssText) {
  const styleTag = `<style id="css-studio-export">\n${cssText}\n</style>`
  if (html.includes('id="css-studio-export"')) {
    return html.replace(/<style id="css-studio-export">[\s\S]*?<\/style>/, styleTag)
  }
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${styleTag}\n</head>`)
  return `${styleTag}\n${html}`
}

export function downloadHtml(html, filename = 'styled.html') {
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}

export function formatCssDiff(overrides) {
  return synthesizeCss(overrides)
}
```

- [ ] **Step 4: Verify utilities are importable**

Temporarily add to `App.jsx`:
```jsx
import { synthesizeCss } from './utils/cssParser'
import { buildSelector } from './utils/selectorBuilder'
import { injectStyles } from './utils/htmlExport'
console.log('utils ok', !!synthesizeCss && !!buildSelector && !!injectStyles)
```
Run `npm run dev`. Expect "utils ok true" in console. Remove the temp import.

- [ ] **Step 5: Commit**

```bash
git add src/utils/ && git commit -m "feat: cssParser, selectorBuilder, htmlExport utilities"
```

---

## Task 3: Core State Hooks

**Files:**
- Create: `src/hooks/useHistory.js`
- Create: `src/hooks/useStyleOverrides.js`
- Create: `src/hooks/useTokens.js`

- [ ] **Step 1: Create src/hooks/useHistory.js**

```js
import { useCallback, useRef, useState } from 'react'

export function useHistory(initialState) {
  const [index, setIndex] = useState(0)
  const stack = useRef([initialState])
  const state = stack.current[index]

  const setState = useCallback((newState) => {
    setIndex(i => {
      const next = typeof newState === 'function' ? newState(stack.current[i]) : newState
      stack.current = stack.current.slice(0, i + 1)
      stack.current.push(next)
      return i + 1
    })
  }, [])

  const undo = useCallback(() => setIndex(i => Math.max(0, i - 1)), [])
  const redo = useCallback(() => setIndex(i => Math.min(stack.current.length - 1, i + 1)), [])

  return [state, setState, undo, redo,
    index > 0,
    index < stack.current.length - 1
  ]
}
```

- [ ] **Step 2: Create src/hooks/useStyleOverrides.js**

```js
import { useCallback, useEffect } from 'react'
import { useHistory } from './useHistory'
import { synthesizeCss } from '../utils/cssParser'

export function useStyleOverrides(iframeRef) {
  const [overrides, setOverrides, undo, redo, canUndo, canRedo] =
    useHistory(new Map())

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument
    if (!doc) return
    let styleEl = doc.getElementById('css-studio-overrides')
    if (!styleEl) {
      styleEl = doc.createElement('style')
      styleEl.id = 'css-studio-overrides'
      doc.head?.appendChild(styleEl)
    }
    styleEl.textContent = synthesizeCss(overrides)
  }, [overrides, iframeRef])

  const setProperty = useCallback((selector, property, value) => {
    setOverrides(prev => {
      const next = new Map(prev)
      next.set(selector, { ...(next.get(selector) ?? {}), [property]: value })
      return next
    })
  }, [setOverrides])

  const removeProperty = useCallback((selector, property) => {
    setOverrides(prev => {
      const next = new Map(prev)
      const props = { ...(next.get(selector) ?? {}) }
      delete props[property]
      if (Object.keys(props).length === 0) next.delete(selector)
      else next.set(selector, props)
      return next
    })
  }, [setOverrides])

  return { overrides, setProperty, removeProperty, undo, redo, canUndo, canRedo }
}
```

- [ ] **Step 3: Create src/hooks/useTokens.js**

```js
import { useCallback, useState } from 'react'
import { parseTokensFromHtml } from '../utils/cssParser'

export function useTokens(iframeRef) {
  const [tokens, setTokens] = useState([])

  const loadFromHtml = useCallback((html) => {
    setTokens(parseTokensFromHtml(html))
  }, [])

  const patchIframeRoot = useCallback((updatedTokens) => {
    const doc = iframeRef.current?.contentDocument
    if (!doc) return
    let styleEl = doc.getElementById('css-studio-tokens')
    if (!styleEl) {
      styleEl = doc.createElement('style')
      styleEl.id = 'css-studio-tokens'
      doc.head?.appendChild(styleEl)
    }
    styleEl.textContent = `:root {\n${updatedTokens.map(t => `  ${t.name}: ${t.value};`).join('\n')}\n}`
  }, [iframeRef])

  const upsertToken = useCallback((name, value, type = 'other') => {
    setTokens(prev => {
      const idx = prev.findIndex(t => t.name === name)
      const next = idx >= 0
        ? prev.map((t, i) => i === idx ? { name, value, type } : t)
        : [...prev, { name, value, type }]
      patchIframeRoot(next)
      return next
    })
  }, [patchIframeRoot])

  const deleteToken = useCallback((name) => {
    setTokens(prev => {
      const next = prev.filter(t => t.name !== name)
      patchIframeRoot(next)
      return next
    })
  }, [patchIframeRoot])

  return { tokens, loadFromHtml, upsertToken, deleteToken }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/ && git commit -m "feat: useHistory, useStyleOverrides, useTokens hooks"
```

---

## Task 4: HTML Loading + Preview Iframe

**Files:**
- Create: `src/components/Toolbar.jsx`
- Create: `src/components/Preview.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create src/components/Preview.jsx**

```jsx
import { forwardRef } from 'react'

const BRIDGE_SCRIPT = `<script id="css-studio-bridge">
(function(){
  function isStudio(el){ return el&&(el.id&&el.id.startsWith('css-studio-')||el.tagName==='HTML'||el.tagName==='BODY') }
  function getOverlay(id,color,style){
    let el=document.getElementById(id)
    if(!el){el=document.createElement('div');el.id=id;el.style.cssText='position:fixed;pointer-events:none;z-index:999998;box-sizing:border-box;border-radius:2px;display:none;'+style;document.body.appendChild(el)}
    return el
  }
  function pos(ov,el){const r=el.getBoundingClientRect();ov.style.top=r.top+'px';ov.style.left=r.left+'px';ov.style.width=r.width+'px';ov.style.height=r.height+'px';ov.style.display='block'}
  function sel(el){if(el.id)return'#'+el.id;const t=el.tagName.toLowerCase();const c=[...el.classList].filter(x=>!x.startsWith('css-studio-'));const cs=c.length?'.'+c.join('.'):'';if(cs&&document.querySelectorAll(t+cs).length===1)return t+cs;const p=[];let n=el;while(n&&n.nodeType===1&&n.tagName.toLowerCase()!=='html'){const tg=n.tagName.toLowerCase();const par=n.parentElement;if(!par)break;const sibs=[...par.children].filter(x=>x.tagName===n.tagName);const i=sibs.indexOf(n)+1;p.unshift(sibs.length>1?tg+':nth-of-type('+i+')':tg);n=par}return p.join(' > ')}
  document.addEventListener('mouseover',function(e){if(isStudio(e.target))return;const ov=getOverlay('css-studio-hover','','border:1px dashed #6b7280;');pos(ov,e.target)})
  document.addEventListener('mouseout',function(){const ov=document.getElementById('css-studio-hover');if(ov)ov.style.display='none'})
  document.addEventListener('click',function(e){if(isStudio(e.target))return;e.preventDefault();e.stopPropagation();const ov=getOverlay('css-studio-select','','border:2px solid #3b82f6;');pos(ov,e.target);window.parent.postMessage({type:'css-studio-select',selector:sel(e.target)},'*')},true)
  document.addEventListener('dblclick',function(e){if(isStudio(e.target))return;e.preventDefault();e.target.contentEditable='true';e.target.focus()})
  document.addEventListener('blur',function(e){if(e.target.contentEditable==='true')e.target.contentEditable='false'},true)
  document.addEventListener('contextmenu',function(e){if(isStudio(e.target))return;e.preventDefault();window.__cssStudioSelected=e.target;window.parent.postMessage({type:'css-studio-contextmenu',selector:sel(e.target),x:e.clientX,y:e.clientY},'*')})
})()
<\/script>`

function injectBridge(html) {
  if (html.includes('css-studio-bridge')) return html
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${BRIDGE_SCRIPT}</body>`)
  return html + BRIDGE_SCRIPT
}

const Preview = forwardRef(function Preview({ srcdoc }, ref) {
  return (
    <div className="flex-1 bg-neutral-800 overflow-hidden relative">
      {srcdoc ? (
        <iframe
          ref={ref}
          srcDoc={injectBridge(srcdoc)}
          className="w-full h-full border-0"
          title="CSS Studio Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-neutral-600">
          <div className="text-5xl">⬚</div>
          <p className="text-sm font-medium text-neutral-400">CSS Studio</p>
          <p className="text-xs text-center max-w-xs">Open an HTML file or paste raw HTML to start editing elements visually.</p>
        </div>
      )}
    </div>
  )
})

export default Preview
```

- [ ] **Step 2: Create src/components/Toolbar.jsx**

```jsx
import { useRef, useState } from 'react'
import { Upload, Clipboard, Layers, Download } from 'lucide-react'

export default function Toolbar({ onLoadHtml, layersOpen, onToggleLayers, onExport }) {
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteValue, setPasteValue] = useState('')
  const fileRef = useRef()

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

  return (
    <>
      <div className="h-10 bg-neutral-900 border-b border-neutral-800 flex items-center px-3 gap-3 flex-shrink-0">
        <span className="text-xs font-bold tracking-widest text-neutral-200 mr-1">CSS STUDIO</span>
        <div className="h-4 w-px bg-neutral-700" />
        <button onClick={() => fileRef.current.click()} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors">
          <Upload size={12} /> Open File
        </button>
        <input ref={fileRef} type="file" accept=".html,.htm" className="hidden" onChange={handleFile} />
        <button onClick={() => setPasteOpen(true)} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors">
          <Clipboard size={12} /> Paste HTML
        </button>
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

- [ ] **Step 3: Create src/hooks/useIframeBridge.js**

```js
import { useCallback, useEffect } from 'react'
import { getEditableStyles } from '../utils/cssParser'

export function useIframeBridge(iframeRef, onSelect) {
  useEffect(() => {
    function onMessage(e) {
      if (e.data?.type !== 'css-studio-select') return
      const doc = iframeRef.current?.contentDocument
      if (!doc) return
      const el = doc.querySelector(e.data.selector)
      if (!el) { onSelect(e.data.selector, {}); return }
      onSelect(e.data.selector, getEditableStyles(el, doc.defaultView.getComputedStyle(el)))
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [iframeRef, onSelect])
}
```

- [ ] **Step 4: Update src/App.jsx to wire everything**

```jsx
import { useRef, useState, useEffect, useCallback } from 'react'
import Toolbar from './components/Toolbar'
import Preview from './components/Preview'
import { useStyleOverrides } from './hooks/useStyleOverrides'
import { useTokens } from './hooks/useTokens'
import { useIframeBridge } from './hooks/useIframeBridge'

export default function App() {
  const iframeRef = useRef(null)
  const [srcdoc, setSrcdoc] = useState('')
  const [originalHtml, setOriginalHtml] = useState('')
  const [selectedSelector, setSelectedSelector] = useState(null)
  const [currentStyles, setCurrentStyles] = useState({})
  const [layersOpen, setLayersOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)

  const { overrides, setProperty, removeProperty, undo, redo } = useStyleOverrides(iframeRef)
  const { tokens, loadFromHtml, upsertToken, deleteToken } = useTokens(iframeRef)

  // Undo/redo keyboard shortcut
  useEffect(() => {
    function onKey(e) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if (mod && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  // Context menu messages from iframe
  useEffect(() => {
    function onMessage(e) {
      if (e.data?.type === 'css-studio-contextmenu') {
        setSelectedSelector(e.data.selector)
        setContextMenu({ x: e.data.x, y: e.data.y, selector: e.data.selector })
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const handleSelect = useCallback((selector, styles) => {
    setSelectedSelector(selector)
    setCurrentStyles(styles)
  }, [])
  useIframeBridge(iframeRef, handleSelect)

  const handleLoadHtml = useCallback((html) => {
    setOriginalHtml(html)
    setSrcdoc(html)
    loadFromHtml(html)
    setSelectedSelector(null)
    setCurrentStyles({})
  }, [loadFromHtml])

  const mergedStyles = { ...currentStyles, ...(overrides.get(selectedSelector) ?? {}) }

  return (
    <div className="flex flex-col h-full">
      <Toolbar
        onLoadHtml={handleLoadHtml}
        layersOpen={layersOpen}
        onToggleLayers={() => setLayersOpen(o => !o)}
        onExport={() => setExportOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        {layersOpen && (
          <div className="w-44 bg-neutral-900 border-r border-neutral-800 flex-shrink-0 flex items-center justify-center text-neutral-600 text-xs">
            Layers (Task 11)
          </div>
        )}
        <Preview ref={iframeRef} srcdoc={srcdoc} />
        <div className="w-64 bg-neutral-900 border-l border-neutral-800 flex-shrink-0 flex items-center justify-center text-neutral-600 text-xs px-4 text-center">
          {selectedSelector ? selectedSelector : 'Click an element to edit'}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify end-to-end**

Run `npm run dev`. Paste this HTML and click Apply:
```html
<html><body style="font-family:sans-serif;padding:32px;background:#f5f5f5">
  <h1 id="title">Hello CSS Studio</h1>
  <p class="body-text">Click any element to select it.</p>
  <button class="btn">A Button</button>
</body></html>
```
Click the `<h1>` — expect right panel shows `#title`. Click `<p>` — expect `p.body-text`. Hover an element — expect dashed outline appears. Double-click a paragraph — expect it becomes editable.

- [ ] **Step 6: Commit**

```bash
git add src/components/Toolbar.jsx src/components/Preview.jsx src/hooks/useIframeBridge.js src/App.jsx
git commit -m "feat: html loading, iframe preview, element selection bridge"
```

---

## Task 5: Shared Controls

**Files:**
- Create: `src/components/controls/SegmentGroup.jsx`
- Create: `src/components/controls/TokenPicker.jsx`
- Create: `src/components/controls/NumberInput.jsx`
- Create: `src/components/controls/ColorPicker.jsx`
- Create: `src/components/controls/BoxModelEditor.jsx`

- [ ] **Step 1: Create SegmentGroup.jsx**

```jsx
export default function SegmentGroup({ options, value, onChange }) {
  return (
    <div className="flex gap-0.5 bg-neutral-800 rounded p-0.5">
      {options.map(opt => {
        const val = opt.value ?? opt
        const label = opt.icon ?? opt.label ?? val
        return (
          <button
            key={val}
            onClick={() => onChange(val)}
            title={opt.label ?? val}
            className={`flex-1 text-center text-[10px] py-1 rounded transition-colors ${val === value ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Create TokenPicker.jsx**

```jsx
export default function TokenPicker({ tokens, type, onChange }) {
  const filtered = tokens.filter(t => type === 'any' || t.type === type)
  return (
    <select
      defaultValue=""
      onChange={e => onChange(e.target.value ? `var(${e.target.value})` : '')}
      className="w-full bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 px-2 py-1 outline-none focus:border-blue-600"
    >
      <option value="">— select token —</option>
      {filtered.map(t => (
        <option key={t.name} value={t.name}>{t.name} ({t.value})</option>
      ))}
    </select>
  )
}
```

- [ ] **Step 3: Create NumberInput.jsx**

```jsx
import { useState } from 'react'
import TokenPicker from './TokenPicker'

const UNITS = ['px', 'rem', 'em', '%', 'vw', 'vh', 'auto']

export default function NumberInput({ label, value = '0px', onChange, tokens = [], min = 0, max, step = 1 }) {
  const [useToken, setUseToken] = useState(false)
  const str = String(value)
  const match = str.match(/^(-?\d*\.?\d+)(\D+)?$/)
  const num = match ? parseFloat(match[1]) : 0
  const unit = match ? (match[2]?.trim() ?? 'px') : 'px'
  const isAuto = str === 'auto'
  const resolvedMax = max ?? (unit === '%' || unit === 'em' || unit === 'rem' ? 10 : 400)

  function handleNum(e) { onChange(`${e.target.value}${unit}`) }
  function handleUnit(e) {
    if (e.target.value === 'auto') { onChange('auto'); return }
    onChange(`${num}${e.target.value}`)
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{label}</div>}
      <div className="flex gap-1 items-center">
        {useToken ? (
          <TokenPicker tokens={tokens} type="spacing" onChange={onChange} />
        ) : (
          <>
            <input type="range" min={min} max={resolvedMax} step={step} value={isAuto ? 0 : num}
              onChange={handleNum} className="flex-1 accent-blue-500 h-1" />
            <input type="number" value={isAuto ? '' : num} onChange={handleNum}
              className="w-12 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 px-1 py-0.5 text-center outline-none focus:border-blue-600" />
            <select value={isAuto ? 'auto' : unit} onChange={handleUnit}
              className="bg-neutral-800 border border-neutral-700 rounded text-[10px] text-neutral-400 px-1 py-0.5 outline-none">
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </>
        )}
        {tokens.length > 0 && (
          <button onClick={() => setUseToken(t => !t)} title={useToken ? 'Raw value' : 'Use token'}
            className={`text-[10px] px-1 py-0.5 rounded border transition-colors ${useToken ? 'border-blue-700 text-blue-400 bg-blue-900/30' : 'border-neutral-700 text-neutral-500 hover:text-neutral-300'}`}>
            ⬡
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create ColorPicker.jsx**

```jsx
import { useState } from 'react'
import TokenPicker from './TokenPicker'

export default function ColorPicker({ label, value = '#000000', onChange, tokens = [] }) {
  const [useToken, setUseToken] = useState(false)
  const [alpha, setAlpha] = useState(100)
  const hexBase = value.startsWith('#') ? value.slice(0, 7) : '#000000'

  function handleColor(e) {
    const hex = e.target.value
    const alphaHex = alpha < 100 ? Math.round(alpha / 100 * 255).toString(16).padStart(2, '0') : ''
    onChange(`${hex}${alphaHex}`)
  }

  function handleAlpha(e) {
    const a = parseInt(e.target.value)
    setAlpha(a)
    const alphaHex = a < 100 ? Math.round(a / 100 * 255).toString(16).padStart(2, '0') : ''
    onChange(`${hexBase}${alphaHex}`)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{label}</div>}
      {useToken ? (
        <div className="flex gap-1 items-center">
          <TokenPicker tokens={tokens} type="color" onChange={onChange} />
          <button onClick={() => setUseToken(false)}
            className="text-[10px] px-1 py-0.5 rounded border border-blue-700 text-blue-400 bg-blue-900/30">⬡</button>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2 items-center">
            <input type="color" value={hexBase} onChange={handleColor}
              className="w-7 h-7 rounded border border-neutral-700 bg-neutral-800 cursor-pointer p-0.5" />
            <input type="text" value={hexBase} onChange={e => onChange(e.target.value)}
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded text-xs font-mono text-neutral-300 px-2 py-1 outline-none focus:border-blue-600" />
            {tokens.length > 0 && (
              <button onClick={() => setUseToken(true)} title="Use token"
                className="text-[10px] px-1 py-0.5 rounded border border-neutral-700 text-neutral-500 hover:text-neutral-300">⬡</button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[10px] text-neutral-500 w-8">Alpha</div>
            <input type="range" min={0} max={100} value={alpha} onChange={handleAlpha}
              className="flex-1 accent-blue-500 h-1" />
            <div className="text-[10px] text-neutral-400 w-8 text-right">{alpha}%</div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Create BoxModelEditor.jsx**

```jsx
import NumberInput from './NumberInput'

const SIDES = ['Top', 'Right', 'Bottom', 'Left']

export default function BoxModelEditor({ label, propPrefix, values = {}, onChange, tokens = [] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{label}</div>
      <div className="grid grid-cols-2 gap-1.5">
        {SIDES.map(side => {
          const prop = `${propPrefix}${side}`
          return (
            <NumberInput key={side} label={side} value={values[prop] ?? '0px'}
              onChange={val => onChange(prop, val)} tokens={tokens} />
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Verify controls render in isolation**

Temporarily mount in App.jsx:
```jsx
import SegmentGroup from './components/controls/SegmentGroup'
import NumberInput from './components/controls/NumberInput'
import ColorPicker from './components/controls/ColorPicker'
// In JSX temporarily:
<div className="p-4 flex flex-col gap-4 w-64">
  <SegmentGroup options={['block','flex','grid']} value="flex" onChange={console.log} />
  <NumberInput label="Font size" value="16px" onChange={console.log} tokens={[]} />
  <ColorPicker label="Color" value="#2563eb" onChange={console.log} tokens={[]} />
</div>
```
Verify each renders and responds to interaction. Remove test markup.

- [ ] **Step 7: Commit**

```bash
git add src/components/controls/ && git commit -m "feat: SegmentGroup, NumberInput, ColorPicker, TokenPicker, BoxModelEditor controls"
```

---

## Task 6: Properties Panel + Layout Tab

**Files:**
- Create: `src/components/PropertiesPanel.jsx`
- Create: `src/components/tabs/LayoutTab.jsx`

- [ ] **Step 1: Create PropertiesPanel.jsx**

```jsx
import { useState } from 'react'
import LayoutTab from './tabs/LayoutTab'

const TABS = ['Layout', 'Type', 'Color', 'FX']

export default function PropertiesPanel({ selector, styles = {}, overrides, tokens, setProperty }) {
  const [tab, setTab] = useState('Layout')

  if (!selector) {
    return (
      <div className="w-64 bg-neutral-900 border-l border-neutral-800 flex-shrink-0 flex items-center justify-center">
        <p className="text-xs text-neutral-600 text-center px-4">Click any element in the preview to start editing</p>
      </div>
    )
  }

  const selectorOverrides = overrides?.get(selector) ?? {}

  return (
    <div className="w-64 bg-neutral-900 border-l border-neutral-800 flex-shrink-0 flex flex-col">
      <div className="px-3 py-2 border-b border-neutral-800 text-[10px] text-neutral-500 font-mono truncate bg-neutral-950">
        {selector}
      </div>
      <div className="flex border-b border-neutral-800">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 text-[10px] py-2 transition-colors ${tab === t ? 'text-blue-400 border-b-2 border-blue-500 -mb-px' : 'text-neutral-500 hover:text-neutral-300'}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === 'Layout' && <LayoutTab selector={selector} styles={styles} tokens={tokens} setProperty={setProperty} />}
        {tab === 'Type' && <div className="p-3 text-xs text-neutral-600">Type — Task 7</div>}
        {tab === 'Color' && <div className="p-3 text-xs text-neutral-600">Color — Task 8</div>}
        {tab === 'FX' && <div className="p-3 text-xs text-neutral-600">FX — Task 9</div>}
      </div>
      <div className="border-t border-neutral-800 bg-neutral-950 px-3 py-2 flex-shrink-0">
        <div className="text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Generated CSS</div>
        <pre className="text-[10px] text-green-400 font-mono whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto">
          {Object.entries(selectorOverrides).filter(([,v]) => v)
            .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`).join('\n')
            || '/* no overrides yet */'}
        </pre>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create LayoutTab.jsx**

```jsx
import SegmentGroup from '../controls/SegmentGroup'
import NumberInput from '../controls/NumberInput'
import BoxModelEditor from '../controls/BoxModelEditor'

const DISPLAY_OPTS = ['block','flex','grid','inline','inline-flex','none'].map(v => ({ value: v, label: v }))
const FLEX_DIR = [{ value:'row', label:'→' }, { value:'column', label:'↓' }, { value:'row-reverse', label:'←' }, { value:'column-reverse', label:'↑' }]
const ALIGN_OPTS = ['flex-start','center','flex-end','stretch','baseline'].map(v => ({ value: v, label: v.replace('flex-','') }))
const JUSTIFY_OPTS = ['flex-start','center','flex-end','space-between','space-around','space-evenly'].map(v => ({ value: v, label: v.replace('flex-','').replace('space-','sp-') }))

export default function LayoutTab({ selector, styles, tokens, setProperty }) {
  function set(prop, val) { setProperty(selector, prop, val) }
  const spacingTokens = tokens.filter(t => t.type === 'spacing')
  const isFlex = (styles.display ?? '').includes('flex')
  const isGrid = styles.display === 'grid'

  return (
    <div className="p-3 flex flex-col gap-4">
      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Display</div>
        <SegmentGroup options={DISPLAY_OPTS} value={styles.display ?? 'block'} onChange={v => set('display', v)} />
      </div>

      {isFlex && (
        <div className="flex flex-col gap-3">
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Direction</div>
            <SegmentGroup options={FLEX_DIR} value={styles.flexDirection ?? 'row'} onChange={v => set('flexDirection', v)} />
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Align Items</div>
            <SegmentGroup options={ALIGN_OPTS} value={styles.alignItems ?? 'stretch'} onChange={v => set('alignItems', v)} />
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Justify Content</div>
            <SegmentGroup options={JUSTIFY_OPTS} value={styles.justifyContent ?? 'flex-start'} onChange={v => set('justifyContent', v)} />
          </div>
          <NumberInput label="Gap" value={styles.gap ?? '0px'} onChange={v => set('gap', v)} tokens={spacingTokens} max={200} />
        </div>
      )}

      {isGrid && (
        <div className="flex flex-col gap-3">
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Template Columns</div>
            <input value={styles.gridTemplateColumns ?? 'repeat(3, 1fr)'} onChange={e => set('gridTemplateColumns', e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 px-2 py-1 outline-none focus:border-blue-600" />
          </div>
          <NumberInput label="Gap" value={styles.gap ?? '0px'} onChange={v => set('gap', v)} tokens={spacingTokens} max={200} />
        </div>
      )}

      <BoxModelEditor label="Padding" propPrefix="padding" values={styles}
        onChange={(prop, val) => set(prop, val)} tokens={spacingTokens} />
      <BoxModelEditor label="Margin" propPrefix="margin" values={styles}
        onChange={(prop, val) => set(prop, val)} tokens={spacingTokens} />

      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Sizing</div>
        <div className="grid grid-cols-2 gap-1.5">
          {[['W','width'],['H','height'],['min-W','minWidth'],['max-W','maxWidth'],['min-H','minHeight'],['max-H','maxHeight']].map(([label, prop]) => (
            <NumberInput key={prop} label={label} value={styles[prop] ?? ''} onChange={v => set(prop, v)} tokens={spacingTokens} max={2000} />
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire PropertiesPanel into App.jsx**

```jsx
import PropertiesPanel from './components/PropertiesPanel'

// Replace the placeholder right panel div with:
<PropertiesPanel
  selector={selectedSelector}
  styles={mergedStyles}
  overrides={overrides}
  tokens={tokens}
  setProperty={setProperty}
/>
```

- [ ] **Step 4: Verify Layout tab end-to-end**

Paste a flex container HTML, click it, switch display to "flex" — flex controls appear. Adjust gap slider — gap updates live in preview. Change padding — preview updates. Live CSS strip at bottom shows the generated rules.

- [ ] **Step 5: Commit**

```bash
git add src/components/PropertiesPanel.jsx src/components/tabs/LayoutTab.jsx src/App.jsx
git commit -m "feat: properties panel + layout tab with flex, grid, spacing, sizing"
```

---

## Task 7: Typography Tab

**Files:**
- Create: `src/components/tabs/TypeTab.jsx`
- Modify: `src/components/PropertiesPanel.jsx`

- [ ] **Step 1: Create TypeTab.jsx**

```jsx
import NumberInput from '../controls/NumberInput'
import SegmentGroup from '../controls/SegmentGroup'
import ColorPicker from '../controls/ColorPicker'

const ALIGN_OPTS = [{ value:'left', label:'L' }, { value:'center', label:'C' }, { value:'right', label:'R' }, { value:'justify', label:'J' }]
const WEIGHT_VALS = ['100','200','300','400','500','600','700','800','900']
const DECORATION_OPTS = [{ value:'none', label:'None' }, { value:'underline', label:'U' }, { value:'line-through', label:'S' }, { value:'overline', label:'O' }]
const STYLE_OPTS = [{ value:'normal', label:'Normal' }, { value:'italic', label:'Italic' }]

export default function TypeTab({ selector, styles, tokens, setProperty }) {
  function set(prop, val) { setProperty(selector, prop, val) }
  const colorTokens = tokens.filter(t => t.type === 'color')
  const sizeTokens = tokens.filter(t => t.type === 'spacing')

  return (
    <div className="p-3 flex flex-col gap-4">
      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Font Family</div>
        <input value={styles.fontFamily ?? ''} onChange={e => set('fontFamily', e.target.value)}
          placeholder="Inter, sans-serif"
          className="w-full bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 px-2 py-1 outline-none focus:border-blue-600" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumberInput label="Size" value={styles.fontSize ?? '16px'} onChange={v => set('fontSize', v)} tokens={sizeTokens} min={0} max={96} />
        <div>
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Weight</div>
          <select value={styles.fontWeight ?? '400'} onChange={e => set('fontWeight', e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 px-2 py-1 outline-none focus:border-blue-600">
            {WEIGHT_VALS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumberInput label="Line Height" value={styles.lineHeight ?? '1.5'} onChange={v => set('lineHeight', v)} tokens={[]} min={0.5} max={4} step={0.05} />
        <NumberInput label="Letter Spacing" value={styles.letterSpacing ?? '0em'} onChange={v => set('letterSpacing', v)} tokens={[]} min={-0.1} max={1} step={0.01} />
      </div>

      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Align</div>
        <SegmentGroup options={ALIGN_OPTS} value={styles.textAlign ?? 'left'} onChange={v => set('textAlign', v)} />
      </div>

      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Style</div>
        <SegmentGroup options={STYLE_OPTS} value={styles.fontStyle ?? 'normal'} onChange={v => set('fontStyle', v)} />
      </div>

      <ColorPicker label="Color" value={styles.color ?? '#000000'} onChange={v => set('color', v)} tokens={colorTokens} />

      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Decoration</div>
        <SegmentGroup options={DECORATION_OPTS} value={styles.textDecoration ?? 'none'} onChange={v => set('textDecoration', v)} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire TypeTab into PropertiesPanel**

```jsx
import TypeTab from './tabs/TypeTab'

// Replace: {tab === 'Type' && <div>Type — Task 7</div>}
// With:
{tab === 'Type' && <TypeTab selector={selector} styles={styles} tokens={tokens} setProperty={setProperty} />}
```

- [ ] **Step 3: Verify**

Select a heading. Switch to Type tab. Change font size — heading resizes live. Change color — color updates. Change font weight — weight updates.

- [ ] **Step 4: Commit**

```bash
git add src/components/tabs/TypeTab.jsx src/components/PropertiesPanel.jsx
git commit -m "feat: typography tab with font, size, weight, spacing, color, decoration"
```

---

## Task 8: Color Tab

**Files:**
- Create: `src/components/tabs/ColorTab.jsx`
- Modify: `src/components/PropertiesPanel.jsx`

- [ ] **Step 1: Create ColorTab.jsx**

```jsx
import { useState } from 'react'
import ColorPicker from '../controls/ColorPicker'
import SegmentGroup from '../controls/SegmentGroup'
import NumberInput from '../controls/NumberInput'

const BORDER_STYLES = ['none','solid','dashed','dotted','double'].map(v => ({ value: v, label: v }))
const BG_MODES = [{ value:'color', label:'Color' }, { value:'gradient', label:'Gradient' }]

function GradientEditor({ styles, set, tokens }) {
  const [angle, setAngle] = useState(135)
  const [stops, setStops] = useState([{ color: '#667eea' }, { color: '#764ba2' }])
  const colorTokens = tokens.filter(t => t.type === 'color')

  function rebuild(a, s) {
    set('backgroundImage', `linear-gradient(${a}deg, ${s.map((st, i) => `${st.color} ${i === 0 ? 0 : 100}%`).join(', ')})`)
    set('backgroundColor', 'transparent')
  }

  return (
    <div className="flex flex-col gap-2">
      <NumberInput label="Angle" value={`${angle}deg`} onChange={v => { const a = parseInt(v)||0; setAngle(a); rebuild(a, stops) }} tokens={[]} min={0} max={360} />
      {stops.map((stop, i) => (
        <ColorPicker key={i} label={`Stop ${i + 1}`} value={stop.color}
          onChange={c => { const s = stops.map((x, j) => j === i ? { color: c } : x); setStops(s); rebuild(angle, s) }}
          tokens={colorTokens} />
      ))}
    </div>
  )
}

export default function ColorTab({ selector, styles, tokens, setProperty }) {
  function set(prop, val) { setProperty(selector, prop, val) }
  const [bgMode, setBgMode] = useState('color')
  const colorTokens = tokens.filter(t => t.type === 'color')
  const spacingTokens = tokens.filter(t => t.type === 'spacing')

  return (
    <div className="p-3 flex flex-col gap-4">
      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Background</div>
        <SegmentGroup options={BG_MODES} value={bgMode} onChange={setBgMode} />
      </div>

      {bgMode === 'color'
        ? <ColorPicker value={styles.backgroundColor ?? '#ffffff'} onChange={v => set('backgroundColor', v)} tokens={colorTokens} />
        : <GradientEditor styles={styles} set={set} tokens={tokens} />
      }

      <ColorPicker label="Text Color" value={styles.color ?? '#000000'} onChange={v => set('color', v)} tokens={colorTokens} />

      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Border</div>
        <div className="flex flex-col gap-2">
          <SegmentGroup options={BORDER_STYLES} value={styles.borderStyle ?? 'none'} onChange={v => set('borderStyle', v)} />
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Width" value={styles.borderWidth ?? '1px'} onChange={v => set('borderWidth', v)} tokens={[]} min={0} max={20} />
            <NumberInput label="Radius" value={styles.borderRadius ?? '0px'} onChange={v => set('borderRadius', v)} tokens={spacingTokens} min={0} max={100} />
          </div>
          <ColorPicker label="Border Color" value={styles.borderColor ?? '#000000'} onChange={v => set('borderColor', v)} tokens={colorTokens} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire ColorTab into PropertiesPanel**

```jsx
import ColorTab from './tabs/ColorTab'

// Replace: {tab === 'Color' && <div>Color — Task 8</div>}
// With:
{tab === 'Color' && <ColorTab selector={selector} styles={styles} tokens={tokens} setProperty={setProperty} />}
```

- [ ] **Step 3: Verify**

Select a div. Color tab — change background color, text color, add a border. Switch to Gradient — apply gradient. All update live.

- [ ] **Step 4: Commit**

```bash
git add src/components/tabs/ColorTab.jsx src/components/PropertiesPanel.jsx
git commit -m "feat: color tab with background, text color, border, gradient"
```

---

## Task 9: FX Tab

**Files:**
- Create: `src/components/tabs/FxTab.jsx`
- Modify: `src/components/PropertiesPanel.jsx`

- [ ] **Step 1: Create FxTab.jsx**

```jsx
import NumberInput from '../controls/NumberInput'
import SegmentGroup from '../controls/SegmentGroup'
import ColorPicker from '../controls/ColorPicker'

const EASING = ['linear','ease','ease-in','ease-out','ease-in-out'].map(v => ({ value: v, label: v }))
const VISIBILITY = [{ value:'visible', label:'Visible' }, { value:'hidden', label:'Hidden' }]
const TRANSFORM_FNS = ['rotate','scale','translateX','translateY','skewX']

function parseTransform(str = '') {
  const vals = {}
  for (const fn of TRANSFORM_FNS) {
    const m = str.match(new RegExp(`${fn}\\(([^)]+)\\)`))
    vals[fn] = m ? m[1] : (fn === 'scale' ? '1' : fn === 'rotate' ? '0deg' : '0px')
  }
  return vals
}

function buildTransform(vals) {
  return TRANSFORM_FNS.filter(fn => vals[fn]).map(fn => `${fn}(${vals[fn]})`).join(' ') || 'none'
}

export default function FxTab({ selector, styles, tokens, setProperty }) {
  function set(prop, val) { setProperty(selector, prop, val) }
  const colorTokens = tokens.filter(t => t.type === 'color')
  const tfVals = parseTransform(styles.transform)

  function setTf(fn, val) {
    set('transform', buildTransform({ ...tfVals, [fn]: val }))
  }

  const shadowParts = (styles.boxShadow ?? '0px 4px 8px 0px rgba(0,0,0,0.2)').split(' ')

  return (
    <div className="p-3 flex flex-col gap-4">
      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Transform</div>
        <div className="flex flex-col gap-2">
          <NumberInput label="Rotate" value={tfVals.rotate} onChange={v => setTf('rotate', v)} tokens={[]} min={-360} max={360} />
          <NumberInput label="Scale" value={tfVals.scale} onChange={v => setTf('scale', v)} tokens={[]} min={0} max={3} step={0.05} />
          <NumberInput label="Translate X" value={tfVals.translateX} onChange={v => setTf('translateX', v)} tokens={[]} min={-400} max={400} />
          <NumberInput label="Translate Y" value={tfVals.translateY} onChange={v => setTf('translateY', v)} tokens={[]} min={-400} max={400} />
          <NumberInput label="Skew X" value={tfVals.skewX} onChange={v => setTf('skewX', v)} tokens={[]} min={-45} max={45} />
        </div>
      </div>

      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Box Shadow</div>
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          {[['X',0],['Y',1],['Blur',2],['Spread',3]].map(([label, idx]) => (
            <NumberInput key={label} label={label} value={shadowParts[idx] ?? '0px'} min={-50} max={100}
              onChange={v => {
                const p = [...shadowParts]
                p[idx] = v
                set('boxShadow', p.join(' '))
              }} tokens={[]} />
          ))}
        </div>
        <ColorPicker label="Shadow Color" value="#000000"
          onChange={color => { const p = shadowParts.slice(0, 4); set('boxShadow', [...p, color].join(' ')) }}
          tokens={colorTokens} />
      </div>

      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Text Shadow</div>
        <input value={styles.textShadow ?? ''} onChange={e => set('textShadow', e.target.value)}
          placeholder="2px 2px 4px rgba(0,0,0,0.3)"
          className="w-full bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 px-2 py-1 outline-none focus:border-blue-600 font-mono" />
      </div>

      <NumberInput label="Opacity" value={styles.opacity ?? '1'} onChange={v => set('opacity', v)} tokens={[]} min={0} max={1} step={0.01} />

      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Transition</div>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="Duration" value={styles.transitionDuration ?? '300ms'} onChange={v => set('transitionDuration', v)} tokens={[]} min={0} max={3000} step={50} />
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Easing</div>
            <select value={styles.transitionTimingFunction ?? 'ease'} onChange={e => set('transitionTimingFunction', e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 px-2 py-1 outline-none focus:border-blue-600">
              {EASING.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div>
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Visibility</div>
        <SegmentGroup options={VISIBILITY} value={styles.visibility ?? 'visible'} onChange={v => set('visibility', v)} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire FxTab into PropertiesPanel**

```jsx
import FxTab from './tabs/FxTab'

// Replace: {tab === 'FX' && <div>FX — Task 9</div>}
// With:
{tab === 'FX' && <FxTab selector={selector} styles={styles} tokens={tokens} setProperty={setProperty} />}
```

- [ ] **Step 3: Verify**

Select a div. FX tab. Rotate slider — div rotates live. Scale > 1 — div grows. Opacity 0.5 — half transparent.

- [ ] **Step 4: Commit**

```bash
git add src/components/tabs/FxTab.jsx src/components/PropertiesPanel.jsx
git commit -m "feat: FX tab with transform, box-shadow, opacity, transition, visibility"
```

---

## Task 10: DOM Manipulation Context Menu

**Files:**
- Create: `src/components/ContextMenu.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create ContextMenu.jsx**

```jsx
import { useEffect, useRef } from 'react'

const ITEMS = [
  { key: 'editText', label: 'Edit text', icon: '✎' },
  { key: 'duplicate', label: 'Duplicate', icon: '⧉' },
  { key: 'moveUp', label: 'Move up', icon: '↑' },
  { key: 'moveDown', label: 'Move down', icon: '↓' },
  { key: 'addSibling', label: 'Add sibling', icon: '+' },
  null,
  { key: 'delete', label: 'Delete', icon: '✕', danger: true },
]

export default function ContextMenu({ x, y, selector, onAction, onClose }) {
  const ref = useRef()

  useEffect(() => {
    function handler(e) { if (!ref.current?.contains(e.target)) onClose() }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div ref={ref} style={{ position:'fixed', top:y, left:x, zIndex:9999 }}
      className="bg-neutral-900 border border-neutral-700 rounded-lg py-1 w-44 shadow-2xl">
      <div className="px-3 py-1 text-[9px] text-neutral-600 font-mono truncate">{selector}</div>
      <div className="my-0.5 border-t border-neutral-800" />
      {ITEMS.map((item, i) =>
        item === null
          ? <div key={i} className="my-0.5 border-t border-neutral-800" />
          : <button key={item.key} onClick={() => { onAction(item.key); onClose() }}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${item.danger ? 'text-red-400 hover:bg-red-900/20' : 'text-neutral-300 hover:bg-neutral-800'}`}>
              <span className="text-neutral-500">{item.icon}</span> {item.label}
            </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add context action handler and wire ContextMenu in App.jsx**

```jsx
import ContextMenu from './components/ContextMenu'

// Add handleContextAction function in App:
function handleContextAction(action) {
  const doc = iframeRef.current?.contentDocument
  if (!doc || !contextMenu) return
  const el = doc.querySelector(contextMenu.selector)
  if (!el) return
  switch (action) {
    case 'editText':
      el.contentEditable = 'true'; el.focus(); break
    case 'duplicate':
      el.insertAdjacentElement('afterend', el.cloneNode(true)); break
    case 'moveUp':
      if (el.previousElementSibling) el.parentNode.insertBefore(el, el.previousElementSibling); break
    case 'moveDown':
      if (el.nextElementSibling) el.parentNode.insertBefore(el.nextElementSibling, el); break
    case 'addSibling':
      const newEl = doc.createElement('div')
      newEl.textContent = 'New element'
      el.insertAdjacentElement('afterend', newEl); break
    case 'delete':
      el.remove(); setSelectedSelector(null); break
  }
}

// In JSX (inside the return, after the main layout div):
{contextMenu && (
  <ContextMenu
    x={contextMenu.x} y={contextMenu.y}
    selector={contextMenu.selector}
    onAction={handleContextAction}
    onClose={() => setContextMenu(null)}
  />
)}
```

- [ ] **Step 3: Verify**

Load HTML with several elements. Right-click one — context menu appears in correct position. Test each action: Duplicate clones element, Move Up/Down swaps siblings, Add Sibling inserts new div, Delete removes it. Double-click text — becomes editable.

- [ ] **Step 4: Commit**

```bash
git add src/components/ContextMenu.jsx src/App.jsx
git commit -m "feat: context menu with DOM manipulation — duplicate, move, add, delete, inline edit"
```

---

## Task 11: Layers Panel (DOM Tree + Tokens Tab)

**Files:**
- Create: `src/components/LayersPanel.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create LayersPanel.jsx**

```jsx
import { useEffect, useState } from 'react'

function TreeNode({ node, depth, selectedSelector, onSelect }) {
  const [open, setOpen] = useState(depth < 3)
  if (!node.tagName) return null
  const tag = node.tagName.toLowerCase()
  if (['script','style','meta','link'].includes(tag)) return null
  const id = node.id && !node.id.startsWith('css-studio-') ? `#${node.id}` : ''
  const cls = [...(node.classList ?? [])].filter(c => !c.startsWith('css-studio-'))
  const classStr = cls.length ? `.${cls.join('.')}` : ''
  const label = `${tag}${id}${classStr}`
  const children = [...(node.children ?? [])].filter(c => !c.id?.startsWith('css-studio-'))
  const selector = node.id && !node.id.startsWith('css-studio-') ? `#${node.id}` : label
  const isSelected = selector === selectedSelector

  return (
    <div>
      <div onClick={() => onSelect(selector)}
        style={{ paddingLeft: `${8 + depth * 10}px` }}
        className={`flex items-center gap-1 py-0.5 pr-2 cursor-pointer text-[10px] font-mono rounded ${isSelected ? 'bg-blue-900/40 text-blue-300' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'}`}>
        <span onClick={e => { e.stopPropagation(); setOpen(o => !o) }} className="text-neutral-600 w-3 text-center">
          {children.length > 0 ? (open ? '▾' : '▸') : ' '}
        </span>
        <span className="truncate">{label}</span>
      </div>
      {open && children.map((child, i) => (
        <TreeNode key={i} node={child} depth={depth + 1} selectedSelector={selectedSelector} onSelect={onSelect} />
      ))}
    </div>
  )
}

function TokensTab({ tokens, upsertToken, deleteToken }) {
  const [name, setName] = useState('')
  const [value, setValue] = useState('')

  return (
    <div className="p-2 flex flex-col gap-2 overflow-y-auto">
      <div className="text-[9px] text-neutral-500 uppercase tracking-wider">CSS Variables</div>
      {tokens.map(t => (
        <div key={t.name} className="flex items-center gap-1.5 group">
          {t.type === 'color' && <div className="w-3.5 h-3.5 rounded border border-neutral-700 flex-shrink-0" style={{ background: t.value }} />}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="text-[9px] text-blue-400 font-mono truncate">{t.name}</div>
            <input defaultValue={t.value} onBlur={e => upsertToken(t.name, e.target.value, t.type)}
              className="text-[9px] bg-transparent text-neutral-500 font-mono outline-none w-full" />
          </div>
          <button onClick={() => deleteToken(t.name)} className="text-neutral-700 hover:text-red-400 text-[9px] opacity-0 group-hover:opacity-100 flex-shrink-0">✕</button>
        </div>
      ))}
      <div className="border-t border-neutral-800 pt-2 flex flex-col gap-1 mt-1">
        <div className="text-[9px] text-neutral-600">Add token</div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="--my-color"
          className="w-full bg-neutral-800 border border-neutral-700 rounded text-[9px] font-mono text-neutral-300 px-2 py-1 outline-none focus:border-blue-600" />
        <input value={value} onChange={e => setValue(e.target.value)} placeholder="#2563eb"
          className="w-full bg-neutral-800 border border-neutral-700 rounded text-[9px] font-mono text-neutral-300 px-2 py-1 outline-none focus:border-blue-600" />
        <button onClick={() => { if (name && value) { upsertToken(name, value); setName(''); setValue('') } }}
          className="bg-blue-700 hover:bg-blue-600 text-white text-[9px] px-2 py-1 rounded">Add</button>
      </div>
    </div>
  )
}

export default function LayersPanel({ iframeRef, selectedSelector, onSelect, tokens, upsertToken, deleteToken }) {
  const [tab, setTab] = useState('layers')
  const [body, setBody] = useState(null)

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument
    if (doc?.body) setBody(doc.body)
  })

  return (
    <div className="w-44 bg-neutral-900 border-r border-neutral-800 flex-shrink-0 flex flex-col">
      <div className="flex border-b border-neutral-800 flex-shrink-0">
        <button onClick={() => setTab('layers')} className={`flex-1 text-[10px] py-2 ${tab === 'layers' ? 'text-blue-400 border-b-2 border-blue-500 -mb-px' : 'text-neutral-500 hover:text-neutral-300'}`}>Layers</button>
        <button onClick={() => setTab('tokens')} className={`flex-1 text-[10px] py-2 ${tab === 'tokens' ? 'text-blue-400 border-b-2 border-blue-500 -mb-px' : 'text-neutral-500 hover:text-neutral-300'}`}>Tokens</button>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {tab === 'layers'
          ? body
            ? <TreeNode node={body} depth={0} selectedSelector={selectedSelector} onSelect={onSelect} />
            : <div className="text-[10px] text-neutral-600 p-3">Load HTML to see layers</div>
          : <TokensTab tokens={tokens} upsertToken={upsertToken} deleteToken={deleteToken} />
        }
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire LayersPanel into App.jsx**

```jsx
import LayersPanel from './components/LayersPanel'

// Replace the placeholder Layers div:
{layersOpen && (
  <LayersPanel
    iframeRef={iframeRef}
    selectedSelector={selectedSelector}
    onSelect={setSelectedSelector}
    tokens={tokens}
    upsertToken={upsertToken}
    deleteToken={deleteToken}
  />
)}
```

- [ ] **Step 3: Verify**

Toggle Layers. Expect DOM tree of loaded HTML. Click a node — element selects in preview, properties panel updates. Switch to Tokens tab — detected tokens listed. Edit a token value, blur — iframe :root updates live. Add a new token — appears in list and in :root.

- [ ] **Step 4: Commit**

```bash
git add src/components/LayersPanel.jsx src/App.jsx
git commit -m "feat: layers panel with DOM tree and token manager"
```

---

## Task 12: Export Modal

**Files:**
- Create: `src/components/ExportModal.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create ExportModal.jsx**

```jsx
import { useRef } from 'react'
import { X, Copy, Download } from 'lucide-react'
import { formatCssDiff, injectStyles, downloadHtml } from '../utils/htmlExport'
import { synthesizeCss } from '../utils/cssParser'

export default function ExportModal({ overrides, originalHtml, onClose }) {
  const diff = formatCssDiff(overrides)
  const diffRef = useRef()

  function handleCopy() {
    navigator.clipboard.writeText(diff)
    diffRef.current.style.borderColor = '#22c55e'
    setTimeout(() => { if (diffRef.current) diffRef.current.style.borderColor = '' }, 1200)
  }

  function handleDownload() {
    downloadHtml(injectStyles(originalHtml, synthesizeCss(overrides)))
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 w-[540px] max-h-[80vh] flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-neutral-200">Export</div>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200 transition-colors"><X size={14} /></button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">CSS Changes Only</div>
            <button onClick={handleCopy} className="flex items-center gap-1 bg-blue-700 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded transition-colors">
              <Copy size={10} /> Copy
            </button>
          </div>
          <pre ref={diffRef} className="bg-neutral-950 border border-neutral-800 rounded p-3 text-xs text-green-400 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto transition-colors">
            {diff || '/* no changes yet */'}
          </pre>
        </div>

        <div className="flex items-center justify-between border border-neutral-800 rounded-lg p-3">
          <div>
            <div className="text-xs text-neutral-300 font-medium">Full HTML File</div>
            <div className="text-[10px] text-neutral-600 mt-0.5">Original markup + injected &lt;style&gt; in &lt;head&gt;</div>
          </div>
          <button onClick={handleDownload} className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded transition-colors">
            <Download size={11} /> Download
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire ExportModal into App.jsx**

```jsx
import ExportModal from './components/ExportModal'

// In JSX (after ContextMenu):
{exportOpen && (
  <ExportModal
    overrides={overrides}
    originalHtml={originalHtml}
    onClose={() => setExportOpen(false)}
  />
)}
```

- [ ] **Step 3: Verify**

Make style changes. Click Export. Expect CSS diff shows the modified rules. Click Copy — paste to editor, verify valid CSS. Click Download — open file in browser, styles applied. Click outside modal — closes.

- [ ] **Step 4: Commit**

```bash
git add src/components/ExportModal.jsx src/App.jsx
git commit -m "feat: export modal with CSS diff copy and full HTML download"
```

---

## Task 13: Final Build + Polish

**Files:**
- Modify: `src/App.jsx` (undo/redo UI indicators)

- [ ] **Step 1: Add undo/redo toolbar indicators**

In `Toolbar.jsx`, accept and display `canUndo`/`canRedo`:
```jsx
// Add props: canUndo, canRedo, onUndo, onRedo
// After the Paste HTML button:
<div className="h-4 w-px bg-neutral-700" />
<button onClick={onUndo} disabled={!canUndo}
  className="text-xs text-neutral-500 hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
  title="Undo (⌘Z)">↩</button>
<button onClick={onRedo} disabled={!canRedo}
  className="text-xs text-neutral-500 hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
  title="Redo (⌘⇧Z)">↪</button>
```

Pass from App.jsx:
```jsx
<Toolbar
  onLoadHtml={handleLoadHtml}
  layersOpen={layersOpen}
  onToggleLayers={() => setLayersOpen(o => !o)}
  onExport={() => setExportOpen(true)}
  canUndo={canUndo}
  canRedo={canRedo}
  onUndo={undo}
  onRedo={redo}
/>
```

Also destructure `canUndo` and `canRedo` from `useStyleOverrides`:
```jsx
const { overrides, setProperty, removeProperty, undo, redo, canUndo, canRedo } = useStyleOverrides(iframeRef)
```

- [ ] **Step 2: Test undo/redo**

Make 3 style changes. Press Cmd+Z twice — last two changes revert in preview. Press Cmd+Shift+Z — last change reapplied. Verify toolbar ↩/↪ buttons enable/disable correctly.

- [ ] **Step 3: Production build**

```bash
npm run build
```

Expected output: `dist/index.html` — single file.

- [ ] **Step 4: Full smoke test from dist/index.html**

Open `dist/index.html` directly (file:// URL — no server). Verify:
1. App loads with no network requests
2. Paste HTML works
3. Click to select — properties panel shows
4. Change font size — live update
5. Export — CSS diff correct, HTML download works
6. Toggle Layers — DOM tree shows
7. Undo/redo works

- [ ] **Step 5: Check file size**

```bash
ls -lh dist/index.html
```

Expected: under 2MB. If over 5MB, add to vite.config.js:
```js
build: {
  rollupOptions: {
    treeshake: true
  }
}
```

- [ ] **Step 6: Final commit**

```bash
git add -A && git commit -m "feat: css-studio v1 complete — single-file visual CSS editor"
```

---

## Self-Review

### Spec Coverage

| Requirement | Task |
| --- | --- |
| Single HTML file (Vite + React + singlefile) | 1 |
| Open file + paste HTML | 4 |
| iframe srcdoc preview | 4 |
| Click to select element | 4 |
| Hover dashed outline | 4 (bridge script) |
| Double-click inline text edit | 4 + 10 |
| Right-click context menu (dup/move/delete/add) | 10 |
| Right panel (properties) | 6 |
| Togglable left DOM tree | 11 |
| Layout tab (display, flex, grid, box model, sizing) | 6 |
| Typography tab | 7 |
| Color tab (bg, text, border, gradient) | 8 |
| FX tab (transform, shadow, opacity, transition) | 9 |
| Token auto-detection from :root | 3 (useTokens) |
| Token CRUD in layers panel | 11 |
| Per-field token toggle (⬡) in all controls | 5 |
| CSS diff copy | 12 |
| Full HTML download | 12 |
| Live CSS strip | 6 |
| Undo/redo Cmd+Z | 3 + 13 |

All requirements covered. No gaps.

### Type Consistency

- `setProperty(selector, prop, val)` — defined in `useStyleOverrides`, called identically in all four tabs ✓
- `overrides` is `Map<string, object>` — used correctly in ExportModal, PropertiesPanel, synthesizeCss ✓
- `tokens` is `[{ name, value, type }]` — passed consistently to all controls and LayersPanel ✓
- `iframeRef` is a React ref passed to `useStyleOverrides`, `useTokens`, `useIframeBridge`, `LayersPanel` ✓
- `srcdoc` string → set by `handleLoadHtml` → passed to `Preview` → bridge injected before render ✓

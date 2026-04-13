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

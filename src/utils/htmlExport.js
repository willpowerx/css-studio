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

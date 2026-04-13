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

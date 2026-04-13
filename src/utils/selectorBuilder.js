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

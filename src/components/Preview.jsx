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

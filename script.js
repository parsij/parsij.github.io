
(function(){
const $ = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

const store = {
  get(k, d){ try{ return JSON.parse(localStorage.getItem(k)) ?? d }catch{ return d } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)) }
};

const root = document.documentElement;
const panel = $("#panel");
const openPanel = $("#open-panel");
const closePanel = $("#close-panel");
const themeSelect = $("#theme-select");
const accentInput = $("#accent");
const modeSelect = $("#mode");
const motionSelect = $("#motion");
const resetBtn = $("#reset");

const defaults = { theme: "neon", accent: "#0ea5e9", mode: "dark", motion: "full" };
let settings = Object.assign({}, defaults, store.get("ui-settings", {}));

function applySettings() {
  root.setAttribute("data-theme", settings.theme);
  root.style.setProperty("--accent", settings.accent);
  if(settings.mode === "light") root.classList.add("light");
  else if(settings.mode === "dark") root.classList.remove("light");
  else {
    window.matchMedia("(prefers-color-scheme: light)").matches ? root.classList.add("light") : root.classList.remove("light");
  }
  themeSelect.value = settings.theme;
  accentInput.value = settings.accent;
  modeSelect.value = settings.mode;
  motionSelect.value = settings.motion;
  document.querySelector('meta[name="theme-color"]').setAttribute('content', settings.mode === "light" ? '#ffffff' : '#0b1020');
}
function updateSetting(key, val){ settings[key] = val; store.set("ui-settings", settings); applySettings(); }

openPanel?.addEventListener("click", ()=>{ panel.classList.add("open"); openPanel.setAttribute("aria-expanded","true"); panel.setAttribute("aria-hidden","false"); });
closePanel?.addEventListener("click", ()=>{ panel.classList.remove("open"); openPanel.setAttribute("aria-expanded","false"); panel.setAttribute("aria-hidden","true"); });
themeSelect?.addEventListener("change", e=> updateSetting("theme", e.target.value));
accentInput?.addEventListener("input", e=> updateSetting("accent", e.target.value));
modeSelect?.addEventListener("change", e=> updateSetting("mode", e.target.value));
motionSelect?.addEventListener("change", e=> updateSetting("motion", e.target.value));
resetBtn?.addEventListener("click", ()=>{ settings = Object.assign({}, defaults); store.set("ui-settings", settings); applySettings(); });
applySettings();

// shortcuts
window.addEventListener("keydown", e=>{
  if(e.key.toLowerCase()==="t"){ updateSetting("mode", root.classList.contains("light") ? "dark" : "light"); }
  if(e.key.toLowerCase()==="g"){ document.body.classList.toggle("show-grid"); }
});

// spotlight
const spot = $("#cursor-spotlight");
window.addEventListener("mousemove", e=>{
  spot.style.setProperty("--mx", e.clientX + "px");
  spot.style.setProperty("--my", e.clientY + "px");
});

// flow field
const bg = $("#bg");
const ctx = bg.getContext?.("2d");
let W=0, H=0, t=0;
function size(){ W = bg.width = innerWidth * devicePixelRatio; H = bg.height = innerHeight * devicePixelRatio; }
size(); addEventListener("resize", size);

const points = [];
function initPoints(n=1000){ points.length = 0; for(let i=0;i<n;i++) points.push({ x: Math.random()*W, y: Math.random()*H, l: Math.random()*1.6+0.6 }); }
initPoints(1000);

let mouse = { x: -1e9, y: -1e9 };
addEventListener("mousemove", e=>{ mouse.x = e.clientX * devicePixelRatio; mouse.y = e.clientY * devicePixelRatio; });
addEventListener("mouseleave", ()=>{ mouse.x = -1e9; mouse.y = -1e9; });

function loop(){
  if(!ctx) return;
  t += 0.002;
  ctx.clearRect(0,0,W,H);
  ctx.globalAlpha = 0.9;
  for(const p of points){
    const a = Math.sin((p.x*0.002+t)*0.9) + Math.cos((p.y*0.002-t)*1.1);
    p.x += Math.cos(a)*p.l; p.y += Math.sin(a)*p.l;
    const dx = p.x - mouse.x, dy = p.y - mouse.y;
    const d = Math.hypot(dx,dy);
    if(d < 120*devicePixelRatio){ p.x += dx*0.06; p.y += dy*0.06; }
    if(p.x<0) p.x+=W; if(p.x>W) p.x-=W;
    if(p.y<0) p.y+=H; if(p.y>H) p.y-=H;
    ctx.beginPath(); ctx.arc(p.x,p.y,1.2,0,Math.PI*2);
    const g1 = getComputedStyle(root).getPropertyValue('--grad-1').trim();
    const g2 = getComputedStyle(root).getPropertyValue('--grad-2').trim();
    const g3 = getComputedStyle(root).getPropertyValue('--grad-3').trim();
    ctx.fillStyle = Math.random()<.33 ? g1 : (Math.random()<.5 ? g2 : g3);
    ctx.fill();
  }
  if(settings.motion === "full") requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// parallax
const px = $$(".parallax");
addEventListener("scroll", ()=>{
  const y = scrollY;
  px.forEach(el=>{
    const speed = parseFloat(el.dataset.speed || "1");
    el.style.transform = `translateY(${y * 0.04 * speed}px)`;
  });
});

// typed
const typed = $("#typed");
const roles = ["Backend APIs","Automation","Data tooling","Java services","C++ performance"];
let ri=0, ci=0, del=false, pause=0;
(function typeLoop(){
  if(!typed) return;
  if(pause>0){ pause--; return requestAnimationFrame(typeLoop); }
  const cur = roles[ri];
  typed.textContent = cur.slice(0,ci);
  if(!del){ ci++; if(ci>cur.length){ del=true; pause=30; } }
  else { ci--; if(ci===0){ del=false; ri=(ri+1)%roles.length; } }
  requestAnimationFrame(typeLoop);
})();

// count-up
$$(".num").forEach(el=>{
  const end = parseInt(el.dataset.count,10) || 0;
  let cur = 0; const step = Math.max(1, Math.floor(end/60));
  const id = setInterval(()=>{ cur += step; if(cur>=end){ cur=end; clearInterval(id); } el.textContent = cur; }, 16);
});

// tilt
function tilt(el){
  function onMove(e){
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width/2; const cy = r.top + r.height/2;
    const dx = e.clientX - cx; const dy = e.clientY - cy;
    const rx = (-dy/r.height)*10; const ry = (dx/r.width)*10;
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  }
  function onLeave(){ el.style.transform = ""; }
  el.addEventListener("mousemove", onMove);
  el.addEventListener("mouseleave", onLeave);
}
$$(".tilt").forEach(tilt);

// magnetic + ripple
$$(".magnetic").forEach(btn=>{
  btn.addEventListener("mousemove", e=>{
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width/2; const y = e.clientY - r.top - r.height/2;
    btn.style.transform = `translate(${x*0.08}px,${y*0.08}px)`; btn.style.boxShadow = `0 18px 40px rgba(0,0,0,0.25)`;
  });
  btn.addEventListener("mouseleave", ()=>{ btn.style.transform = ""; btn.style.boxShadow = ""; });
});
$$(".ripple").forEach(el=>{
  el.addEventListener("click", e=>{
    const c = document.createElement("span"); c.className = "ripple-circle";
    const r = el.getBoundingClientRect(); c.style.left = (e.clientX - r.left) + "px"; c.style.top = (e.clientY - r.top) + "px";
    el.appendChild(c); setTimeout(()=> c.remove(), 600);
  });
});

// filters
const chips = $$(".chip");
chips.forEach(ch=> ch.addEventListener("click", ()=>{
  chips.forEach(c=>c.classList.remove("active")); ch.classList.add("active");
  const tag = ch.dataset.filter;
  $$("#project-grid .project").forEach(card=>{ card.style.display = (tag==="all" || card.dataset.tags.includes(tag)) ? "" : "none"; });
}));

// repos
async function loadRepos(){
  const grid = $("#repo-grid"); if(!grid) return;
  grid.innerHTML = "<p class='muted'>Loading repos…</p>";
  try{
    const res = await fetch("https://api.github.com/users/parsij/repos?sort=updated&per_page=12");
    if(!res.ok) throw new Error("GitHub API error");
    const data = await res.json(); grid.innerHTML = "";
    data.forEach(repo=>{
      if(repo.fork) return;
      const el = document.createElement("article");
      el.className = "card tilt";
      el.innerHTML = `<h3>${repo.name}</h3><p>${repo.description || "No description provided."}</p>
        <div class="tags"><span>★ ${repo.stargazers_count}</span><span>⟳ ${repo.forks_count}</span><a class="btn ghost ripple" href="${repo.html_url}" target="_blank" rel="noopener">Open</a></div>`;
      grid.appendChild(el); tilt(el);
    });
  }catch(err){ console.error(err); grid.innerHTML = "<p class='muted'>Could not load repos.</p>"; }
}
loadRepos();

// copy email
$("#copy-email")?.addEventListener("click", async ()=>{
  try { await navigator.clipboard.writeText("parsapoosti@gmail.com");
    const b = $("#copy-email"); const prev = b.textContent; b.textContent = "Copied!"; setTimeout(()=> b.textContent = prev, 1200);
  } catch { alert("parsapoosti@gmail.com"); }
});

// radar
function radar(canvas, labels, values, max=10){
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height; const cx = w/2, cy = h/2 + 10; const r = Math.min(w,h)/2 - 26;
  ctx.clearRect(0,0,w,h); ctx.lineWidth = 1;
  const N = labels.length;
  for(let ring=1; ring<=5; ring++) {
    ctx.beginPath();
    for(let i=0;i<N;i++) {
      const a = (Math.PI*2*i/N) - Math.PI/2;
      const rr = r*(ring/5); const x = cx + Math.cos(a)*rr; const y = cy + Math.sin(a)*rr;
      i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
    }
    ctx.closePath(); ctx.strokeStyle = getComputedStyle(root).getPropertyValue('--line'); ctx.stroke();
  }
  ctx.fillStyle = getComputedStyle(root).getPropertyValue('--muted'); ctx.textAlign = "center"; ctx.font = "12px Outfit, sans-serif";
  for(let i=0;i<N;i++) {
    const a = (Math.PI*2*i/N) - Math.PI/2; const x = cx + Math.cos(a)*(r+10); const y = cy + Math.sin(a)*(r+10);
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r);
    ctx.strokeStyle = getComputedStyle(root).getPropertyValue('--line'); ctx.stroke(); ctx.fillText(labels[i], x, y);
  }
  ctx.beginPath();
  for(let i=0;i<N;i++) {
    const a = (Math.PI*2*i/N) - Math.PI/2; const rr = r * (values[i]/max);
    const x = cx + Math.cos(a)*rr; const y = cy + Math.sin(a)*rr; i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
  }
  ctx.closePath(); const g1 = getComputedStyle(root).getPropertyValue('--grad-1').trim(); const g2 = getComputedStyle(root).getPropertyValue('--grad-2').trim();
  ctx.fillStyle = g1 + "33"; ctx.strokeStyle = g2; ctx.lineWidth = 2; ctx.fill(); ctx.stroke();
}
const radarCanvas = $("#radar");
if(radarCanvas) radar(radarCanvas, ["Python","Java","C++","SQL","Testing","Docker"], [10,8,7,8,8,7]);

// chatbot lazy embed + CTA
const embed = $("#hf-embed"); const fallback = $("#embed-fallback");
if(embed){
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(ent=>{
      if(ent.isIntersecting){
        const src = embed.getAttribute("data-embed-src"); embed.src = src;
        setTimeout(()=>{ fallback?.remove(); }, 1500); observer.disconnect();
      }
    });
  }, { threshold: 0.2 });
  observer.observe(embed);
}
$("#cta-business")?.addEventListener("click", ()=>{
  const subj = encodeURIComponent("Chatbot for my business");
  const body = encodeURIComponent("Hi Parsa, I'd like a custom chatbot like the demo embedded on your site. Here's what I need:");
  window.location.href = `mailto:parsapoosti@gmail.com?subject=${subj}&body=${body}`;
});

// smooth scroll
$$('a[href^="#"]').forEach(a=> a.addEventListener("click", e=>{
  const id = a.getAttribute("href"); const el = document.querySelector(id);
  if(el){ e.preventDefault(); el.scrollIntoView({behavior:"smooth", block:"start"}); }
}));

})(); 
// filler lines
// 1
// 2
// 3
// 4
// 5
// 6
// 7
// 8
// 9
// 10

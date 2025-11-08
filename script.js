
(function(){

const $ = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

const store = {
  get(k, d){ try{ return JSON.parse(localStorage.getItem(k)) ?? d }catch{ return d } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)) }
};

// ================== Theme system ==================
const root = document.documentElement;
const panel = $("#panel");
const openPanel = $("#open-panel");
const closePanel = $("#close-panel");
const themeSelect = $("#theme-select");
const accentInput = $("#accent");
const modeSelect = $("#mode");
const motionSelect = $("#motion");
const resetBtn = $("#reset");

const defaults = { theme: "neon", accent: "#10b981", mode: "dark", motion: "full" };
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

function updateSetting(key, val){
  settings[key] = val;
  store.set("ui-settings", settings);
  applySettings();
}

openPanel?.addEventListener("click", ()=>{ panel.classList.add("open"); openPanel.setAttribute("aria-expanded","true"); panel.setAttribute("aria-hidden","false"); });
closePanel?.addEventListener("click", ()=>{ panel.classList.remove("open"); openPanel.setAttribute("aria-expanded","false"); panel.setAttribute("aria-hidden","true"); });
themeSelect?.addEventListener("change", e=> updateSetting("theme", e.target.value));
accentInput?.addEventListener("input", e=> updateSetting("accent", e.target.value));
modeSelect?.addEventListener("change", e=> updateSetting("mode", e.target.value));
motionSelect?.addEventListener("change", e=> updateSetting("motion", e.target.value));
resetBtn?.addEventListener("click", ()=>{ settings = Object.assign({}, defaults); store.set("ui-settings", settings); applySettings(); });

applySettings();

// ================== Background flow field ==================
const bg = $("#bg");
const ctx = bg.getContext?.("2d");
let W=0, H=0, t=0;
function size(){
  W = bg.width = window.innerWidth * devicePixelRatio;
  H = bg.height = window.innerHeight * devicePixelRatio;
}
size(); window.addEventListener("resize", size);

const points = [];
function initPoints(n=500){
  points.length = 0;
  for(let i=0;i<n;i++) points.push({ x: Math.random()*W, y: Math.random()*H, l: Math.random()*1.5+0.5 });
}
initPoints(800);

let mouse = { x: -1e9, y: -1e9 };
window.addEventListener("mousemove", e=>{ mouse.x = e.clientX * devicePixelRatio; mouse.y = e.clientY * devicePixelRatio; });
window.addEventListener("mouseleave", ()=>{ mouse.x = -1e9; mouse.y = -1e9; });

function loop(){
  if(!ctx) return;
  t += 0.002;
  ctx.clearRect(0,0,W,H);
  ctx.globalAlpha = 0.9;
  for(const p of points){
    // flow field based on trig
    const a = Math.sin((p.x*0.002+t)*0.9) + Math.cos((p.y*0.002-t)*1.1);
    p.x += Math.cos(a)*p.l;
    p.y += Math.sin(a)*p.l;

    // mouse repel
    const dx = p.x - mouse.x, dy = p.y - mouse.y;
    const d = Math.hypot(dx,dy);
    if(d < 120*devicePixelRatio){ p.x += dx*0.06; p.y += dy*0.06; }

    // wrap
    if(p.x<0) p.x+=W; if(p.x>W) p.x-=W;
    if(p.y<0) p.y+=H; if(p.y>H) p.y-=H;

    // draw
    ctx.beginPath();
    ctx.arc(p.x,p.y,1.2,0,Math.PI*2);
    const g1 = getComputedStyle(root).getPropertyValue('--grad-1').trim();
    const g2 = getComputedStyle(root).getPropertyValue('--grad-2').trim();
    ctx.fillStyle = Math.random() < .5 ? g1 : g2;
    ctx.fill();
  }
  if(settings.motion === "full") requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ================== Typed effect ==================
const typed = $("#typed");
const roles = ["Backend APIs", "Automation", "Data tooling", "Performance", "Testing"];
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

// ================== Count-up stats ==================
$$(".num").forEach(el=>{
  const end = parseInt(el.dataset.count,10) || 0;
  let cur = 0;
  const step = Math.max(1, Math.floor(end/60));
  const id = setInterval(()=>{
    cur += step;
    if(cur>=end){ cur=end; clearInterval(id); }
    el.textContent = cur;
  }, 16);
});

// ================== Tilt effect ==================
function tilt(el){
  const rect = el.getBoundingClientRect();
  function onMove(e){
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const rx = (-dy/rect.height)*10;
    const ry = (dx/rect.width)*10;
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  }
  function onLeave(){
    el.style.transform = "";
  }
  el.addEventListener("mousemove", onMove);
  el.addEventListener("mouseleave", onLeave);
}
$$(".tilt").forEach(tilt);

// ================== Magnetic buttons ==================
$$(".magnetic").forEach(btn=>{
  btn.addEventListener("mousemove", e=>{
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width/2;
    const y = e.clientY - r.top - r.height/2;
    btn.style.transform = `translate(${x*0.08}px,${y*0.08}px)`;
    btn.style.boxShadow = `0 18px 40px rgba(0,0,0,0.25)`;
  });
  btn.addEventListener("mouseleave", ()=>{ btn.style.transform = ""; btn.style.boxShadow = ""; });
});

// ================== Filters ==================
const chips = $$(".chip");
chips.forEach(ch=> ch.addEventListener("click", ()=>{
  chips.forEach(c=>c.classList.remove("active"));
  ch.classList.add("active");
  const tag = ch.dataset.filter;
  $$("#project-grid .project").forEach(card=>{
    card.style.display = (tag==="all" || card.dataset.tags.includes(tag)) ? "" : "none";
  });
}));

// ================== GitHub repos ==================
async function loadRepos(){
  const grid = $("#repo-grid");
  if(!grid) return;
  grid.innerHTML = "<p class='muted'>Loading repos…</p>";
  try{
    const res = await fetch("https://api.github.com/users/parsij/repos?sort=updated&per_page=12");
    if(!res.ok) throw new Error("GitHub API error");
    const data = await res.json();
    grid.innerHTML = "";
    data.forEach(repo=>{
      if(repo.fork) return;
      const el = document.createElement("article");
      el.className = "card tilt";
      el.innerHTML = `
        <h3>${repo.name}</h3>
        <p>${repo.description || "No description provided."}</p>
        <div class="tags"><span>★ ${repo.stargazers_count}</span><span>⟳ ${repo.forks_count}</span><a class="btn ghost" href="${repo.html_url}" target="_blank" rel="noopener">Open</a></div>
      `;
      grid.appendChild(el);
      tilt(el);
    });
  }catch(err){
    console.error(err);
    grid.innerHTML = "<p class='muted'>Could not load repos.</p>";
  }
}
loadRepos();

// ================== Copy email ==================
$("#copy-email")?.addEventListener("click", async ()=>{
  try {
    await navigator.clipboard.writeText("parsapoosti@gmail.com");
    const b = $("#copy-email"); const prev = b.textContent; b.textContent = "Copied!";
    setTimeout(()=> b.textContent = prev, 1200);
  } catch { alert("parsapoosti@gmail.com"); }
});

// ================== Radar chart ==================
function radar(canvas, labels, values, max=10){
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const cx = w/2, cy = h/2 + 10;
  const r = Math.min(w,h)/2 - 26;
  ctx.clearRect(0,0,w,h);
  ctx.lineWidth = 1;

  const N = labels.length;
  // grid
  for(let ring=1; ring<=5; ring++) {
    ctx.beginPath();
    for(let i=0;i<N;i++) {
      const a = (Math.PI*2*i/N) - Math.PI/2;
      const rr = r*(ring/5);
      const x = cx + Math.cos(a)*rr;
      const y = cy + Math.sin(a)*rr;
      i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
    }
    ctx.closePath();
    ctx.strokeStyle = getComputedStyle(root).getPropertyValue('--line');
    ctx.stroke();
  }

  // axes + labels
  ctx.fillStyle = getComputedStyle(root).getPropertyValue('--muted');
  ctx.textAlign = "center"; ctx.font = "12px Outfit, sans-serif";
  for(let i=0;i<N;i++) {
    const a = (Math.PI*2*i/N) - Math.PI/2;
    const x = cx + Math.cos(a)*(r+10);
    const y = cy + Math.sin(a)*(r+10);
    ctx.beginPath();
    ctx.moveTo(cx,cy); ctx.lineTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r);
    ctx.strokeStyle = getComputedStyle(root).getPropertyValue('--line');
    ctx.stroke();
    ctx.fillText(labels[i], x, y);
  }

  // values polygon
  ctx.beginPath();
  for(let i=0;i<N;i++) {
    const a = (Math.PI*2*i/N) - Math.PI/2;
    const rr = r * (values[i]/max);
    const x = cx + Math.cos(a)*rr;
    const y = cy + Math.sin(a)*rr;
    i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
  }
  ctx.closePath();
  const g1 = getComputedStyle(root).getPropertyValue('--grad-1').trim();
  const g2 = getComputedStyle(root).getPropertyValue('--grad-2').trim();
  ctx.fillStyle = g1 + "33";
  ctx.strokeStyle = g2;
  ctx.lineWidth = 2;
  ctx.fill(); ctx.stroke();
}
const radarCanvas = $("#radar");
if(radarCanvas) radar(radarCanvas, ["Python","FastAPI","SQL","Testing","Docker","TypeScript"], [10,9,8,8,8,6]);

// ================== Confetti ==================
function confetti(x=window.innerWidth/2, y=window.innerHeight/2){
  const c = document.createElement("canvas");
  Object.assign(c.style, { position:"fixed", left:0, top:0, width:"100vw", height:"100vh", pointerEvents:"none", zIndex: 50 });
  document.body.appendChild(c);
  const cx = c.getContext("2d");
  c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio;
  const pieces = Array.from({length:160}, ()=>({
    x: (Math.random()*c.width), y: y*devicePixelRatio, vx: (Math.random()-.5)*6, vy: Math.random()*-6-4,
    w: Math.random()*6+2, h: Math.random()*8+4, r: Math.random()*Math.PI, a: 1
  }));
  const g1 = getComputedStyle(root).getPropertyValue('--grad-1').trim();
  const g2 = getComputedStyle(root).getPropertyValue('--grad-2').trim();
  function tick(){
    cx.clearRect(0,0,c.width,c.height);
    pieces.forEach(p=>{
      p.vy += 0.25; p.x += p.vx; p.y += p.vy; p.r += 0.1; p.a -= 0.007;
      cx.save(); cx.translate(p.x,p.y); cx.rotate(p.r);
      cx.fillStyle = Math.random()<.5 ? g1 : g2;
      cx.globalAlpha = Math.max(0,p.a);
      cx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
      cx.restore();
    });
    if(pieces.every(p=>p.a<=0 || p.y>c.height+40)) return c.remove();
    requestAnimationFrame(tick);
  }
  tick();
}
$$(".btn.primary").forEach(b=> b.addEventListener("click", e=> confetti(e.clientX, e.clientY)));

// ================== Smooth scroll ==================
$$('a[href^="#"]').forEach(a=> a.addEventListener("click", e=>{
  const id = a.getAttribute("href");
  const el = document.querySelector(id);
  if(el){ e.preventDefault(); el.scrollIntoView({behavior:"smooth", block:"start"}); }
}));

})(); 
// filler
// 1
// 2
// 3
// 4
// 5

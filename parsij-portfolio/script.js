
/* Interactive script for portfolio.
   Features:
   - Canvas particle background
   - Theme toggle with persistence
   - Typing effect for roles
   - Smooth scrolling
   - Intersection reveal animations
   - Project filters
   - GitHub repos fetch + render
   - Copy email to clipboard
   - Konami code easter egg
*/

(function(){
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  // ===== Theme toggle with localStorage =====
  const themeToggle = $("#theme-toggle");
  const root = document.documentElement;

  function applyTheme(mode){
    if(mode === "light"){
      root.classList.add("light");
      themeToggle?.setAttribute("aria-pressed", "true");
      document.querySelector('meta[name="theme-color"]').setAttribute('content', '#ffffff');
    }else{
      root.classList.remove("light");
      themeToggle?.setAttribute("aria-pressed", "false");
      document.querySelector('meta[name="theme-color"]').setAttribute('content', '#0ea5e9');
    }
  }

  const savedTheme = localStorage.getItem("theme");
  applyTheme(savedTheme || "dark");

  themeToggle?.addEventListener("click", () => {
    const next = root.classList.contains("light") ? "dark" : "light";
    localStorage.setItem("theme", next);
    applyTheme(next);
  });

  // ===== Canvas particles background =====
  const canvas = $("#bg-canvas");
  const ctx = canvas.getContext("2d");
  let W, H, particles = [];

  function resize(){
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  function makeParticles(n=80){
    particles = new Array(n).fill(0).map(()=>({
      x: Math.random()*W,
      y: Math.random()*H,
      vx: (Math.random()-0.5)*0.6,
      vy: (Math.random()-0.5)*0.6,
      r: Math.random()*2 + 0.6
    }));
  }
  makeParticles(110);

  function step(){
    ctx.clearRect(0,0,W,H);
    ctx.globalAlpha = 0.9;
    // draw and move
    for(const p of particles){
      p.x += p.vx;
      p.y += p.vy;
      if(p.x<0||p.x>W) p.vx*=-1;
      if(p.y<0||p.y>H) p.vy*=-1;

      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = "#0ea5e9";
      ctx.fill();

      // lines to neighbors
      for(const q of particles){
        const dx = p.x - q.x, dy = p.y - q.y;
        const d = Math.hypot(dx,dy);
        if(d<100){
          ctx.globalAlpha = (100-d)/100 * 0.25;
          ctx.beginPath();
          ctx.moveTo(p.x,p.y);
          ctx.lineTo(q.x,q.y);
          ctx.strokeStyle = "#8b5cf6";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);

  // ===== Typing effect =====
  const roles = ["Backend APIs", "Automation", "Data tooling", "Clean code"];
  const typed = $("#typed-roles");
  let roleIdx=0, charIdx=0, deleting=false, pause=0;

  function typeLoop(){
    if(!typed) return;
    if(pause>0){ pause--; requestAnimationFrame(typeLoop); return; }
    let current = roles[roleIdx];
    if(!deleting){
      charIdx++;
      if(charIdx>current.length){ deleting=true; pause=30; }
    }else{
      charIdx--;
      if(charIdx===0){ deleting=false; roleIdx=(roleIdx+1)%roles.length; }
    }
    typed.textContent = current.slice(0,charIdx);
    requestAnimationFrame(typeLoop);
  }
  typeLoop();

  // ===== Smooth scroll for anchor links =====
  $$(".nav a, .hero-ctas a, .section-head a").forEach(a=>{
    a.addEventListener("click", (e)=>{
      const href = a.getAttribute("href");
      if(href && href.startsWith("#")){
        e.preventDefault();
        document.querySelector(href)?.scrollIntoView({behavior:"smooth", block:"start"});
      }
    });
  });

  // ===== Intersection reveal =====
  const obs = new IntersectionObserver((entries)=>{
    for(const ent of entries){
      if(ent.isIntersecting){
        ent.target.style.transform = "translateY(0)";
        ent.target.style.opacity = "1";
        obs.unobserve(ent.target);
      }
    }
  }, {threshold: 0.08});
  $$(".section, .card, .skill-col").forEach(el=>{
    el.style.transform = "translateY(12px)";
    el.style.opacity = "0";
    el.style.transition = "all .6s ease";
    obs.observe(el);
  });

  // ===== Project filters =====
  const chips = $$(".chip");
  chips.forEach(ch=>{
    ch.addEventListener("click", ()=>{
      chips.forEach(c=>c.classList.remove("active"));
      ch.classList.add("active");
      const tag = ch.dataset.filter;
      $$("#project-grid .project").forEach(card=>{
        if(tag==="all" || card.dataset.tags.includes(tag)){
          card.style.display = "";
        }else{
          card.style.display = "none";
        }
      });
    });
  });

  // ===== GitHub repos fetch =====
  async function loadRepos(){
    const grid = $("#repo-grid");
    if(!grid) return;
    grid.innerHTML = "<p class='muted'>Loading repositories…</p>";
    try{
      const res = await fetch("https://api.github.com/users/%GITHUB%/repos?sort=updated&per_page=12".replace("%GITHUB%","parsij"));
      if(!res.ok) throw new Error("GitHub API error");
      const data = await res.json();
      grid.innerHTML = "";
      data.forEach(repo=>{
        if(repo.fork) return;
        const card = document.createElement("article");
        card.className = "card";
        card.innerHTML = `
          <div class="card-body">
            <h3>${repo.name}</h3>
            <p>${repo.description || "No description"}</p>
          </div>
          <footer class="card-foot">
            <span class="tag">★ ${repo.stargazers_count}</span>
            <span class="tag">⟳ ${repo.forks_count}</span>
            <a class="btn ghost" href="${repo.html_url}" target="_blank" rel="noopener">Open</a>
          </footer>
        `;
        grid.appendChild(card);
      });
    }catch(err){
      grid.innerHTML = "<p class='muted'>Could not load repos right now.</p>";
      console.error(err);
    }
  }
  loadRepos();

  // ===== Copy email =====
  $("#copy-email")?.addEventListener("click", async ()=>{
    try{
      await navigator.clipboard.writeText("parsapoosti@gmail.com");
      const btn = $("#copy-email");
      const prev = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(()=>btn.textContent = prev, 1400);
    }catch(e){
      alert("parsapoosti@gmail.com");
    }
  });

  // ===== Konami code easter egg =====
  const seq = [38,38,40,40,37,39,37,39,66,65];
  let idx=0;
  window.addEventListener("keydown", e=>{
    if(e.keyCode === seq[idx]){ idx++; } else { idx = e.keyCode===seq[0] ? 1 : 0; }
    if(idx===seq.length){
      idx=0;
      // toggle max particles for fun
      makeParticles(Math.min(particles.length+40, 220));
    }
  });

})();

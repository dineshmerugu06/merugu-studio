/* MERUGU STUDIO — interactions. Vanilla JS, no libraries. */
(function(){
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- toast ---------- */
  const toastEl = document.getElementById("toast");
  let toastT = null;
  function toast(msg){
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(()=>toastEl.classList.remove("show"), 2200);
  }

  /* ---------- cursor pill ---------- */
  const pill = document.getElementById("cursor-pill");
  let pillText = "", pillFun = false;
  addEventListener("pointermove", e=>{
    pill.style.left = e.clientX + "px";
    pill.style.top = e.clientY + "px";
  }, {passive:true});
  function setPill(text, fun){
    if(text === pillText) return;
    pillText = text; pillFun = !!fun;
    pill.textContent = text;
    pill.classList.toggle("show", !!text);
    pill.classList.toggle("fun", !!fun);
  }
  document.querySelectorAll("[data-cursor]").forEach(el=>{
    el.addEventListener("pointerenter", ()=>setPill(el.dataset.cursor, el.dataset.cursorFun === "1"));
    el.addEventListener("pointerleave", ()=>setPill(""));
  });

  /* ---------- drag engine ---------- */
  const draggables = [...document.querySelectorAll(".draggable")];
  const tidyBtn = document.getElementById("tidy");

  function makeDraggable(el, opts){
    opts = opts || {};
    let sx=0, sy=0, dx=0, dy=0, active=false, moved=false, holdT=null, lifted=false;
    const startLiftDelay = matchMedia("(pointer: coarse)").matches ? 220 : 0;

    el.addEventListener("pointerdown", e=>{
      if(reduced) return;
      if(e.button !== undefined && e.button !== 0) return;
      sx = e.clientX; sy = e.clientY;
      const m = /translate\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px\s*\)/.exec(el.style.transform || "");
      dx = m ? +m[1] : 0; dy = m ? +m[2] : 0;
      moved = false; lifted = false; active = true;
      el.classList.remove("tidy-anim");
      const begin = ()=>{
        if(!active) return;
        lifted = true;
        el.classList.add("dragging");
        el.setPointerCapture(e.pointerId);
        if(opts.onLift) opts.onLift();
      };
      if(startLiftDelay){ holdT = setTimeout(begin, startLiftDelay); }
      else begin();
      e.preventDefault();
    });

    el.addEventListener("pointermove", e=>{
      if(!active) return;
      const nx = dx + e.clientX - sx, ny = dy + e.clientY - sy;
      if(Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 6) moved = true;
      if(!lifted){ // desktop: lift immediately on move; touch waits for hold
        if(!startLiftDelay){ lifted = true; el.classList.add("dragging"); try{el.setPointerCapture(e.pointerId);}catch(_){} if(opts.onLift) opts.onLift(); }
        else return;
      }
      el.style.transform = `translate(${nx}px, ${ny}px) rotate(${el.dataset.r || 0}deg)`;
      if(opts.onDrag) opts.onDrag(e);
    });

    const end = e=>{
      if(!active) return;
      active = false;
      clearTimeout(holdT);
      el.classList.remove("dragging");
      if(opts.onDrop) opts.onDrop(moved);
      // tap (no drag) on a goto tile scrolls to its target
      if(!moved && el.dataset.goto){
        const t = document.querySelector(el.dataset.goto);
        if(t) t.scrollIntoView({behavior: reduced ? "auto" : "smooth"});
      }
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }

  // keep each tile's base rotation so drags compose with it
  draggables.forEach(el=>{
    const r = getComputedStyle(el).getPropertyValue("--r").trim();
    el.dataset.r = r ? parseFloat(r) : 0;
    if(el.dataset.r) el.style.transform = `rotate(${el.dataset.r}deg)`;
    makeDraggable(el, {
      onDrag: e=>{ if(el.id === "hero-word") setPill("WHEEE", true); },
      onDrop: moved=>{ setPill(""); }
    });
  });

  // hero word annotation swap
  const heroWord = document.getElementById("hero-word");
  const heroNote = document.getElementById("hero-note");
  let heroDragged = false;
  if(heroWord){
    // swap note on first real drag (pointermove while dragging)
    heroWord.addEventListener("pointermove", e=>{
      if(e.buttons && !heroDragged && !reduced){
        heroDragged = true;
        heroNote.textContent = "SEE? TOLD YOU.";
        heroNote.style.color = "var(--tang)";
      }
    });
  }

  // tidy up
  tidyBtn.addEventListener("click", ()=>{
    draggables.forEach(el=>{
      el.classList.add("tidy-anim");
      el.style.transform = el.dataset.r && +el.dataset.r ? `rotate(${el.dataset.r}deg)` : "";
    });
    toast("Tidied. Looking sharp.");
    setTimeout(()=>draggables.forEach(el=>el.classList.remove("tidy-anim")), 750);
  });

  /* ---------- slingshot ---------- */
  const stage = document.getElementById("sling-stage");
  const star = document.getElementById("sling-star");
  const tag = document.getElementById("sling-tag");
  const counter = document.getElementById("launch-count");
  let launched = 0;
  if(stage && star && !reduced){
    const AX = 90, AY = 170;           // anchor
    let px = AX, py = AY, vx = 0, vy = 0, flying = false, raf = null;
    const MAXPULL = 130;

    function place(){
      star.style.left = (px - 55) + "px";
      star.style.top = (py - 55) + "px";
      tag.style.left = (px + 52) + "px";
      tag.style.top = (py - 66) + "px";
    }
    place();

    let pulling = false, ox = 0, oy = 0;
    star.addEventListener("pointerdown", e=>{
      if(flying) return;
      pulling = true;
      ox = e.clientX - px; oy = e.clientY - py;
      star.setPointerCapture(e.pointerId);
      star.style.cursor = "grabbing";
      cancelAnimationFrame(raf);
      e.preventDefault();
    });
    star.addEventListener("pointermove", e=>{
      if(!pulling) return;
      let nx = e.clientX - ox, ny = e.clientY - oy;
      const dxn = nx - AX, dyn = ny - AY;
      const d = Math.hypot(dxn, dyn);
      if(d > MAXPULL){ nx = AX + dxn/d*MAXPULL; ny = AY + dyn/d*MAXPULL; }
      px = nx; py = ny; place();
      tag.textContent = d > 24 ? "LET GO!" : "PULL BACK";
    });
    const release = ()=>{
      if(!pulling) return;
      pulling = false;
      star.style.cursor = "grab";
      const dxn = AX - px, dyn = AY - py;
      if(Math.hypot(dxn, dyn) < 24){ px = AX; py = AY; place(); tag.textContent = "PULL BACK"; return; }
      vx = dxn * 0.16; vy = dyn * 0.16 - 2;
      flying = true;
      launched++;
      counter.textContent = launched;
      toast("Launched. That's " + launched + ".");
      tag.textContent = "WHEEE";
      const floor = stage.clientHeight - 44 - 100;
      const step = ()=>{
        vy += 0.45; px += vx; py += vy;
        if(py > floor){ py = floor; vy *= -0.55; vx *= 0.82; }
        if(px < 0){ px = 0; vx *= -0.7; }
        if(px > stage.clientWidth - 110){ px = stage.clientWidth - 110; vx *= -0.7; }
        place();
        if(Math.abs(vy) < 0.6 && py >= floor && Math.abs(vx) < 0.6){
          flying = false; tag.textContent = "AGAIN?";
          setTimeout(()=>{ if(!flying && !pulling){ px = AX; py = AY; place(); tag.textContent = "PULL BACK"; } }, 1200);
          return;
        }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    star.addEventListener("pointerup", release);
    star.addEventListener("pointercancel", release);
  }

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } });
  }, {threshold: 0.12});
  document.querySelectorAll(".rv").forEach(el=>io.observe(el));

  /* ---------- active nav link ---------- */
  const links = [...document.querySelectorAll(".nav-links a")];
  const secs = links.map(a=>document.querySelector(a.getAttribute("href"))).filter(Boolean);
  const nio = new IntersectionObserver(es=>{
    es.forEach(e=>{
      if(e.isIntersecting){
        links.forEach(a=>a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
      }
    });
  }, {rootMargin: "-40% 0px -55% 0px"});
  secs.forEach(s=>nio.observe(s));

  /* ---------- spin badge: shuffle wall ---------- */
  const badge = document.getElementById("spin-badge");
  badge.addEventListener("click", ()=>{
    if(reduced) return;
    const tiles = [...document.querySelectorAll(".wall .draggable")];
    tiles.forEach(t=>{
      const x = (Math.random()-0.5) * 120, y = (Math.random()-0.5) * 90;
      const r = (Math.random()-0.5) * 10;
      t.classList.add("tidy-anim");
      t.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg)`;
    });
    const pick = tiles[Math.floor(Math.random()*tiles.length)];
    toast("My gut picked: " + (pick.dataset.name || "this one") + ".");
    setTimeout(()=>tiles.forEach(t=>t.classList.remove("tidy-anim")), 750);
  });
})();

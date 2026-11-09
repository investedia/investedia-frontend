/* Investedia animated mark: the orange line is drawn left to right and the charcoal area below follows its tip.
   One eased progress value drives both, so the fill can never lead the line.
   Usage:  InvLogoAnim.mount(el, { loop: false })          production: plays once
           InvLogoAnim.mount(el, { loop: true })           demo: plays, holds, restarts
   Options: duration, delay, hold (seconds), loop, colors { orange, orangeHi, bg, charcoal }, onDone.
   Dev: instance.seek(seconds) shows an exact frame; instance.play() restarts. */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  // Geometry of the existing mark (assets/favicon.svg, viewBox 40x40)
  const LINE = 'M0 28 11 21.5l7 4.5 10-10 12 6.5', AREA = 'M0 31 11 24.5l7 4.5 10-10 12 6.5V40H0z';
  const PTS = [[0, 28], [11, 21.5], [18, 26], [28, 16], [40, 22.5]];
  const SEG = PTS.slice(1).map((p, i) => Math.hypot(p[0] - PTS[i][0], p[1] - PTS[i][1])), LEN = SEG.reduce((a, b) => a + b, 0);
  // x position of the line's tip for a given fraction of its length
  const tipAt = s => { let d = s * LEN; for (let i = 0; i < SEG.length; i++) { if (d <= SEG[i] || i === SEG.length - 1) { const t = Math.min(1, d / SEG[i]); return [PTS[i][0] + (PTS[i + 1][0] - PTS[i][0]) * t, PTS[i][1] + (PTS[i + 1][1] - PTS[i][1]) * t]; } d -= SEG[i]; } };
  // cubic-bezier easing (CSS-style), solved with Newton steps
  const bez = (x1, y1, x2, y2) => { const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by; const X = t => ((ax * t + bx) * t + cx) * t, Y = t => ((ay * t + by) * t + cy) * t, dX = t => (3 * ax * t + 2 * bx) * t + cx;
    return x => { if (x <= 0) return 0; if (x >= 1) return 1; let t = x; for (let i = 0; i < 8; i++) { const e = X(t) - x; if (Math.abs(e) < 1e-6) break; const d = dX(t); if (Math.abs(d) < 1e-6) break; t -= e / d; } return Y(t); }; };
  const ease = bez(.5, .02, .18, 1); // slow, confident start; long soft landing
  const cssNum = (cs, name, fallback) => { const v = cs.getPropertyValue(name).trim(); if (!v) return fallback; return v.endsWith('ms') ? parseFloat(v) / 1000 : parseFloat(v); };
  let uid = 0;

  function mount(host, opts = {}) {
    const cs = getComputedStyle(host), id = 'ila' + (++uid);
    const o = { duration: opts.duration ?? cssNum(cs, '--ila-duration', 1.7), delay: opts.delay ?? cssNum(cs, '--ila-delay', .15), hold: opts.hold ?? cssNum(cs, '--ila-hold', .35), loop: !!opts.loop, onDone: opts.onDone };
    const col = Object.assign({}, opts.colors);
    host.classList.add('ila');
    const c = (k, v) => col[k] || `var(--ila-${v})`;
    host.innerHTML = `<svg xmlns="${NS}" viewBox="0 0 40 40" role="img" aria-label="Investedia">
      <defs><clipPath id="${id}-r"><rect width="40" height="40" rx="8"/></clipPath><clipPath id="${id}-f"><rect class="ila-reveal" x="0" y="0" width="0" height="40"/></clipPath></defs>
      <rect width="40" height="40" rx="8" fill="${c('bg', 'bg')}"/>
      <g clip-path="url(#${id}-r)">
        <g clip-path="url(#${id}-f)"><path d="${AREA}" fill="${c('charcoal', 'charcoal')}"/></g>
        <path class="ila-line" d="${LINE}" fill="none" stroke="${c('orange', 'orange')}" stroke-width="4" stroke-linejoin="round" stroke-dasharray="${LEN} ${LEN + 1}" stroke-dashoffset="${LEN}"/>
        <path class="ila-head" d="${LINE}" fill="none" stroke="${c('orangeHi', 'orange-hi')}" stroke-width="4" stroke-linejoin="round" stroke-dasharray="0 ${LEN + 1}" stroke-dashoffset="0"/>
        <path class="ila-head ila-head2" d="${LINE}" fill="none" stroke="${c('orangeHi', 'orange-hi')}" stroke-width="4" stroke-linejoin="round" stroke-dasharray="0 ${LEN + 1}" stroke-dashoffset="0"/>
      </g></svg>`;
    const line = host.querySelector('.ila-line'), heads = [...host.querySelectorAll('.ila-head')], reveal = host.querySelector('.ila-reveal');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0, t0 = 0, done = false;

    const draw = p => { // p: 0..1 progress along the line
      const s = ease(p), [x] = tipAt(s);
      line.style.strokeDashoffset = (LEN * (1 - s)).toFixed(3);
      reveal.setAttribute('width', (p >= 1 ? 40 : Math.max(0, x - .35)).toFixed(3)); // the fill edge stays just behind the tip of the line
      // leading edge: the last ~2.4 units of the line are a touch brighter, fading out as it lands
      const fade = p < .72 ? 1 : Math.max(0, 1 - (p - .72) / .26); // soft two-step glow on the last few units of the line, gone before it lands
      [[4.2, .14], [1.9, .16]].forEach(([len, a], i) => { const tail = Math.min(len, s * LEN); heads[i].style.strokeDasharray = `${tail.toFixed(3)} ${LEN + 1}`; heads[i].style.strokeDashoffset = (tail - s * LEN).toFixed(3); heads[i].style.opacity = (p > 0 && p < 1 ? a * fade : 0).toFixed(3); });
    };
    const final = () => { draw(1); done = true; };
    const frame = now => {
      const t = (now - t0) / 1000 - o.delay, p = t / o.duration;
      if (p < 1) { draw(Math.max(0, p)); raf = requestAnimationFrame(frame); return; }
      final(); o.onDone?.();
      if (o.loop) raf = setTimeout(() => api.play(), o.hold * 1000);
    };
    const api = {
      play() { cancelAnimationFrame(raf); clearTimeout(raf); done = false; if (reduced.matches) { host.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160 }); final(); o.onDone?.(); return; } draw(0); t0 = performance.now(); raf = requestAnimationFrame(frame); },
      seek(sec) { cancelAnimationFrame(raf); clearTimeout(raf); draw(Math.min(1, Math.max(0, (sec - o.delay) / o.duration))); },
      stop() { cancelAnimationFrame(raf); clearTimeout(raf); final(); },
      get total() { return o.delay + o.duration + (o.loop ? o.hold : 0); }, options: o
    };
    host.logoAnim = api; api.play(); return api;
  }
  window.InvLogoAnim = { mount, ease, tipAt };
})();

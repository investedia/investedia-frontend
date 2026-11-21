// Satellite Earth (owner 20 Nov 2026): renders the globe surface with WebGL from NASA imagery, then the 2D canvas draws
// borders, markers and connections on top exactly as before.
// - Day: NASA Blue Marble Next Generation (GIBS), toned down to Investedia's dark look.
// - Night: NASA Black Marble 2016 city lights, only on the night side, from the real-time sun position.
// - Sharpness: drawn at the screen's real pixel density (up to 3x), mipmapped textures with anisotropic filtering, 4K first then 8K.
// - Fallback: no WebGL, a texture that fails, or a slow device keeps the previous 2D globe (EarthGL.ready stays false).
(() => {
  const BASE = (document.currentScript && document.currentScript.dataset.tex) || '/assets/globe/earth/';
  const cv = document.createElement('canvas');
  const gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true });
  const E = window.EarthGL = { ready: false, tier: 0, dpr: 1, ms: 0 };
  if (!gl) return;
  cv.addEventListener('webglcontextlost', e => { e.preventDefault(); E.ready = false; E.lost = true; });  // iPhone can drop the GPU context under memory pressure: fall back to the 2D globe instead of a blank one
  const big = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 16384);
  const phone = matchMedia('(max-width: 760px)').matches || /iPhone|Android.+Mobile/.test(navigator.userAgent);
  const wantTier = big >= 8192 && !phone ? 8 : 4;  // phones: 4K (about 1.3 MB); desktops: 4K first, then 8K (about 4.4 MB)
  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const DER = !!gl.getExtension('OES_standard_derivatives');
  const FS = (DER ? '#extension GL_OES_standard_derivatives : enable\n#define DER 1\n' : '') + `precision highp float;
uniform sampler2D dayT,nightT,dDay,dRel,dNight,dImp;uniform vec2 res;uniform vec3 g;uniform vec2 rot;uniform vec3 sun;uniform float dpr;
uniform vec4 dbb;uniform float dk;uniform float lt;   // Phase 1 regional detail: bounding box (lon0,lat0,lon1,lat1 in radians) and fade-in
const float PI=3.14159265;
#ifndef LT0
#define LT0 .44
#define LT1 .30
#define LSEA .66,.68,.71
#endif
void main(){
  vec2 px=vec2(gl_FragCoord.x,res.y-gl_FragCoord.y)/dpr;
  vec2 d=(px-g.xy)/g.z; float r2=dot(d,d); if(r2>1.){gl_FragColor=vec4(0.);return;}
  float X=d.x,Y=-d.y,Zd=sqrt(1.-r2),c0=cos(rot.y),s0=sin(rot.y);
  float sp=c0*Y+s0*Zd, phi=asin(clamp(sp,-1.,1.)), cpcd=-s0*Y+c0*Zd, lam=rot.x+atan(X,cpcd);
  float ua=(lam+PI)/(2.*PI);
  #ifdef DER
  float u1=fract(ua), u2=fract(ua+.5)-.5; ua = fwidth(u1) <= fwidth(u2)+1e-6 ? u1 : u2;  // pick the copy of x with no jump here: no seam at 180° or over the poles
  #endif
  vec2 uv=vec2(ua,(PI*.5-phi)/PI);  // no fract(): textures repeat, and fract's jump at 180° made a visible line (wrong mipmap) down the Pacific
  // Investedia grade (owner 20 Nov 2026): satellite detail, black-and-orange identity. No blue oceans, no green land.
  vec3 day=texture2D(dayT,uv).rgb; float gl0=dot(day,vec3(.299,.587,.114)); float sea=smoothstep(.02,.09,day.b-day.r)*(1.-smoothstep(.28,.45,gl0));  // ocean from the global image: flat, no tile blocks
  // Phase 1 (owner 21 Nov 2026): when zoomed in, a sharper NASA image of just the area on screen replaces the global one, faded at its edges
  float lw=lam; if(lw<dbb.x-PI) lw+=2.*PI; if(lw>dbb.z+PI) lw-=2.*PI;
  vec2 duv=vec2((lw-dbb.x)/(dbb.z-dbb.x),(dbb.w-phi)/(dbb.w-dbb.y));
  float inD=dk*smoothstep(0.,.04,min(duv.x,1.-duv.x))*smoothstep(0.,.04,min(duv.y,1.-duv.y));
  if(inD>0.){ vec4 dd=texture2D(dDay,duv); day=mix(day,dd.rgb,inD*(1.-sea)*dd.a); }  // .a = this tile has arrived (else the global image shows: no black gaps)
  float lum=dot(day,vec3(.299,.587,.114));
  // (sea computed above)  // full-strength ocean mask so zoomed-in and global oceans match  // Blue Marble oceans are dark blue: detect them
  float tone=.06+.17*pow(smoothstep(.04,.8,lum),.85);  /* softer contrast (deserts calmer) */                                // monochrome: charcoal to cool grey, terrain kept as light/dark texture (owner 20 Nov 2026: no sepia)
  vec3 nat=day/max(lum,.04);                                                 // the real colour of this spot, without its brightness
  vec3 base=vec3(tone)*vec3(1.,.995,.985);  // owner 21 Nov 2026: no colour (no green), neutral grey              // owner 20 Nov 2026: dark neutral land with a trace of natural colour and warmth (not sepia, not flat grey)
  vec4 rr4=inD>0.?texture2D(dRel,duv):vec4(.5,.5,.5,0.); float rel=mix(.5,rr4.r,rr4.a);                                  // NASA ASTER elevation relief (light from the north-west)
  // relief (owner 21 Nov 2026): directional light from the north-west; lit slopes a touch warm, shaded slopes cool and deep; flat land stays calm
  float sh=rel-.5, mtn=smoothstep(.03,.2,abs(sh));
  vec3 relk=vec3(1.)+vec3(1.25,1.18,1.08)*max(sh,0.)*1.6*mtn+vec3(1.0,1.04,1.12)*min(sh,0.)*1.75*mtn;
  base*=mix(vec3(1.),max(relk,vec3(.18)),inD*(1.-sea));
  // built-up areas (owner 21 Nov 2026): NASA/Landsat man-made impervious surface, 30 m (light blue = sparse ... dark blue = dense)
  vec4 im=inD>0.?texture2D(dImp,duv):vec4(0.); float dens=im.a*clamp(1.15-im.r*1.35,.22,1.);   // rural 0 · suburban ~.3 · urban core ~1
  base=mix(base,(vec3(.2,.192,.178)+vec3(.26,.24,.205)*dens*dens)*(.85+.3*lum/max(.1,lum+.05)),smoothstep(.0,.1,dens)*inD*(1.-sea));  // stronger: city cores clearly lighter than suburbs, suburbs than countryside; Landsat texture kept inside  // denser = lighter warm grey; roads and urban fabric appear
  if(false){ vec3 g0=texture2D(dayT,uv).rgb; float l0=dot(g0,vec3(.299,.587,.114));      // global sea mask too: Landsat has no data / grey water offshore
    sea=max(sea,max(smoothstep(.04,.16,g0.b-g0.r)*(1.-smoothstep(.28,.45,l0))*smoothstep(.0,.03,.06-im.a),inD*(1.-smoothstep(.0,.03,lum)))); }
  base=mix(base,vec3(.038,.038,.048),sea);                                   // oceans almost black
  float cp=cos(phi), sdot=sin(phi)*sun.z+cp*cos(lam-sun.x)*sun.y;          // cos(angle to the sun)
  float dayk=smoothstep(-.07,.16,sdot);
  vec3 col=base*mix(.22,1.15,dayk)*mix(.8,1.,Zd);                        // owner 20 Nov 2026 (B): clear day/night
  col+=vec3(.05,.045,.04)*smoothstep(.12,0.,abs(sdot))*.6;                 // soft dusk edge
  float L=texture2D(nightT,uv).r; L=pow(max(0.,(L-.09)/.91),1.25);
  float core=smoothstep(.15,.85,L);
  vec4 nd4=texture2D(dNight,duv); if(inD>0.&&nd4.a>0.){ float x=max(0.,(nd4.r-.4)/.6), x3=pow(x,1.6); float Ld=.4*x3/(x3+.3);  /* owner 21 Nov 2026: calmer zoomed-in lights, only real built-up cores */   // compressed highs: no white hotspots, detail kept
    L=mix(L,Ld,inD*nd4.a); core=mix(core,smoothstep(.5,1.,x),inD*nd4.a); }                                        // only the densest cores turn warm white  // NASA VIIRS 500 m metro lights (calmer curve: this layer is brighter)         // city lights only (drops Black Marble's faint ground)
  col+=mix(vec3(1.,.6,.26),vec3(1.,.9,.76),core)*L*1.55*(1.-dayk);  // real night lights: amber/soft orange in the fainter areas, warm white in the brightest cores                                 // tiny ivory points, very little amber; orange stays for data
  if(lt>.5){  // light theme (owner 21 Nov 2026): soft grey-blue oceans, light warm-grey land with the same terrain, gentle night side, faint lights
    float t2=LT0+LT1*smoothstep(.03,.75,lum); vec3 land=vec3(t2)*vec3(1.,.995,.985);
    vec3 lc=mix(land,vec3(LSEA),sea); lc*=mix(1.,.58+.84*rel,inD*(1.-sea)); lc=mix(lc,vec3(.50,.49,.47)+vec3(.1)*(1.-dens),smoothstep(.32,.75,dens)*inD*.85*(1.-sea));  /* light mode: built-up areas as concrete grey, denser = darker (owner 21 Nov 2026) */
    col=lc*mix(.72,1.,dayk)*mix(.9,1.,Zd)+mix(vec3(1.,.6,.26),vec3(1.,.85,.6),core)*L*.5*(1.-dayk); }
  float edge=smoothstep(1.,1.-2.2/(g.z*dpr),sqrt(r2));                     // 1-2 device pixel antialiased rim
  gl_FragColor=vec4(col*edge,edge);
}`;
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(o); return o; };
  let pr; try { pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); } catch (e) { return; }
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const ap = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n), u = { res: U('res'), g: U('g'), rot: U('rot'), sun: U('sun'), dpr: U('dpr'), dbb: U('dbb'), dk: U('dk'), lt: U('lt') };
  gl.uniform1i(U('dayT'), 0); gl.uniform1i(U('nightT'), 1); gl.uniform1i(U('dDay'), 2); gl.uniform1i(U('dRel'), 3); gl.uniform1i(U('dNight'), 4); gl.uniform1i(U('dImp'), 5);
  const aniso = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
  const tex = [gl.createTexture(), gl.createTexture()], have = [0, 0];
  const upload = (i, img, tier) => {
    gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tex[i]);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, i ? gl.LUMINANCE : gl.RGB, i ? gl.LUMINANCE : gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    (E.gimg = E.gimg || [])[i] = img; have[i] = tier; E.tier = Math.min(have[0], have[1]); E.ready = have[0] > 0 && have[1] > 0;
  };
  const load = tier => ['day', 'night'].forEach((k, i) => { const img = new Image(); img.decoding = 'async'; img.crossOrigin = 'anonymous';
    img.onload = () => { if (have[i] < tier) upload(i, img, tier); if (tier === 4 && wantTier === 8 && E.ready && !load.hi) { load.hi = 1; setTimeout(() => load(8), 400); } };
    img.src = `${BASE}earth-${k}-${tier}k.jpg`; });
  load(4);
  /* Owner 21 Nov 2026: sharper city lights from the start. Phones also get the 8K night image (lights only, light on memory);
     big desktops get a 16K night image. Both come from NASA VIIRS Black Marble, the same source as the zoom tiles. */
  const night = tier => { const img = new Image(); img.decoding = 'async'; img.crossOrigin = 'anonymous';
    img.onload = () => { if (have[1] < tier) upload(1, img, tier); if (tier === 8 && big >= 16384 && !phone && (navigator.deviceMemory || 8) >= 8) setTimeout(() => night(16), 600); };
    img.src = `${BASE}earth-night-${tier}k.jpg`; };
  const nightWait = () => E.ready ? setTimeout(() => night(big >= 8192 ? 8 : 4), wantTier === 8 ? 1500 : 300) : setTimeout(nightWait, 250);
  if (big >= 8192) nightWait();
  // Phase 1 regional detail (owner 21 Nov 2026). Regional and metro level only: the request never asks for finer than 500 m per pixel
  // (the night-light source resolution), so close zoom stays soft and honest instead of blocky. Source: NASA GIBS (public domain).
  // Fast loading (owner 21 Nov 2026): NASA's pre-made WMTS tiles (served from NASA's CDN, ~0.3 s each, all in parallel) instead of
  // WMS images rendered on request (1-3 s). Tiles are fetched while zooming (throttled, not only after the camera stops), painted into
  // one canvas per layer as they arrive, and the sharp view swaps in as soon as most of it is ready. The busiest news cities are preloaded.
  const NASA = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/';
  /* Owner 21 Nov 2026: tiles come through our own Cloudflare cache (investedia.com/gibs/...), NASA directly as fallback */
  const WMTS = /(^|\.)investedia\.com$/.test(location.hostname) ? '/gibs/' : NASA;
  const LAY = [  // [name, time, matrix set, ext, max level]
    ['Landsat_WELD_CorrectedReflectance_TrueColor_Global_Annual', '2000-12-01', '31.25m', 'jpg', 10],
    ['ASTER_GDEM_Greyscale_Shaded_Relief', 'default', '31.25m', 'jpg', 10],
    ['VIIRS_Black_Marble', '2012-01-01', '500m', 'png', 6],
    ['Landsat_Global_Man-made_Impervious_Surface', '2000-12-01', '31.25m', 'png', 10]];
  const BM = ['BlueMarble_NextGeneration', 'default', '500m', 'jpeg', 6];  // day layer when the view is wider than Landsat makes sense
  const tdeg = z => 288 / 2 ** z;  // degrees covered by one 512 px tile at level z (GIBS EPSG:4326 grid)
  const turl = (L, z, row, col) => `${WMTS}${L[0]}/default/${L[1]}/${L[2]}/${z}/${row}/${col}.${L[3]}`;
  const dtex = [gl.createTexture(), gl.createTexture(), gl.createTexture(), gl.createTexture()];
  const D = E.detail = { bb: null, deg: 999, fade: 0, want: 0, timer: 0, key: '', last: 0, set: null, z: 0 };
  const setTex = (i, src) => { gl.activeTexture(gl.TEXTURE2 + i); gl.bindTexture(gl.TEXTURE_2D, dtex[i]); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    const f = gl.RGBA; gl.texImage2D(gl.TEXTURE_2D, 0, f, f, gl.UNSIGNED_BYTE, src);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); };
  const MAXC = phone ? 2048 : 4096;
  const request = (bb, zDay) => {
    const key = bb.join() + '|' + zDay; if (key === D.key) return; D.key = key; D.last = performance.now();
    const wide = bb[2] - bb[0] > 25, layers = LAY.map((L, i) => i === 0 && wide ? BM : L);
    const set = { bb, zDay, layers: [], loaded: 0, total: 0, swapped: false, t0: performance.now() };
    layers.forEach((L, i) => {
      const z = Math.min(L[4], i === 2 || L === BM ? Math.min(6, zDay) : zDay), d = tdeg(z);
      const c0 = Math.floor((bb[0] + 180) / d), c1 = Math.floor((bb[2] + 180 - 1e-9) / d), r0 = Math.floor((90 - bb[3]) / d), r1 = Math.floor((90 - bb[1] - 1e-9) / d);
      const ppd = Math.min(512 / d, MAXC / (bb[2] - bb[0]), MAXC / (bb[3] - bb[1]));  // canvas pixels per degree (capped)
      const cv2 = document.createElement('canvas'); cv2.width = Math.max(1, Math.round((bb[2] - bb[0]) * ppd)); cv2.height = Math.max(1, Math.round((bb[3] - bb[1]) * ppd));
      const g = cv2.getContext('2d'), lay = { cv: cv2, dirty: false };
      set.layers[i] = lay;
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        if (r < 0 || c < 0 || c >= 360 / d || r >= Math.ceil(180 / d)) continue;
        set.total++; const im = new Image(); im.crossOrigin = 'anonymous'; im.decoding = 'async';
        im.onload = () => { if (D.set !== set) return; const lon = c * d - 180, lat = 90 - r * d;
          g.drawImage(im, (lon - bb[0]) * ppd, (bb[3] - lat) * ppd, d * ppd, d * ppd); lay.dirty = true; set.loaded++; };
        im.onerror = () => { if (im.src.indexOf(NASA) < 0 && WMTS !== NASA) { im.src = NASA + im.src.split('/gibs/')[1]; return; } if (D.set === set) set.loaded++; };
        im.src = turl(L, z, r, c);
      }
    });
    D.set = set;
  };
  const tick = () => {  // called every frame: swap in the new view when most tiles are in, then keep updating it as the rest arrive
    const s = D.set; if (!s) return;
    if (!s.swapped && s.loaded > 0  /* owner 21 Nov 2026: show tiles as soon as they arrive; missing ones show the global image underneath (alpha) */) {
      s.swapped = true; D.tSharp = performance.now(); const had = !!D.bb; s.layers.forEach((l, i) => { setTex(i, l.cv); l.dirty = false; }); D.bb = s.bb; D.deg = s.bb[2] - s.bb[0]; D.z = s.zDay; if (!had) D.fade = 0;
    } else if (s.swapped && performance.now() - (s.tu || 0) > 120) { s.tu = performance.now(); s.layers.forEach((l, i) => { if (l.dirty) { setTex(i, l.cv); l.dirty = false; } }); }  // re-upload at most ~8 times a second
  };
  /* Owner 21 Nov 2026 (load ahead): once a view has loaded, quietly fetch the next, sharper level for the middle of the screen
     (day + city lights) so zooming in further is instant from the browser cache. At most 24 tiles, only when the tab is visible. */
  const ahead = (bb, zDay) => {
    if (document.hidden || zDay >= (phone ? 9 : 10)) return;
    const cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2, hx = (bb[2] - bb[0]) / 4, hy = (bb[3] - bb[1]) / 4, wide = bb[2] - bb[0] > 25;
    let n = 0;
    [[wide ? BM : LAY[0], Math.min(wide ? 6 : 10, zDay + 1)], [LAY[2], Math.min(6, zDay + 1)]].forEach(([L, z]) => {
      const d = tdeg(z), c0 = Math.floor((cx - hx + 180) / d), c1 = Math.floor((cx + hx + 180) / d), r0 = Math.floor((90 - cy - hy) / d), r1 = Math.floor((90 - cy + hy) / d);
      for (let r = Math.max(0, r0); r <= r1; r++) for (let c = Math.max(0, c0); c <= c1; c++) { if (n++ >= 24) return; const im = new Image(); im.crossOrigin = 'anonymous'; im.src = turl(L, z, r, c); }
    });
  };
  const plan = (W, H, R, lon0, lat0) => {
    const rad = Math.asin(Math.min(1, Math.max(W, H) * .5 / R)) * 180 / Math.PI;  // angular radius of what is on screen
    D.want = Math.max(0, Math.min(1, (58 - rad) / 20));                               // fades in from ~58° to ~38° on screen (country-level zoom); full Earth unchanged
    if (D.want <= 0) return;
    const half = Math.min(60, rad * 1.15), la0 = Math.max(-84, lat0 - half), la1 = Math.min(84, lat0 + half), cl = Math.max(.2, Math.cos(lat0 * Math.PI / 180));
    const hw = Math.min(170, half / cl), bb = [lon0 - hw, la0, lon0 + hw, la1];
    if (bb[0] < -180 || bb[2] > 180) { const s = bb[0] < -180 ? -180 - bb[0] : 180 - bb[2]; bb[0] += s; bb[2] += s; }  // keep inside the map
    // level so one tile pixel is about one screen pixel (never finer than Landsat level 10, ~30-60 m)
    const degPerPx = (bb[3] - bb[1]) / (H * Math.min(2, devicePixelRatio || 1)), zDay = Math.max(2, Math.min(phone ? 9 : 10, Math.ceil(Math.log2(288 / 512 / degPerPx))));
    const cur = D.set ? D.set.bb : null, inside = cur && bb[0] >= cur[0] && bb[2] <= cur[2] && bb[1] >= cur[1] && bb[3] <= cur[3] && (bb[2] - bb[0]) > (cur[2] - cur[0]) * .45 && D.set.zDay >= zDay;
    if (inside) return;
    const snap = tdeg(zDay), sb = [Math.floor(bb[0] / snap) * snap, Math.floor(bb[1] / snap) * snap, Math.ceil(bb[2] / snap) * snap, Math.ceil(bb[3] / snap) * snap].map(v => +v.toFixed(5));
    const go = () => { request(sb, zDay); clearTimeout(D.pre); D.pre = setTimeout(() => ahead(sb, zDay), 450); };
    /* Owner 21 Nov 2026 (smoother zoom): wait until the camera rests for 0.14 s before swapping in new detail, so tiles do not
       change mid-gesture; a long zoom still refreshes at least every 0.7 s */
    clearTimeout(D.timer); if (performance.now() - D.last > 700) go(); else D.timer = setTimeout(go, 140);
  };
  // preload the busiest news places at the level a full zoom would use, so zooming there is instant (from the browser cache)
  const preload = () => {
    const st = window.stories || (typeof stories !== 'undefined' ? stories : null); if (!Array.isArray(st) || !st.length) return setTimeout(preload, 3000);
    const n = {}; for (const s of st) { const l = s.location; if (l && isFinite(l.lat) && isFinite(l.lon)) { const k = Math.round(l.lat) + ',' + Math.round(l.lon); (n[k] = n[k] || { lat: l.lat, lon: l.lon, c: 0 }).c++; } }
    const top = Object.values(n).sort((a, b) => b.c - a.c).slice(0, phone ? 5 : 10), z = phone ? 8 : 9, d = tdeg(z), zn = 6, dn = tdeg(zn);
    let i = 0; const next = () => { const p = top[i++]; if (!p) return;
      const r = Math.floor((90 - p.lat) / d), c = Math.floor((p.lon + 180) / d);
      [0, 1, 3].forEach(k => { const im = new Image(); im.crossOrigin = 'anonymous'; im.src = turl(LAY[k], z, r, c); });
      const im = new Image(); im.crossOrigin = 'anonymous'; im.src = turl(LAY[2], zn, Math.floor((90 - p.lat) / dn), Math.floor((p.lon + 180) / dn));
      setTimeout(next, 400); };
    next();
  };
  setTimeout(preload, 6000);  // after the page and globe have loaded
  // city names when zoomed in (Natural Earth, public domain): small, grey, below the orange markers; more cities the closer you get
  let CITIES = null; fetch(`${BASE}cities.json`).then(r => r.ok ? r.json() : null).then(d => { CITIES = d; }).catch(() => {});
  const labels = (ctx, W, H, cx, cy, R, lon0, lat0) => {
    const D3 = E.detail, a = D3.want * (D3.bb ? D3.fade : 0); if (!CITIES || a < .05) return;
    const rad = Math.asin(Math.min(1, Math.max(W, H) * .5 / R)) * 180 / Math.PI, minPop = rad > 30 ? 5e6 : rad > 15 ? 2e6 : rad > 8 ? 8e5 : 4e5;  /* owner 21 Nov 2026: fewer names */
    const r = Math.PI / 180, c0 = Math.cos(lat0 * r), s0 = Math.sin(lat0 * r), placed = [];
    ctx.save(); ctx.font = '500 12px Inter,system-ui,sans-serif'; ctx.textBaseline = 'middle';
    for (const [n, la, lo, pop] of CITIES) {
      if (pop < minPop) continue; const ph = la * r, d = lo * r - lon0 * r, cp = Math.cos(ph), z = s0 * Math.sin(ph) + c0 * cp * Math.cos(d); if (z < .2) continue;
      const x = cx + R * cp * Math.sin(d), y = cy - R * (c0 * Math.sin(ph) - s0 * cp * Math.cos(d)); if (x < 0 || y < 0 || x > W || y > H) continue;
      if ((window.__markPts || []).some(m => (m[0] - x) ** 2 + (m[1] - y) ** 2 < 34 * 34)) continue;  // an orange marker is here: its own label wins
      const w = ctx.measureText(n).width, box = [x - 34, y - 30, x + 40 + w, y + 30]; if (placed.some(b => !(box[2] < b[0] || box[0] > b[2] || box[3] < b[1] || box[1] > b[3]))) continue; placed.push(box);
      ctx.globalAlpha = a * (pop >= 1e6 ? .95 : .75); ctx.fillStyle = 'rgba(232,230,226,.9)'; ctx.beginPath(); ctx.arc(x, y, pop >= 1e6 ? 2.4 : 1.8, 0, 7); ctx.fill();
      const big = pop >= 1e6; ctx.font = (big ? '600 13px' : '500 11.5px') + ' Inter,system-ui,sans-serif'; const tw = ctx.measureText(n).width; ctx.fillStyle = 'rgba(10,10,12,.72)'; ctx.beginPath(); ctx.roundRect(x + 3, y - 9, tw + 10, 18, 5); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = big ? '#fff' : 'rgba(226,224,220,.95)'; ctx.fillText(n, x + 8, y + .5);  /* readable label (owner 21 Nov 2026) */
      if (placed.length > 14) break;
    }
    ctx.restore();
  };
  // city glow (owner 21 Nov 2026, option C): a soft warm glow at every city over 300,000 people on the night side (Natural Earth population),
  // so regions where the satellite sees only faint light (Central Africa, Siberia, Canada, inland China) still show their real cities.
  const GLOW = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,214,160,1)'); gr.addColorStop(.35, 'rgba(255,160,70,.45)'); gr.addColorStop(1, 'rgba(255,140,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c; })();
  const cityGlow = (ctx, cx, cy, R, lon0, lat0, sp) => {
    if (!CITIES) return; const r = Math.PI / 180, c0 = Math.cos(lat0 * r), s0 = Math.sin(lat0 * r), sx = Math.cos(sp.la) * Math.cos(sp.lo), sy = Math.cos(sp.la) * Math.sin(sp.lo), sz = Math.sin(sp.la), b = Math.max(.8, Math.min(2.2, R / 260));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const [, la, lo, pop] of CITIES) {
      if (pop < ((la > 47 && lo < -50) || (la > 48 && lo > 30) || (la < -10 && lo > 110) || (la < 16 && la > -36 && lo > -20 && lo < 52) ? 1e5 : 3e5)) continue;  /* sparse regions (Canada, Russia, Australia, Africa): towns over 100k too */ const ph = la * r, l2 = lo * r, cp = Math.cos(ph), nf = -(cp * Math.cos(l2) * sx + cp * Math.sin(l2) * sy + Math.sin(ph) * sz); if (nf < .02) continue;
      const d = l2 - lon0 * r, z = s0 * Math.sin(ph) + c0 * cp * Math.cos(d); if (z < .05) continue;
      const x = cx + R * cp * Math.sin(d), y = cy - R * (c0 * Math.sin(ph) - s0 * cp * Math.cos(d)), rr = b * (1.2 + Math.log10(pop / 3e5) * 1.3) * 2.4;
      ctx.globalAlpha = Math.min(1, nf * 4) * Math.min(1, z * 3) * .3 * (1 - E.detail.want * .85 * (E.detail.gk || 0)); ctx.drawImage(GLOW, x - rr, y - rr, rr * 2, rr * 2);
    }
    ctx.restore();
  };
  E.draw = (ctx, W, H, cx, cy, R, lon0, lat0, sp) => {
    if (!E.ready || !(W > 0) || !(H > 0) || !(R > 0)) return false;  // page not measured yet: use the 2D globe this frame
    const t0 = performance.now(), dpr = E.dpr = Math.min(3, devicePixelRatio || 1);
    const w = Math.round(W * dpr), h = Math.round(H * dpr); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(u.res, w, h); gl.uniform3f(u.g, cx, cy, R); gl.uniform2f(u.rot, lon0 * Math.PI / 180, lat0 * Math.PI / 180); gl.uniform1f(u.dpr, dpr);
    gl.uniform3f(u.sun, sp.lo, Math.cos(sp.la), Math.sin(sp.la));
    plan(W, H, R, lon0, lat0); tick(); const D2 = E.detail; const now = performance.now(); if (D2.bb) D2.fade = Math.min(1, D2.fade + Math.min(.5, (now - (D2.tf || now)) / 300)); D2.tf = now;  /* glow hand-over: one smooth fade, never reset by new tiles during a zoom (owner 21 Nov 2026: zoom flickered) */ D2.gk = (D2.gk || 0) + (((D2.bb && D2.fade >= 1) ? 1 : 0) - (D2.gk || 0)) * Math.min(1, (now - (D2.tg || now)) / 600); D2.tg = now;  // ~0.3 s fade-in, whatever the frame rate
    const k = D2.bb ? D2.want * D2.fade : 0, r = Math.PI / 180, b = D2.bb || [0, 0, 1, 1];
    gl.uniform1f(u.dk, k); gl.uniform1f(u.lt, document.documentElement.dataset.theme === 'light' ? 1 : 0); gl.uniform4f(u.dbb, b[0] * r, b[1] * r, b[2] * r, b[3] * r);
    for (let i = 0; i < 4; i++) { gl.activeTexture(gl.TEXTURE2 + i); gl.bindTexture(gl.TEXTURE_2D, dtex[i]); }
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[0]); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex[1]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    try { ctx.drawImage(cv, 0, 0, W, H); } catch (e) { return false; } cityGlow(ctx, cx, cy, R, lon0, lat0, sp); labels(ctx, W, H, cx, cy, R, lon0, lat0); E.ms = E.ms * .9 + (performance.now() - t0) * .1; return true;
  };
})();

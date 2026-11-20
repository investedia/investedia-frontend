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
  const big = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 16384);
  const phone = matchMedia('(max-width: 760px)').matches || /iPhone|Android.+Mobile/.test(navigator.userAgent);
  const wantTier = big >= 8192 && !phone ? 8 : 4;  // phones: 4K (about 1.3 MB); desktops: 4K first, then 8K (about 4.4 MB)
  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FS = `precision highp float;
uniform sampler2D dayT,nightT;uniform vec2 res;uniform vec3 g;uniform vec2 rot;uniform vec3 sun;uniform float dpr;
const float PI=3.14159265;
void main(){
  vec2 px=vec2(gl_FragCoord.x,res.y-gl_FragCoord.y)/dpr;
  vec2 d=(px-g.xy)/g.z; float r2=dot(d,d); if(r2>1.){gl_FragColor=vec4(0.);return;}
  float X=d.x,Y=-d.y,Zd=sqrt(1.-r2),c0=cos(rot.y),s0=sin(rot.y);
  float sp=c0*Y+s0*Zd, phi=asin(clamp(sp,-1.,1.)), cpcd=-s0*Y+c0*Zd, lam=rot.x+atan(X,cpcd);
  vec2 uv=vec2(fract((lam+PI)/(2.*PI)),(PI*.5-phi)/PI);
  // Investedia grade (owner 20 Nov 2026): satellite detail, black-and-orange identity. No blue oceans, no green land.
  vec3 day=texture2D(dayT,uv).rgb; float lum=dot(day,vec3(.299,.587,.114));
  float sea=smoothstep(.04,.16,day.b-day.r)*(1.-smoothstep(.28,.45,lum));  // Blue Marble oceans are dark blue: detect them
  float tone=.06+.17*pow(smoothstep(.04,.8,lum),.85);  /* softer contrast (deserts calmer) */                                // monochrome: charcoal to cool grey, terrain kept as light/dark texture (owner 20 Nov 2026: no sepia)
  vec3 nat=day/max(lum,.04);                                                 // the real colour of this spot, without its brightness
  vec3 base=vec3(tone)*mix(vec3(1.),nat,.18)*vec3(1.01,1.,.975);              // owner 20 Nov 2026: dark neutral land with a trace of natural colour and warmth (not sepia, not flat grey)
  base=mix(base,vec3(.012,.013,.017),sea);                                   // oceans almost black
  float cp=cos(phi), sdot=sin(phi)*sun.z+cp*cos(lam-sun.x)*sun.y;          // cos(angle to the sun)
  float dayk=smoothstep(-.07,.16,sdot);
  vec3 col=base*mix(.34,1.,dayk)*mix(.8,1.,Zd);                          // night side darker but land still readable                           // night side darker, slight limb darkening
  float L=texture2D(nightT,uv).r; L=pow(max(0.,(L-.09)/.91),1.25);         // city lights only (drops Black Marble's faint ground)
  col+=mix(vec3(1.,.58,.22),vec3(1.,.9,.74),smoothstep(.15,.85,L))*L*1.55*(1.-dayk);  // real night lights: amber/soft orange in the fainter areas, warm white in the brightest cores                                 // tiny ivory points, very little amber; orange stays for data
  float edge=smoothstep(1.,1.-2.2/(g.z*dpr),sqrt(r2));                     // 1-2 device pixel antialiased rim
  gl_FragColor=vec4(col*edge,edge);
}`;
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(o); return o; };
  let pr; try { pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); } catch (e) { return; }
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const ap = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n), u = { res: U('res'), g: U('g'), rot: U('rot'), sun: U('sun'), dpr: U('dpr') };
  gl.uniform1i(U('dayT'), 0); gl.uniform1i(U('nightT'), 1);
  const aniso = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
  const tex = [gl.createTexture(), gl.createTexture()], have = [0, 0];
  const upload = (i, img, tier) => {
    gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tex[i]);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, i ? gl.LUMINANCE : gl.RGB, i ? gl.LUMINANCE : gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    have[i] = tier; E.tier = Math.min(have[0], have[1]); E.ready = have[0] > 0 && have[1] > 0;
  };
  const load = tier => ['day', 'night'].forEach((k, i) => { const img = new Image(); img.decoding = 'async'; img.crossOrigin = 'anonymous';
    img.onload = () => { if (have[i] < tier) upload(i, img, tier); if (tier === 4 && wantTier === 8 && E.ready && !load.hi) { load.hi = 1; setTimeout(() => load(8), 400); } };
    img.src = `${BASE}earth-${k}-${tier}k.jpg`; });
  load(4);
  // draw the Earth into the page's 2D canvas (same projection numbers as proj() in page.html)
  E.draw = (ctx, W, H, cx, cy, R, lon0, lat0, sp) => {
    if (!E.ready || !(W > 0) || !(H > 0) || !(R > 0)) return false;  // page not measured yet: use the 2D globe this frame
    const t0 = performance.now(), dpr = E.dpr = Math.min(3, devicePixelRatio || 1);
    const w = Math.round(W * dpr), h = Math.round(H * dpr); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(u.res, w, h); gl.uniform3f(u.g, cx, cy, R); gl.uniform2f(u.rot, lon0 * Math.PI / 180, lat0 * Math.PI / 180); gl.uniform1f(u.dpr, dpr);
    gl.uniform3f(u.sun, sp.lo, Math.cos(sp.la), Math.sin(sp.la));
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[0]); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex[1]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    try { ctx.drawImage(cv, 0, 0, W, H); } catch (e) { return false; } E.ms = E.ms * .9 + (performance.now() - t0) * .1; return true;
  };
})();

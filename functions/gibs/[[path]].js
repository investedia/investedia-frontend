// Cloudflare Pages Function: a cached copy of NASA GIBS map tiles on our own domain (owner 21 Nov 2026: globe loads faster).
// Only the four layers the globe uses are allowed, so this cannot be used as an open proxy. Tiles never change, so they are
// kept at Cloudflare's edge for 30 days and in the visitor's browser for 7 days.
const NASA = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/';
const OK = /^(Landsat_WELD_CorrectedReflectance_TrueColor_Global_Annual|ASTER_GDEM_Greyscale_Shaded_Relief|VIIRS_Black_Marble|Landsat_Global_Man-made_Impervious_Surface|BlueMarble_NextGeneration)\/default\/[0-9a-z-]+\/(31\.25m|500m)\/\d{1,2}\/\d{1,5}\/\d{1,5}\.(jpg|jpeg|png)$/;

export async function onRequestGet({ request, params, waitUntil }) {
  const path = [].concat(params.path || []).join('/');
  if (!OK.test(path)) return new Response('Not found', { status: 404 });
  const cache = caches.default, key = new Request(new URL('/gibs/' + path, request.url).toString());
  let res = await cache.match(key);
  if (res) return res;
  const up = await fetch(NASA + path, { cf: { cacheTtl: 2592000, cacheEverything: true } });
  if (!up.ok) return new Response('Upstream ' + up.status, { status: up.status === 404 ? 404 : 502, headers: { 'Cache-Control': 'no-store' } });
  res = new Response(up.body, { status: 200, headers: {
    'Content-Type': up.headers.get('Content-Type') || (path.endsWith('png') ? 'image/png' : 'image/jpeg'),
    'Cache-Control': 'public, max-age=604800, s-maxage=2592000, immutable',
    'Access-Control-Allow-Origin': '*',
    'X-Source': 'NASA GIBS (public domain), cached by Investedia' } });
  waitUntil(cache.put(key, res.clone()));
  return res;
}

// Owner 25 Nov 2026 (option B1): share pictures with a small Investedia logo in the top-left.
// /og/<photo>.jpg → the topic photo cropped to 1200x630 with assets/og-logo.png drawn on it by Cloudflare Images.
// If Image Transformations is off for the zone, the plain photo is returned instead, so links never break.
export async function onRequestGet({ request, params }) {
  const url = new URL(request.url);
  const name = [].concat(params.path || []).join('/');
  if (!/^[\w.-]{1,120}\.(jpe?g|png|webp)$/i.test(name)) return new Response('Not found', { status: 404 });
  const photo = new URL('/assets/globe/photos/' + name, url.origin).toString();
  const logo = new URL('/assets/og-logo.png', url.origin).toString();
  try {
    const r = await fetch(photo, { cf: { image: {
      width: 1200, height: 630, fit: 'cover', format: 'jpeg', quality: 80,
      draw: [{ url: logo, left: 14, top: 14 }],
    } } });
    const resized = r.headers.get('cf-resized') || '';
    if (r.ok && resized && !/err/i.test(resized)) {
      const h = new Headers(r.headers); h.set('Cache-Control', 'public, max-age=604800');
      return new Response(r.body, { status: 200, headers: h });
    }
  } catch {}
  return Response.redirect(photo, 302);
}

// netlify/edge-handlers/prerender.js
export default async (request, context) => {
    const ua = request.headers.get('user-agent') || '';
    const botRegex = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|twitterbot|mediapartners-google/i;

    // If it's NOT a bot, do nothing -> let Netlify serve the static site as usual
    if (!botRegex.test(ua)) {
        return;
    }

    const token = process.env.PRERENDER_TOKEN;
    if (!token) {
        return; // if no token, just fall through
    }

    // Build full URL to prerender
    const url = request.url;

    // Query Prerender service
    const prerenderRes = await fetch(`https://service.prerender.io/${url}`, {
        headers: {
            'X-Prerender-Token': token,
            // you can optionally forward accept-language etc:
            'User-Agent': ua
        }
    });

    const body = await prerenderRes.text();
    // Return rendered HTML to the bot
    return new Response(body, {
        status: prerenderRes.status,
        headers: { 'content-type': 'text/html; charset=utf-8' }
    });
};

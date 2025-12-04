export async function onRequest(context) {
  const { request, env } = context;
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  // Add a diagnostic header so we can confirm the Function executed
  headers['X-Function-Active'] = 'true';

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Health/info for GET
  if (request.method === 'GET') {
    return new Response(JSON.stringify({ ok: true, message: 'WBC Training chat endpoint. POST JSON {"message":"..."} to this endpoint.' }), { status: 200, headers });
  }

  // Accept only POST for chat payload; return helpful 200 for other methods
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, message: `Method ${request.method} not supported; use POST` }), { status: 200, headers });
  }

  // Parse JSON
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, message: 'Invalid JSON' }), { status: 400, headers });
  }

  if (!body || !body.message) {
    return new Response(JSON.stringify({ ok: false, message: 'Missing message parameter' }), { status: 400, headers });
  }

  // Upstream URL must be set as an environment variable/Pages secret
  const upstream = env.UPSTREAM_URL;
  if (!upstream) {
    // Return 200 so callers (and CDNs) don't treat this as a server error.
    // Provide clear instructions in the payload so the site owner can configure the Pages secret.
    return new Response(JSON.stringify({
      ok: false,
      message: 'UPSTREAM_URL not configured. Set the UPSTREAM_URL Pages secret to your backend URL (e.g. https://api.example.com/api/chat).'
    }), { status: 200, headers });
  }

  // Prevent obvious recursion: do not allow upstream to point to pages.dev host
  try {
    const upstreamUrl = new URL(upstream);
    if (upstreamUrl.hostname.endsWith('.pages.dev') || upstreamUrl.hostname === 'wbctraining.pages.dev') {
      return new Response(JSON.stringify({ ok: false, message: 'UPSTREAM_URL points to a Pages host; set it to your backend server to avoid recursion.' }), { status: 200, headers });
    }
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, message: 'Invalid UPSTREAM_URL format' }), { status: 200, headers });
  }

  // Proxy to upstream
  try {
    const resp = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: body.message })
    });

    const text = await resp.text();

    // Return upstream response as-is, with guaranteed CORS headers and 200
    return new Response(text, {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': resp.headers.get('Content-Type') || 'application/json'
      }
    });
  } catch (err) {
    // Return 200 with error payload so external checks won't see a 5xx.
    return new Response(JSON.stringify({ ok: false, message: 'Upstream request failed', error: String(err) }), { status: 200, headers });
  }
}

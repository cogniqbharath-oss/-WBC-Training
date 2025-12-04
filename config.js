// WBC Training - API Configuration (Client-side helper)
// Gemini API keys must remain on the server. This file only exposes metadata.

const API_CONFIG = {
  PROVIDER: 'Gemini',
  MODEL_NAME: 'gemini-1.5-pro',
  CHAT_ENDPOINT: '/gemini',
  API_KEY_STATUS: 'Managed on server via GEMINI_API_KEY env variable',
  // Secure endpoint configuration - API key hidden server-side
  SECURE_ENDPOINT: {
    url: '/gemini',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    auth: 'server-side' // API key never exposed to client
  }
};

// Always true because the key is managed server-side.
function isApiKeyConfigured() {
  return true;
}

function getApiKey() {
  // Never expose API keys to the browser.
  return null;
}

// Proxy function for secure API calls (API key handled server-side)
async function callSecureEndpoint(message) {
  try {
    // Validate input
    if (!message || typeof message !== 'string') {
      return {
        ok: false,
        message: 'Invalid request: message is required'
      };
    }

    const response = await fetch(API_CONFIG.CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });

    // Handle non-2xx responses
    if (!response.ok) {
      console.error('Endpoint error:', response.status);
      return {
        ok: false,
        message: response.status === 502 ? 'Upstream API error. Please try again.' : `Error: ${response.status}`
      };
    }

    const data = await response.json();
    return {
      ok: true,
      data: data
    };

  } catch (error) {
    console.error('Secure endpoint error:', error);
    return {
      ok: false,
      message: 'Internal server error. Please try again later.'
    };
  }
}

// CORS and validation helper for Worker-style environments
const ENDPOINT_CONFIG = {
  async handleRequest(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // Only accept POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ 
        ok: false,
        message: 'Method not allowed' 
      }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json();

      // Validate request body
      if (!body.message) {
        return new Response(JSON.stringify({ 
          ok: false,
          message: 'Missing message parameter' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Forward to chat endpoint (handled by serve.py or Cloudflare Worker)
      const response = await fetch(API_CONFIG.CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: body.message })
      });

      const text = await response.text();

      if (!response.ok) {
        console.error('Upstream error:', response.status, text);
        return new Response(JSON.stringify({ 
          ok: false,
          message: 'Upstream API error' 
        }), {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      return new Response(text, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (err) {
      console.error('Worker error:', err);
      return new Response(JSON.stringify({ 
        ok: false,
        message: 'Internal server error' 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_CONFIG, isApiKeyConfigured, getApiKey, callSecureEndpoint, ENDPOINT_CONFIG };
}


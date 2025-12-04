// WBC Training - API Configuration (Client-side helper)
// Gemini API keys must remain on the server. This file only exposes metadata.

const API_CONFIG = {
  PROVIDER: 'Gemini',
  MODEL_NAME: 'gemini-1.5-pro',
  CHAT_ENDPOINT: '/chat',
  API_KEY_STATUS: 'Managed on server via GEMINI_API_KEY env variable',
  // Secure endpoint configuration - API key hidden server-side
  SECURE_ENDPOINT: {
    url: '/chat',
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
    const response = await fetch(API_CONFIG.CHAT_ENDPOINT, {
      method: 'POST',
      headers: API_CONFIG.SECURE_ENDPOINT.headers,
      body: JSON.stringify({ message })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Secure endpoint error:', error);
    throw error;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_CONFIG, isApiKeyConfigured, getApiKey, callSecureEndpoint };
}


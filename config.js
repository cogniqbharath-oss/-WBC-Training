// WBC Training - API Configuration (Client-side helper)
// Groq API keys must remain on the server. This file only exposes metadata.

const API_CONFIG = {
  PROVIDER: 'Groq',
  MODEL_NAME: 'llama-3.1-8b-instant',
  CHAT_ENDPOINT: '/chat',
  API_KEY_STATUS: 'Managed on server via GROQ_API_KEY env variable'
};

// Always true because the key is managed server-side.
function isApiKeyConfigured() {
  return true;
}

function getApiKey() {
  // Never expose API keys to the browser.
  return null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_CONFIG, isApiKeyConfigured, getApiKey };
}


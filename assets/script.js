// WBC Training – AI Concierge (Gemini via Cloudflare Worker)

(function () {
  const API_ENDPOINT = '/api/chat'

  const launcherImage = document.querySelector('img[alt="Chat with WBC"]');
  const conciergePanel = document.getElementById('ai-concierge-panel');
  const headerCloseBtn = document.getElementById('ai-concierge-close');
  const sendButton = document.getElementById('ai-concierge-send');
  const inputField = document.getElementById('ai-concierge-input');
  const form = document.getElementById('ai-concierge-form');
  const messagesContainer = document.getElementById('ai-concierge-messages');
  const clearChatButton = document.getElementById('ai-concierge-clear');
  const quickPromptButtons = document.querySelectorAll('[data-ai-quick-prompt]');

  let isSending = false;
  let typingTimeout = null;

  if (!messagesContainer || !inputField) return;

  function createMessageBubble(text, role) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ai-message ' + (role === 'user' ? 'ai-message-user' : 'ai-message-assistant');

    const bubble = document.createElement('div');
    bubble.className =
      role === 'user'
        ? 'inline-block max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-slate-900 text-white ml-auto'
        : 'inline-block max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-slate-100 text-slate-900 mr-auto';

    bubble.textContent = text;
    wrapper.appendChild(bubble);
    return wrapper;
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function setPanelVisible(visible) {
    if (!conciergePanel) return;
    conciergePanel.classList.toggle('hidden', !visible);
  }

  function showTypingIndicator() {
    if (messagesContainer.querySelector('.ai-typing')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'ai-message ai-message-assistant ai-typing';

    const bubble = document.createElement('div');
    bubble.className =
      'inline-block max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-slate-100 text-slate-900 mr-auto flex gap-1 items-center';

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.className = 'w-1.5 h-1.5 rounded-full animate-pulse';
      dot.style.animationDelay = `${i * 0.15}s`;
      bubble.appendChild(dot);
    }

    wrapper.appendChild(bubble);
    messagesContainer.appendChild(wrapper);
    scrollToBottom();
  }

  function hideTypingIndicator() {
    const typing = messagesContainer.querySelector('.ai-typing');
    if (typing) typing.remove();
  }

  function setSendingState(sending) {
    isSending = sending;

    if (sendButton) {
      sendButton.disabled = sending;
      sendButton.classList.toggle('opacity-50', sending);
    }
    if (inputField) inputField.disabled = sending;

    if (sending) {
      typingTimeout = setTimeout(showTypingIndicator, 300);
    } else {
      clearTimeout(typingTimeout);
      hideTypingIndicator();
    }
  }

  function addAssistantGreetingOnce() {
    if (messagesContainer.dataset.initialised === 'true') return;

    const intro = createMessageBubble(
      'Hi there! Ask me about course hours, booking availability, or travel directions and I’ll reply instantly.',
      'assistant'
    );
    messagesContainer.appendChild(intro);
    messagesContainer.dataset.initialised = 'true';
    scrollToBottom();
  }

 async function sendMessage(rawText) {
  const text = rawText.trim();
  if (!text || isSending) return;

  setPanelVisible(true);
  addAssistantGreetingOnce();

  // User bubble
  const userBubble = createMessageBubble(text, 'user');
  messagesContainer.appendChild(userBubble);
  scrollToBottom();
  inputField.value = '';

  // Assistant bubble (empty at first)
  const assistantWrapper = document.createElement('div');
  assistantWrapper.className = 'ai-message ai-message-assistant';

  const assistantBubble = document.createElement('div');
  assistantBubble.className =
    'inline-block max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-slate-100 text-slate-900 mr-auto whitespace-pre-wrap';

  assistantWrapper.appendChild(assistantBubble);
  messagesContainer.appendChild(assistantWrapper);
  scrollToBottom();

  try {
    setSendingState(true);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });

    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;

      assistantBubble.textContent = fullText;
      scrollToBottom();
    }

  } catch (err) {
    assistantBubble.textContent =
      'Sorry — something went wrong. Please try again.';
    console.error(err);
  } finally {
    setSendingState(false);
  }
}

  // Events
  if (launcherImage) {
    launcherImage.style.cursor = 'pointer';
    launcherImage.addEventListener('click', () => {
      const isHidden = conciergePanel.classList.contains('hidden');
      setPanelVisible(isHidden);
      if (isHidden) addAssistantGreetingOnce();
    });
  }

  if (headerCloseBtn) {
    headerCloseBtn.addEventListener('click', () => setPanelVisible(false));
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      sendMessage(inputField.value);
    });
  }

  if (sendButton) {
    sendButton.addEventListener('click', () => {
      sendMessage(inputField.value);
    });
  }

  if (clearChatButton) {
    clearChatButton.addEventListener('click', () => {
      messagesContainer.innerHTML = '';
      delete messagesContainer.dataset.initialised;
      addAssistantGreetingOnce();
    });
  }

  quickPromptButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const prompt = btn.getAttribute('data-ai-quick-prompt') || btn.textContent || '';
      if (!prompt) return;
      sendMessage(prompt);
    });
  });

  // If panel starts visible, show greeting
  if (conciergePanel && !conciergePanel.classList.contains('hidden')) {
    addAssistantGreetingOnce();
  }
})();


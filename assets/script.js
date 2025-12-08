// script.js
// WBC Training – AI Concierge (Gemini via Cloudflare Worker)

(function () {
  // ====== CONFIG ======
  const API_ENDPOINT = '/api/gemini-chat'; // Cloudflare Worker route (see worker code below)
  const TYPING_DELAY_MS = 300;            // small delay before showing "typing..."

  // ====== DOM LOOKUP ======
  // Adjust these IDs/classes to match your HTML if needed.
  const launcherImage = document.querySelector('img[alt="Chat with WBC"], [data-ai-launcher="wbc"]');
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

  // Graceful no-JS failure
  if (!messagesContainer || !inputField) {
    return;
  }

  // ====== UTILITIES ======

  function createMessageBubble(text, role) {
    const wrapper = document.createElement('div');
    wrapper.className =
      'ai-message ' +
      (role === 'user'
        ? 'ai-message-user'
        : 'ai-message-assistant');

    const bubble = document.createElement('div');
    bubble.className =
      (role === 'user'
        ? 'inline-block max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-slate-900 text-white ml-auto'
        : 'inline-block max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-slate-100 text-slate-900 mr-auto');

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
    // Only one typing indicator at a time
    if (messagesContainer.querySelector('.ai-typing')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'ai-message ai-message-assistant ai-typing';

    const bubble = document.createElement('div');
    bubble.className =
      'inline-block max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-slate-100 text-slate-900 mr-auto flex gap-1 items-center';

    const dotBase =
      'w-1.5 h-1.5 rounded-full animate-pulse';

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.className = dotBase;
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
    if (inputField) {
      inputField.disabled = sending;
    }

    if (sending) {
      typingTimeout = setTimeout(showTypingIndicator, TYPING_DELAY_MS);
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

  // ====== SEND MESSAGE FLOW ======

  async function sendMessage(rawText) {
    const text = rawText.trim();
    if (!text || isSending) return;

    // Ensure panel is visible when sending
    setPanelVisible(true);
    addAssistantGreetingOnce();

    // 1. Add user message to UI
    const userBubble = createMessageBubble(text, 'user');
    messagesContainer.appendChild(userBubble);
    scrollToBottom();
    inputField.value = '';

    // 2. Call backend (Gemini via Worker)
    try {
      setSendingState(true);

      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const reply =
        data.reply ||
        data.text ||
        'Sorry, I could not generate a response right now. Please try again.';

      // 3. Add assistant message to UI
      const assistantBubble = createMessageBubble(reply, 'assistant');
      messagesContainer.appendChild(assistantBubble);
      scrollToBottom();
    } catch (err) {
      console.error('AI Concierge error:', err);
      const errorBubble = createMessageBubble(
        'Oops – something went wrong talking to the AI. Please try again in a moment.',
        'assistant'
      );
      messagesContainer.appendChild(errorBubble);
      scrollToBottom();
    } finally {
      setSendingState(false);
    }
  }

  // ====== EVENT HANDLERS ======

  // Open panel when clicking the “Chat with WBC” image or launcher
  if (launcherImage) {
    launcherImage.style.cursor = 'pointer';
    launcherImage.addEventListener('click', function () {
      const isHidden =
        conciergePanel && conciergePanel.classList.contains('hidden');
      setPanelVisible(isHidden);
      if (!isHidden) return;
      addAssistantGreetingOnce();
    });
  }

  // Close button in panel header
  if (headerCloseBtn) {
    headerCloseBtn.addEventListener('click', function () {
      setPanelVisible(false);
    });
  }

  // Form submit (Enter key)
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      sendMessage(inputField.value);
    });
  }

  // Send button
  if (sendButton) {
    sendButton.addEventListener('click', function () {
      sendMessage(inputField.value);
    });
  }

  // Quick prompts (“Course hours”, “Booking availability”, etc.)
  quickPromptButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const prompt = btn.getAttribute('data-ai-quick-prompt') || btn.textContent || '';
      if (!prompt) return;
      sendMessage(prompt);
    });
  });

  // Clear chat
  if (clearChatButton) {
    clearChatButton.addEventListener('click', () => {
      messagesContainer.innerHTML = '';
      delete messagesContainer.dataset.initialised;
      addAssistantGreetingOnce();
    });
  }

  // Optional: open panel if user scrolls far down (soft prompt)
  window.addEventListener('scroll', () => {
    if (!launcherImage || !conciergePanel) return;
    if (conciergePanel.dataset.autoShown === '1') return;

    const scrolled = window.scrollY || document.documentElement.scrollTop;
    if (scrolled > 800) {
      conciergePanel.dataset.autoShown = '1';
      setPanelVisible(true);
      addAssistantGreetingOnce();
    }
  });

  // Initial greeting if panel is visible at load
  if (conciergePanel && !conciergePanel.classList.contains('hidden')) {
    addAssistantGreetingOnce();
  }
})();

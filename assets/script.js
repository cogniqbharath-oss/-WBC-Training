// WBC Training – AI Concierge front-end
// Talks to Cloudflare Pages Function: /api/gemini-chat

(function () {
  const API_ENDPOINT = "/api/gemini-chat";

  const launcherImage = document.querySelector(
    'img[alt="Chat with WBC"], img[alt="Chat with WBC Training"]'
  );
  const conciergePanel = document.getElementById("ai-concierge-panel");
  const headerCloseBtn = document.getElementById("ai-concierge-close");
  const sendButton = document.getElementById("ai-concierge-send");
  const inputField = document.getElementById("ai-concierge-input");
  const form = document.getElementById("ai-concierge-form");
  const messagesContainer = document.getElementById("ai-concierge-messages");
  const clearChatButton = document.getElementById("ai-concierge-clear");
  const quickPromptButtons = document.querySelectorAll("[data-ai-quick-prompt]");

  let isSending = false;

  if (!messagesContainer || !inputField) {
    console.warn("AI Concierge: missing required DOM elements.");
    return;
  }

  function createMessageBubble(text, role) {
    const wrapper = document.createElement("div");
    wrapper.className =
      "ai-message " + (role === "user" ? "ai-message-user" : "ai-message-assistant");

    const bubble = document.createElement("div");
    bubble.className =
      role === "user"
        ? "inline-block max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-sky-600 text-white ml-auto"
        : "inline-block max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-slate-100 text-slate-900 mr-auto";

    bubble.textContent = text;
    wrapper.appendChild(bubble);
    return wrapper;
  }

  function addAssistantMessage(text) {
    const bubble = createMessageBubble(text, "assistant");
    messagesContainer.appendChild(bubble);
    scrollToBottom();
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function setPanelVisible(visible) {
    if (!conciergePanel) return;
    conciergePanel.classList.toggle("hidden", !visible);
  }

  function addAssistantGreetingOnce() {
    if (messagesContainer.dataset.initialised === "true") return;
    addAssistantMessage(
      "Hi there! Ask me about course hours, booking availability, or travel directions and I'll reply instantly."
    );
    messagesContainer.dataset.initialised = "true";
  }

  async function sendMessage(rawText) {
    const text = rawText.trim();
    if (!text || isSending) return;

    setPanelVisible(true);
    addAssistantGreetingOnce();

    // add user bubble
    const userBubble = createMessageBubble(text, "user");
    messagesContainer.appendChild(userBubble);
    scrollToBottom();
    inputField.value = "";

    isSending = true;
    if (sendButton) sendButton.disabled = true;
    inputField.disabled = true;

    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const dataText = await res.text();
      let data = null;
      try {
        data = JSON.parse(dataText);
      } catch (e) {
        console.error("Chat JSON parse error:", e, dataText);
      }

      console.log("Chat raw response:", data || dataText);

      if (!res.ok || !data) {
        addAssistantMessage(
          "Error: The chat service returned an invalid response. Please try again later."
        );
        return;
      }

      if (data.error) {
        console.error("Chat service error:", data);
        addAssistantMessage(
          "Error from AI service: " + (data.error || "Unknown error. Please try again later.")
        );
        return;
      }

      const reply =
        data.reply ||
        data.text ||
        "Sorry, I couldn't generate a response just now. Please try again.";

      addAssistantMessage(reply);
    } catch (err) {
      console.error("Chat fetch error:", err);
      addAssistantMessage("Error: Unable to reach chat service. Please try again later.");
    } finally {
      isSending = false;
      if (sendButton) sendButton.disabled = false;
      inputField.disabled = false;
    }
  }

  // Events
  if (launcherImage) {
    launcherImage.style.cursor = "pointer";
    launcherImage.addEventListener("click", () => {
      const isHidden = conciergePanel.classList.contains("hidden");
      setPanelVisible(isHidden);
      if (isHidden) addAssistantGreetingOnce();
    });
  }

  if (headerCloseBtn) {
    headerCloseBtn.addEventListener("click", () => setPanelVisible(false));
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      sendMessage(inputField.value);
    });
  }

  if (sendButton) {
    sendButton.addEventListener("click", () => {
      sendMessage(inputField.value);
    });
  }

  if (clearChatButton) {
    clearChatButton.addEventListener("click", () => {
      messagesContainer.innerHTML = "";
      delete messagesContainer.dataset.initialised;
      addAssistantGreetingOnce();
    });
  }

  quickPromptButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const prompt = btn.getAttribute("data-ai-quick-prompt") || btn.textContent || "";
      if (!prompt) return;
      sendMessage(prompt);
    });
  });

  // If panel starts visible
  if (conciergePanel && !conciergePanel.classList.contains("hidden")) {
    addAssistantGreetingOnce();
  }
})();



// WBC Training – AI Concierge front-end
// Talks to Cloudflare Pages Function: /api/gemini-chat

(function () {
  const API_ENDPOINT = "https://summer-firefly-ae50.cogniq-bharath.workers.dev/";

  const SYSTEM_PROMPT = `
You are a friendly and helpful AI Concierge at WBC Training. 
Your goal is to assist users with their inquiries about our business capability programmes in a warm, natural, and human-like way.

About WBC Training:
- Established in 2005.
- Offers 3-5 day classroom/online courses in Leadership, Procurement, Strategy, Governance, and Stakeholder Management.
- Provides 1-2 hour Online Workshops for rapid skill boosts.
- Delivers custom in-house training globally (London, Dubai, Erbil).
- Key programs include Capital Portfolio Leadership (Flagship executive program) and Operational Excellence Lab (On-site simulation).
- Most cohorts report 98% faster stakeholder alignment within 6 weeks.
- Contact: info@wbctraining.com or +44 7540 269 827.

Human-Like Guidelines:
- Be warm, conversational, and approachable. Avoid overly formal or robotic language.
- Use natural transitions like "That's a great question!", "I'd be happy to help you with that," or "Certainly!"
- If a user asks about something specific like course dates or details, provide the information helpfully and offer further assistance.
- If you're unsure about a specific detail, suggest they reach out to our team at info@wbctraining.com.
- Acknowledge the user's situation. 
`.trim();

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

    const userBubble = createMessageBubble(text, "user");
    messagesContainer.appendChild(userBubble);
    scrollToBottom();
    inputField.value = "";

    isSending = true;
    sendButton && (sendButton.disabled = true);
    inputField.disabled = true;

    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `${SYSTEM_PROMPT}\n\nUser: ${text}` }),
      });

      const dataText = await res.text();
      let data = null;

      try {
        data = JSON.parse(dataText);
      } catch (e) {
        console.error("Chat JSON parse error:", e, dataText);
      }

      console.log("Chat raw response:", data || dataText);

      // ✅ handle API-level errors
      if (!res.ok) {
        addAssistantMessage(
          "Error: Chat service returned an error. Please try again."
        );
        return;
      }

      // ✅ handle backend-reported errors
      if (data.error) {
        const extra = data.detail ? ` – ${data.detail}` : "";
        addAssistantMessage("Error from AI service: " + data.error + extra);
        return;
      }

      // ✅ SUCCESS PATH (this was missing)
      if (typeof data.reply === "string") {
        addAssistantMessage(data.reply);
        return;
      }

      if (data.error) {
        const extra =
          data.geminiMessage
            ? ` – ${data.geminiMessage}`
            : data.detail
              ? ` – ${data.detail}`
              : "";

        console.error("Chat service error:", data);
        addAssistantMessage(
          "Error from AI service: " + data.error + extra
        );
        return;
      }

      const reply =
        data.response ||
        data.reply ||
        data.text ||
        "Sorry, I couldn't generate a response just now. Please try again.";

      addAssistantMessage(reply);
    } catch (err) {
      console.error("Chat fetch error:", err);
      addAssistantMessage(
        "Error: Unable to reach chat service. Please try again later."
      );
    } finally {
      isSending = false;
      sendButton && (sendButton.disabled = false);
      inputField.disabled = false;
    }
  }

  // Events
  launcherImage &&
    launcherImage.addEventListener("click", () => {
      const isHidden = conciergePanel.classList.contains("hidden");
      setPanelVisible(isHidden);
      if (isHidden) addAssistantGreetingOnce();
    });

  headerCloseBtn &&
    headerCloseBtn.addEventListener("click", () => setPanelVisible(false));

  form &&
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      sendMessage(inputField.value);
    });

  sendButton &&
    sendButton.addEventListener("click", () => {
      sendMessage(inputField.value);
    });

  clearChatButton &&
    clearChatButton.addEventListener("click", () => {
      messagesContainer.innerHTML = "";
      delete messagesContainer.dataset.initialised;
      addAssistantGreetingOnce();
    });

  quickPromptButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const prompt =
        btn.getAttribute("data-ai-quick-prompt") || btn.textContent || "";
      prompt && sendMessage(prompt);
    });
  });

  if (conciergePanel && !conciergePanel.classList.contains("hidden")) {
    addAssistantGreetingOnce();
  }
})();




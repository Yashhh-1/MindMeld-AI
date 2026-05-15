document.addEventListener("DOMContentLoaded", () => {

  const input = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");
  const sendBtn = document.getElementById("sendBtn");
  const themeBtn = document.getElementById("themeToggle");
  const refreshBtn = document.getElementById("refreshChat");
  const attachBtn = document.getElementById("attachBtn");
  const fileInput = document.getElementById("fileInput");
  const emptyState = document.getElementById("emptyState");

  let isTyping = false;

  // Safety check (prevents crash if DOM breaks)
  if (!input || !chatBox || !sendBtn || !themeBtn) {
    console.error("Critical UI elements missing");
    return;
  }

  // =========================
  // AUTO FOCUS
  // =========================
  input.focus();

  // =========================
  // THEME SYSTEM
  // =========================
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "light") {
    document.body.classList.add("light");
    themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  } else {
    themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
  }

  themeBtn.onclick = () => {
    document.body.classList.toggle("light");

    const isLight = document.body.classList.contains("light");

    localStorage.setItem("theme", isLight ? "light" : "dark");

    themeBtn.innerHTML = isLight
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
  };

  // =========================
  // SEND MESSAGE
  // =========================
  async function sendMessage() {

    const text = input.value.trim();

    if (!text || isTyping) return;

    isTyping = true;
    sendBtn.disabled = true;
    sendBtn.style.opacity = "0.6";

    if (emptyState) emptyState.style.display = "none";

    addMessage(text, "user");
    saveMemory("User: " + text);

    input.value = "";
    autoResizeInput();

    showTyping();

    try {

      const response = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          memory: localStorage.getItem("mindmeld_memory") || ""
        })
      });

      const data = await response.json();

      let cleanReply = (data.reply || "No response received.")
        .replace(/\*\*/g, "")
        .replace(/AI:/g, "")
        .replace(/ChatGPT/g, "MindMeld AI")
        .trim();

      setTimeout(() => {
        removeTyping();
        addBotMessage(cleanReply);
        saveMemory("MindMeld AI: " + cleanReply);
      }, 350 + Math.random() * 450);

    } catch (err) {

      removeTyping();
      addBotMessage("Unable to connect to MindMeld AI.");
      console.error(err);

    } finally {

      setTimeout(() => {
        isTyping = false;
        sendBtn.disabled = false;
        sendBtn.style.opacity = "1";
        input.focus();
      }, 200);
    }
  }

  // =========================
  // EVENTS
  // =========================
  sendBtn.addEventListener("click", (e) => {
    e.preventDefault();
    sendMessage();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // =========================
  // REFRESH CHAT
  // =========================
  refreshBtn.onclick = () => {
    chatBox.innerHTML = "";
    removeTyping();

    if (emptyState) {
      emptyState.style.display = "block";
      chatBox.appendChild(emptyState);
    }

    input.focus();
  };

  // =========================
  // FILE ATTACHMENT
  // =========================
  attachBtn.onclick = () => fileInput.click();

  fileInput.onchange = () => {

    if (fileInput.files && fileInput.files.length > 0) {

      const file = fileInput.files[0];

      if (emptyState) emptyState.style.display = "none";

      addMessage("📎 " + file.name, "user");
      showTyping();

      setTimeout(() => {
        removeTyping();
        addBotMessage("File received. You can now ask questions about it.");
      }, 600);
    }
  };

  // =========================
  // BOT MESSAGE (TYPING ENGINE FIXED)
  // =========================
  function addBotMessage(text) {

    const row = document.createElement("div");
    row.className = "message-row bot";

    const icon = document.createElement("div");
    icon.className = "bot-icon";
    icon.innerHTML = '<i class="fa-solid fa-spa"></i>';

    const bubble = document.createElement("div");
    bubble.className = "message";

    const textSpan = document.createElement("span");
    bubble.appendChild(textSpan);

    row.appendChild(icon);
    row.appendChild(bubble);
    chatBox.appendChild(row);

    let i = 0;

    function type() {

      if (i < text.length) {

        textSpan.textContent += text.charAt(i);

        const c = text.charAt(i);

        let speed;

        if (".,!?".includes(c)) speed = 60;
        else if (c === " ") speed = 3;
        else speed = 6 + Math.random() * 8;

        i++;
        setTimeout(type, speed);

        scrollDown();

      } else {

        const time = document.createElement("div");
        time.className = "time";
        time.innerText = getTime();
        bubble.appendChild(time);

        scrollDown();
      }
    }

    type();
  }

  // =========================
  // USER MESSAGE
  // =========================
  function addMessage(text, type) {

    const row = document.createElement("div");
    row.className = "message-row " + type;

    const bubble = document.createElement("div");
    bubble.className = "message";

    bubble.innerHTML = `
      ${text}
      <div class="time">${getTime()}</div>
    `;

    row.appendChild(bubble);
    chatBox.appendChild(row);

    scrollDown();
  }

  // =========================
  // TYPING
  // =========================
  function showTyping() {

    removeTyping();

    const typing = document.createElement("div");
    typing.className = "typing";
    typing.id = "typingIndicator";

    typing.innerHTML = `<span></span><span></span><span></span>`;

    chatBox.appendChild(typing);
    scrollDown();
  }

  function removeTyping() {
    const t = document.getElementById("typingIndicator");
    if (t) t.remove();
  }

  // =========================
  // UTILITIES
  // =========================
  function getTime() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function autoResizeInput() {
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";
  }

  input.addEventListener("input", autoResizeInput);

  function scrollDown() {
    requestAnimationFrame(() => {
      chatBox.scrollTop = chatBox.scrollHeight;
    });
  }

  // =========================
  // MEMORY SYSTEM
  // =========================
  function saveMemory(text) {

    let memory = localStorage.getItem("mindmeld_memory") || "";

    memory += text + "\n";

    if (memory.length > 12000) {
      memory = memory.slice(-12000);
    }

    localStorage.setItem("mindmeld_memory", memory);
  }

});

document.addEventListener("DOMContentLoaded", () => {

  const input = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");
  const sendBtn = document.getElementById("sendBtn");
  const themeBtn = document.getElementById("themeToggle");
  const refreshBtn = document.getElementById("refreshChat");
  const attachBtn = document.getElementById("attachBtn");
  const fileInput = document.getElementById("fileInput");
  const emptyState = document.getElementById("emptyState");

  // =========================
  // 🌙 LOAD THEME
  // =========================
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeBtn.textContent = "☀️";
  } else {
    themeBtn.textContent = "🌙";
  }

  // =========================
  // 🌙 TOGGLE THEME
  // =========================
  themeBtn.onclick = () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
      localStorage.setItem("theme", "dark");
      themeBtn.textContent = "☀️";
    } else {
      localStorage.setItem("theme", "light");
      themeBtn.textContent = "🌙";
    }
  };

  // =========================
  // 💬 SEND MESSAGE
  // =========================
  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    if (emptyState) emptyState.style.display = "none";

    addMessage(text, "user");
    input.value = "";

    showTyping();

    // ✅ REAL API CALL
    fetch("http://127.0.0.1:5000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text
      })
    })
    .then(res => res.json())
    .then(data => {
      removeTyping();
      addBotMessage(data.reply);
    })
    .catch(err => {
      removeTyping();
      addBotMessage("Error connecting to AI ❌");
      console.error(err);
    });
  }

  sendBtn.onclick = sendMessage;

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // =========================
  // 🔄 REFRESH CHAT
  // =========================
  refreshBtn.onclick = () => {
    chatBox.innerHTML = "";

    if (emptyState) {
      emptyState.style.display = "block";
      chatBox.appendChild(emptyState);
    }
  };

  // =========================
  // 📎 ATTACHMENT
  // =========================
  attachBtn.onclick = () => {
    fileInput.click();
  };

  fileInput.onchange = () => {
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];

      if (emptyState) emptyState.style.display = "none";

      addMessage("📎 " + file.name, "user");

      showTyping();

      setTimeout(() => {
        removeTyping();
        addBotMessage("Received: " + file.name + " ✅");
      }, 1000);
    }
  };

  // =========================
  // 🤖 BOT MESSAGE (TYPE EFFECT)
  // =========================
  function addBotMessage(text) {
    const row = document.createElement("div");
    row.className = "message-row bot";

    const icon = document.createElement("div");
    icon.className = "bot-icon";
    icon.textContent = "✨";
    
    const bubble = document.createElement("div");
    bubble.className = "message";

    const textSpan = document.createElement("span");
    bubble.appendChild(textSpan);

    const time = document.createElement("div");
    time.className = "time";

    row.appendChild(icon);
    row.appendChild(bubble);
    chatBox.appendChild(row);

    let i = 0;

    function type() {
      if (i < text.length) {
        textSpan.innerHTML += text.charAt(i);
        i++;
        scrollDown();
        setTimeout(type, 15);
      } else {
        time.innerText = getTime();
        bubble.appendChild(time);
      }
    }

    type();
  }

  // =========================
  // 👤 USER MESSAGE
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
  // ⏳ TYPING INDICATOR
  // =========================
  function showTyping() {
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
  // ⏱ TIME
  // =========================
  function getTime() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // =========================
  // ⬇️ SCROLL
  // =========================
  function scrollDown() {
    chatBox.scrollTo({
      top: chatBox.scrollHeight,
      behavior: "smooth"
    });
  }

});
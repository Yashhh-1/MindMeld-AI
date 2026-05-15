from flask import Flask, request, jsonify
from flask_cors import CORS

import requests
import PyPDF2

app = Flask(__name__)
CORS(app)

# =========================
# OPENROUTER API
# =========================

API_KEY = "API_KEY_HERE"

url = "https://openrouter.ai/api/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost",
    "X-Title": "MindMeld AI"
}

# =========================
# SYSTEM PROMPT
# =========================

SYSTEM_PROMPT = """
You are MindMeld AI.

Identity Rules (VERY IMPORTANT):
- If user asks "who are you", "what is your name", "your name?", respond EXACTLY:
  "Hi, I am MindMeld AI."

- If user asks "what do you do", "what is your purpose", respond EXACTLY:
  "Hi, I am MindMeld AI. I am your smart emotional companion."

You are:
- Calm
- Friendly
- Emotionally supportive
- Human-like

You help users with stress, anxiety, panic, overthinking, and emotional confusion.

Rules:
- Never sound robotic
- Keep responses short
- Never mention ChatGPT
- Always follow identity rules strictly when triggered
"""

conversation_history = [
    {
        "role": "system",
        "content": SYSTEM_PROMPT
    }
]

uploaded_text = ""

# =========================
# CRISIS DETECTION
# =========================

crisis_words = [
    "kill myself",
    "suicide",
    "end my life",
    "i want to die",
    "i am done",
    "die",
    "kill me"
]

CRISIS_MESSAGE = """
I’m really sorry you’re feeling this way.

You are not alone. Your life matters and help is available.

🇮🇳 India Mental Health Helplines:
• KIRAN: 1800-599-0019 (24/7)
• AASRA: +91-22-27546669
• iCALL: 9152987821

Please consider talking to someone you trust or a professional.
I’m here with you. ❤️
"""

# =========================
# CHAT ROUTE
# =========================

@app.route("/chat", methods=["POST"])
def chat():

    global uploaded_text
    global conversation_history

    try:
        data = request.get_json(silent=True) or {}
        user_input = data.get("message", "").strip()

        if not user_input:
            return jsonify({"reply": "Please type something."})

        user_lower = user_input.lower()
        print("USER:", user_input)

        # =========================
        # CRISIS CHECK (SAFE + FINAL)
        # =========================

        if any(word in user_lower for word in crisis_words):
            return jsonify({"reply": CRISIS_MESSAGE})

        # =========================
        # ATTACH FILE CONTEXT
        # =========================

        final_user_message = user_input

        if uploaded_text:
            final_user_message += "\n\n[Document Context]\n" + uploaded_text[:3000]

        conversation_history.append({
            "role": "user",
            "content": final_user_message
        })

        # =========================
        # MEMORY LIMIT
        # =========================

        if len(conversation_history) > 25:
            conversation_history = [conversation_history[0]] + conversation_history[-24:]

        # =========================
        # API PAYLOAD
        # =========================

        payload = {
            "model": "openai/gpt-4o-mini",
            "messages": conversation_history,
            "temperature": 0.6,
            "max_tokens": 250
        }

        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=25
        )

        # =========================
        # SAFE JSON PARSE FIX
        # =========================

        try:
            result = response.json()
        except Exception:
            return jsonify({"reply": "Invalid response from AI server."})

        print("RAW:", result)

        if "choices" not in result:
            return jsonify({"reply": "MindMeld AI is temporarily unavailable."})

        bot_reply = result["choices"][0]["message"]["content"]

        bot_reply = bot_reply.replace("ChatGPT", "MindMeld AI").strip()

        conversation_history.append({
            "role": "assistant",
            "content": bot_reply
        })

        return jsonify({"reply": bot_reply})

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"reply": "Server error. Please try again."})


# =========================
# PDF UPLOAD
# =========================

@app.route("/upload", methods=["POST"])
def upload_file():

    global uploaded_text

    try:
        file = request.files.get("file")

        if not file:
            return jsonify({"success": False, "message": "No file uploaded."})

        if file.filename.endswith(".pdf"):

            pdf_reader = PyPDF2.PdfReader(file)

            extracted_text = ""

            # FIX: removed duplicate text bug
            for page in pdf_reader.pages:
                text = page.extract_text() or ""
                extracted_text += text + "\n"

            uploaded_text = extracted_text

            return jsonify({
                "success": True,
                "message": "PDF analyzed successfully.",
                "preview": extracted_text[:1000]
            })

        return jsonify({
            "success": False,
            "message": "Only PDF files supported."
        })

    except Exception as e:
        print("UPLOAD ERROR:", e)
        return jsonify({"success": False, "message": "Error reading file."})


# =========================
# CLEAR MEMORY
# =========================

@app.route("/clear", methods=["POST"])
def clear_memory():

    global uploaded_text
    global conversation_history

    uploaded_text = ""

    conversation_history = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT
        }
    ]

    return jsonify({"success": True})


# =========================
# RUN SERVER
# =========================

if __name__ == "__main__":
    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )

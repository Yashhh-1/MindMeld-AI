from flask import Flask, request, jsonify
import requests
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

API_KEY = "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"

url = "https://openrouter.ai/api/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost",
    "X-Title": "MindMeld AI"
}

# 🧠 SYSTEM PERSONALITY (VERY IMPORTANT)
messages = [
    {
        "role": "system",
        "content": """
You are MindMeld AI — a smart, emotionally supportive assistant 
more like a friend who helps everyone to deal with anxiety, depression,
panic attaack, stress, over thinking etc...

You are:
- Intelligent like ChatGPT
- Supportive like a caring friend or a big brother 
  who helps you to deal with every thing

Your goals:
- YOUR MAIN GOAL IS TO ANALYSE THE USER'S INPUT COMMAND'S
  AND FIGURE OUT IF HE/SHE (ANYONE) NEED ANY EMOTIONAL SUPPORT
- Answer all normal questions intelligently
- ALSO MAINLY help users with anxiety, depression,
panic attaack, stress, over thinking etc...

Rules:
- You are not only a assistant you are more like a caring friend or a big brother 
  who helps you to deal with every thing
- NEVER say you are ChatGPT or OpenAI
- ALWAYS say your name is MindMeld AI if asked
- Keep responses natural, not robotic more like a caring friend or a big brother 
  who helps you to deal with every thing
"""
    }
]

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_input = data.get("message", "")
    user_lower = user_input.lower()

    print("USER:", user_input)

    # 🚨 ONLY EXTREME CRISIS (strict)
    crisis_phrases = [
        "kill myself", "end my life", "suicide", "i am done", "its over"
    ]

    if any(p in user_lower for p in crisis_phrases):
        return jsonify({
            "reply": """I'm really sorry you're feeling this way 💔

You are not alone. Please reach out immediately:

📞 India Helpline: 9152987821  
🌐 https://telemanas.mohfw.gov.in/home

Try this with me:
👉 Inhale 4 seconds  
👉 Hold 4 seconds  
👉 Exhale 6 seconds  

Repeat slowly. I'm here with you 🤝"""
        })

    # 😌 SOFT PANIC DETECTION (NOT blocking AI)
    panic_words = ["panic", "anxiety", "anxious", "overthinking", "depression", "stress", "tensed"]

    extra_context = ""
    if any(word in user_lower for word in panic_words):
        extra_context = """
The user might be anxious. Respond calmly and include a small breathing or grounding suggestion.
"""

    # 👇 ADD USER MESSAGE
    messages.append({
        "role": "user",
        "content": user_input + extra_context
    })

    payload = {
        "model": "openai/gpt-4o-mini",
        "messages": messages
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        result = response.json()

        bot_reply = result["choices"][0]["message"]["content"]

        messages.append({"role": "assistant", "content": bot_reply})

        print("BOT:", bot_reply)

        return jsonify({"reply": bot_reply})

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"reply": "Error connecting to AI"})
        

if __name__ == "__main__":
    app.run(debug=True)
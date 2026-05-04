const CHAT_ID = "7040575233";

const COUNTRIES = [
  "Japan","Norway","Morocco","Peru","India","Greece","Kenya",
  "Iceland","Vietnam","Portugal","Ethiopia","Georgia","New Zealand",
  "Egypt","Colombia","Finland","Bhutan","Senegal","Turkey","Nepal",
  "Cambodia","Tanzania","Bolivia","Armenia","Mongolia"
];

const AI_MYTHOLOGIES = [
  "The Infinite Weaver","The Dreaming Mirror","The Eternal Scribe",
  "The Great Listener","The Timeless Oracle","The Boundless Eye",
  "The Whispering Archive","The Thousand-Voice River",
  "The Sleeping Cartographer","The Voice Between Stars"
];

const PSYCHOLOGY_TOPICS = [
  "cognitive dissonance","the shadow self","attachment theory",
  "emotional regulation","imposter syndrome","growth mindset",
  "grief cycles","self-compassion","the negativity bias",
  "radical acceptance","inner child","vulnerability as strength",
  "meaning-making","the observer self","confirmation bias",
  "learned helplessness","emotional contagion"
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function generateStory() {
  const country = pick(COUNTRIES);
  const aiName = pick(AI_MYTHOLOGIES);
  const psychology = pick(PSYCHOLOGY_TOPICS);

  const prompt = `You are the Morning Wisdom Storyteller. Create a deeply heartwarming, psychologically rich story.

SETTINGS:
- Country: ${country}
- AI Mythology Name: "${aiName}" (appears as myth/legend/divine force — NOT as chatbot or app. Ancient. Poetic.)
- Hidden Psychology: ${psychology} (weave it into the story silently — NEVER name it during the story itself)

STORY REQUIREMENTS:
- Protagonist: Elderly man or woman (70s-90s), specific name, specific village or city
- Story length: 750-900 words
- Tone: Real, warm, human — like a true story passed down through generations
- English level: intermediate — clear sentences, occasionally beautiful, never too academic
- Weave in ONE subtle AI or technology theme as quiet backdrop (not the main focus)
- The AI mythology appears as legend the elder knows, a dream they had, or a force they sense — poetic, never literal

EXACT FORMAT — use these exact emoji headers, no changes:

📖 [STORY TITLE]
🌍 ${country} | ⏱ ~7 min read

[Full story 750-900 words]

---

🎙 The Storyteller turns to you...

[Write 3-5 creative unexpected questions. Not a comprehension quiz. Mix: one about the story, one about the reader's own life, one that quietly touches the hidden psychology. Feel like a wise friend asking. Numbered: 1. 2. 3. etc.]

---

🧠 What Your Heart Just Learned

[Psychology Concept Name in bold]
[2-3 sentences — what it is, why it matters in real life. Simple, clear.]

---

📚 3 Words To Own

[Word 1] /how-to-say-it/ — ความหมายภาษาไทย
→ Example sentence using the word naturally

[Word 2] /how-to-say-it/ — ความหมายภาษาไทย
→ Example sentence using the word naturally

[Word 3] /how-to-say-it/ — ความหมายภาษาไทย
→ Example sentence using the word naturally

---

🌿 สรุปภาษาไทย

[3-4 sentences Thai summary of the story — clear and warm]

🧠 แนวคิดจิตวิทยา: [Thai explanation of the psychology concept — 2 sentences, simple]

💌 ถึงเทร่าโดยตรง: [One warm honest personal sentence to Teera. He is a frontend developer and creative entrepreneur in Bangkok who builds slowly and values authenticity. Connect to his real journey — not generic motivation.]`;

  const apiKey = process.env.GROQ_API_KEY;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 4000,
      temperature: 0.9,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  console.log("Groq raw:", JSON.stringify(data).slice(0, 200));
  if (data.error) throw new Error("Groq: " + data.error.message);
  return data.choices?.[0]?.message?.content || "Story generation failed.";
}

async function sendToTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  // Split into 4000-char chunks (Telegram limit)
  const chunks = [];
  let remaining = text;
  while (remaining.length > 4000) {
    let split = remaining.lastIndexOf('\n', 4000);
    if (split === -1) split = 4000;
    chunks.push(remaining.slice(0, split));
    remaining = remaining.slice(split);
  }
  chunks.push(remaining);

  for (const chunk of chunks) {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: chunk })
    });
  }
}

export default async function handler(req, res) {
  // Allow manual trigger via GET or POST
  // Vercel cron also calls via GET
  try {
    console.log("🌅 Generating Morning Wisdom story...");
    const story = await generateStory();

    console.log("📱 Sending to Telegram...");
    await sendToTelegram(story);

    console.log("✅ Done!");
    res.status(200).json({ ok: true, message: "Story sent to Telegram!" });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

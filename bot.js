require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const { Ollama } = require("ollama");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
  ]
});

const MODEL = process.env.MODEL || "mistral";
const OLLAMA_URL = process.env.OLLAMA_URL || "https://ollama.com";
const CHANNEL_LIMIT = process.env.TRANSLATE_CHANNEL || null;

const FLAG_LANG = {
  "🇺🇸": "English",
  "🇵🇭": "Filipino (Tagalog)",
  "🇲🇾": "Malay",
  "🇫🇷": "French",
  "🇵🇱": "Polish",
  "🇩🇪": "German",
  "🇪🇸": "Spanish",
  "🇮🇹": "Italian",
  "🇷🇺": "Russian ",
  "🇨🇳": "Chinese (Simplified)",
  "🇧🇷": "Portuguese (Brazilian)",
};

const oll = new Ollama({
  host: OLLAMA_URL,
  headers: {
    Authorization: "Bearer " + process.env.OLLAMA_API_KEY,
  },
});

async function aiTranslate(text, targetLang) {

  try {

    const prompt = `
You are a professional translator.

Translate the message into ${targetLang}.
Preserve meaning and tone.
Return ONLY the translated sentence.

Message:
${text}
`;

    const response = await oll.chat({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.message.content.trim();

  } catch (err) {
    console.error("AI translation error:", err.message);
    return null;
  }
}

client.once("ready", () => {
  console.log(`🤖 AI Translator ready: ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;
  if (!message.content.trim()) return;

  if (CHANNEL_LIMIT && message.channel.id !== CHANNEL_LIMIT) return;

  try {

    for (const emoji of Object.keys(FLAG_LANG)) {
      if (!message.reactions.cache.has(emoji)) {
        await message.react(emoji);
      }
    }

  } catch (err) {
    console.log("Reaction error:", err.message);
  }

});

client.on("messageReactionAdd", async (reaction, user) => {

  if (user.bot) return;

  const emoji = reaction.emoji.name;

  if (!FLAG_LANG[emoji]) return;

  const message = reaction.message;

  if (message.author.bot) return;

  const targetLang = FLAG_LANG[emoji];

  try {

    const translated = await aiTranslate(message.content, targetLang);

    if (!translated) return;

    await message.reply(
      `${emoji} **${targetLang} Translation:**\n${translated}`
    );

  } catch (err) {
    console.error("Reaction translate error:", err.message);
  }

});

client.login(process.env.DISCORD_TOKEN);
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import NodeCache from "node-cache";
import { Client, GatewayIntentBits } from "discord.js";

dotenv.config();
const app = express();
app.use(bodyParser.json());
const cache = new NodeCache({ stdTTL: 3600 });
const PORT = process.env.PORT || 3000;

// Discord bot client
const discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });
discordClient.login(process.env.DISCORD_BOT_TOKEN).then(() => {
  console.log("✅ Discord bot logged in (backend)");
});

// Search Steam API
async function searchSteam(query, cc = "ru") {
  const res = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&cc=${cc}`);
  const json = await res.json();
  return json.items || [];
}

async function steamDetails(appid, cc = "ru") {
  const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}&cc=${cc}&l=ru`);
  const json = await res.json();
  return json[String(appid)]?.data || null;
}
async function aiSuggestGamesFromPrompt(prompt) {
  if (!process.env.OPENAI_API_KEY) return [];

  const apiUrl = "https://api.deepseek.com/v1/chat/completions"; // DeepSeek endpoint
  const body = {
    model: "deepseek-chat",
    messages: [
      { role: "system", content: "Ты помощник по играм. Получив описание, предложи 3-6 современных PC-игр. Ответ — только в виде JSON массива, например: [\"Cyberpunk 2077\", \"Baldur's Gate 3\", \"Hades\"]" },
      { role: "user", content: prompt }
    ],
    temperature: 0.8,
    max_tokens: 200
  };

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";

  try {
    const games = JSON.parse(text);
    if (Array.isArray(games)) return games;
  } catch {
    const matches = [...text.matchAll(/"([^"]+)"/g)].map(m => m[1]);
    if (matches.length) return matches;
  }

  return [];
}

// Route: /api/findGame
app.post("/api/findGame", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "query required" });

  const items = await searchSteam(query);
  if (!items.length) return res.status(404).json({ error: "no results" });

  const game = items[0];
  const details = await steamDetails(game.id);
  res.json({
    title: details.name,
    price: details.price_overview ? details.price_overview.final_formatted : details.is_free ? "Free" : "—",
    image: details.header_image,
    url: `https://store.steampowered.com/app/${game.id}`,
    description: details.short_description
  });
});

// Route: /api/send-to-discord
app.post("/api/send-to-discord", async (req, res) => {
  const { game } = req.body;
  if (!game) return res.status(400).json({ error: "game required" });

  try {
    const channel = await discordClient.channels.fetch(process.env.DISCORD_NOTIFY_CHANNEL_ID);
    if (!channel) throw new Error("channel not found");

    await channel.send({
      content: `🎮 **${game.title}**
💰 ${game.price}
🔗 ${game.url}
📝 ${game.description?.slice(0, 200) || "Без описания"}`
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));

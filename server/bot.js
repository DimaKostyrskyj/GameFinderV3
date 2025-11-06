import { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } from "discord.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const API_BASE = "http://localhost:3000";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
  new SlashCommandBuilder()
    .setName("price")
    .setDescription("Показать цену игры")
    .addStringOption(opt => opt.setName("игра").setDescription("Название игры").setRequired(true))
    .toJSON()
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function register() {
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
  console.log("✅ Slash-команды зарегистрированы");
}

client.on("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  register();
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "price") {
    const query = interaction.options.getString("игра");
    await interaction.deferReply();
    const res = await fetch(`${API_BASE}/api/findGame`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    const game = await res.json();
    if (!game.title) return interaction.editReply("❌ Игра не найдена");

    const embed = new EmbedBuilder()
      .setTitle(game.title)
      .setURL(game.url)
      .setDescription(game.description || "Без описания")
      .setThumbnail(game.image)
      .addFields({ name: "Цена", value: game.price })
      .setColor(0x5865f2);

    interaction.editReply({ embeds: [embed] });
  }
});

client.login(TOKEN);

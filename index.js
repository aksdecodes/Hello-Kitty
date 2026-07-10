require("dotenv").config();
const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

const waitingUsers = [];
const activeChats = {};

function disconnectUsers(userId) {
  const partnerId = activeChats[userId];

  if (!partnerId) return null;

  delete activeChats[userId];
  delete activeChats[partnerId];

  return partnerId;
}



bot.start((ctx) => {
  ctx.reply(
    "🎀 Welcome to Hello Kitty Anonymous Chat!🐱\n\nUse /find to find a random partner."
  );
});

bot.command("find", (ctx) => {
  const userId = ctx.from.id;

  // Already chatting
  if (activeChats[userId]) {
    return ctx.reply("💬 You are already connected to someone.");
  }

  // Prevent duplicate queue entries
  if (waitingUsers.includes(userId)) {
    return ctx.reply("⏳ You are already waiting for a partner...");
  }

  if (waitingUsers.length > 0) {
    const partnerId = waitingUsers.shift();

    activeChats[userId] = partnerId;
    activeChats[partnerId] = userId;

    bot.telegram.sendMessage(
      userId,
      "🎉 Partner found! Say hello."
    );

    bot.telegram.sendMessage(
      partnerId,
      "🎉 Partner found! Say hello."
    );
  } else {
    waitingUsers.push(userId);
    ctx.reply("🔍 Searching for a partner...");
  }
});





bot.command("next", async (ctx) => {
  const userId = ctx.from.id;

  const partnerId = disconnectUsers(userId);

  if (partnerId) {
    await bot.telegram.sendMessage(
      partnerId,
      "💔 Your partner left the chat.\nUse /find to find another partner."
    );
  }

  if (waitingUsers.length > 0) {
    const newPartner = waitingUsers.shift();

    activeChats[userId] = newPartner;
    activeChats[newPartner] = userId;

    await bot.telegram.sendMessage(
      userId,
      "🎉 New partner found!"
    );

    await bot.telegram.sendMessage(
      newPartner,
      "🎉 New partner found!"
    );
  } else {
    waitingUsers.push(userId);

    await ctx.reply(
      "🔍 Searching for a new partner..."
    );
  }
});

bot.command("stop", async (ctx) => {
    const userId = ctx.from.id;

    const partnerId = disconnectUsers(userId);

    if (!partnerId) {
        return ctx.reply("❌ You are not in a chat.");
    }

    await ctx.reply("❌ Chat ended.");

    await bot.telegram.sendMessage(
        partnerId,
        "💔 Your partner ended the chat.\nUse /find to find another partner."
    );
});

bot.on("text", async (ctx) => {
  const userId = ctx.from.id;

  // Ignore commands
  if (ctx.message.text.startsWith("/")) return;

  const partnerId = activeChats[userId];

  if (partnerId) {
    await bot.telegram.sendMessage(
      partnerId,
      ctx.message.text
    );
  }
});

bot.launch();

console.log("🎀 Bot Running...");
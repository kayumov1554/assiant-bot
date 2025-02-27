require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

// .env faylidan tokenlarni olish
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Botni ishga tushirish
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

console.log("🤖 Telegram bot ishga tushdi...");

// Foydalanuvchi /start bosganda javob berish
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `Assalomu aleykum 👋 

<pre>Suniy Intelekt</pre> 
bot ishlamoqda savolingizni yuboring men tez orada javob beraman`,
    {
      parse_mode: "HTML",
    }
  );
});

// Foydalanuvchi xabar yozganda OpenAI API'ga yuborish
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  // Agar foydalanuvchi buyruq yozgan bo‘lsa, e'tiborga olinmasin
  if (userMessage.startsWith("/")) return;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: userMessage }],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const replyText = response.data.choices[0].message.content;
    bot.sendMessage(chatId, replyText);
  } catch (error) {
    console.error("OpenAI xatosi:", error);
    bot.sendMessage(chatId, "Kechirasiz, bog‘lanishda xatolik yuz berdi.");
  }
});

require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const express = require("express");
const app = express();
const PORT = 3000;

// .env faylidan tokenlarni olish
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Botni ishga tushirish
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });



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

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  // Agar foydalanuvchi buyruq yozgan bo‘lsa, e'tiborga olinmasin
  if (userMessage === "/start") return;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-turbo",
        messages: [{ role: "system", content: userMessage }],
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


// Foydalanuvchi xabar yozganda OpenAI API'ga yuborish
app.listen(PORT, () => {
  console.log(`✅ API server http://localhost:${PORT} da ishlayapti`);
});

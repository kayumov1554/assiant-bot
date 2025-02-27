require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fs = require("fs");
const path = require("path")
const {exec} = require("child_procces");

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

  // Agar foydalanuvchi buyruq yozgan bo‘lsa, e'tiborga olinmasin
  if (msg.text === "/start") return;

  // Ovozli xabar tekshirish
  if (msg.voice) {
    const fileId = msg.voice.file_id;
    const fileUrl = await bot.getFileLink(fileId);
    const audioPath = path.join(__dirname, "voice.ogg");

    // Ovoz faylini yuklab olish
    const writer = fs.createWriteStream(audioPath);
    const response = await axios({ url: fileUrl, responseType: "stream" });
    response.data.pipe(writer);

    writer.on("finish", async () => {
      try {
        // OpenAI Whisper API orqali ovozni matnga o‘girish
        const formData = new FormData();
        formData.append("file", fs.createReadStream(audioPath));
        formData.append("model", "whisper-1");

        const whisperResponse = await axios.post(
          "https://api.openai.com/v1/audio/transcriptions",
          formData,
          {
            headers: {
              Authorization: Bearer ${OPENAI_API_KEY},
              ...formData.getHeaders(),
            },
          }
        );

        const userMessage = whisperResponse.data.text;

        // GPT-4 Turbo orqali javob olish
        const gptResponse = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-4-turbo",
            messages: [{ role: "user", content: userMessage }],
          },
          {
            headers: {
              Authorization: Bearer ${OPENAI_API_KEY},
              "Content-Type": "application/json",
            },
          }
        );

        const replyText = gptResponse.data.choices[0].message.content;
        
        // OpenAI tts-1 modeli bilan javobni ovozga o‘girish
        const ttsResponse = await axios.post(
          "https://api.openai.com/v1/audio/speech",
          {
            model: "tts-1",
            input: replyText,
            voice: "nova",
          },
          {
            headers: {
              Authorization: Bearer ${OPENAI_API_KEY},
              "Content-Type": "application/json",
            },
            responseType: "arraybuffer",
          }
        );

        const outputAudioPath = path.join(__dirname, "response.ogg");
        fs.writeFileSync(outputAudioPath, ttsResponse.data);

        // Javobni ovoz orqali jo‘natish
        await bot.sendVoice(chatId, outputAudioPath);
      } catch (error) {
        console.error("Xatolik:", error);
        bot.sendMessage(chatId, "Kechirasiz, xatolik yuz berdi.");
      }
    });
    return;
  }

  // Matnli xabarlar uchun GPT-4 Turbo ishlatish
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: msg.text }],
      },
      {
        headers: {
          Authorization: Bearer ${OPENAI_API_KEY},
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

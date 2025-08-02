// 📁 bot.js

import pkg from '@whiskeysockets/baileys';
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = pkg;

import P from "pino";
import { Boom } from "@hapi/boom";
import { askChatGPT } from "./services/chatgpt.js";
import { academyBot } from "./routes/academy.js";

export async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: P({ level: "silent" }),
    printQRInTerminal: true,
    auth: state,
    browser: ["Alfred Bot", "Chrome", "1.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  // ✅ Show connected number
  sock.ev.on('connection.update', ({ connection }) => {
    if (connection === 'open') {
      console.log('✅ Connected as:', sock.user.id);
    }
  });

  // 💬 On new message
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
    if (!text) return;

    console.log(`📩 Message from ${sender}: ${text}`);

    // Simple auto-reply
    if (text.toLowerCase() === "hi") {
      await sock.sendMessage(sender, { text: "Hello! 👋 I'm Alfred Bot. How can I help you today?" });
    }

    // Academy bot replies
    const academyResponse = academyBot(text);
    if (academyResponse) {
      await sock.sendMessage(sender, { text: academyResponse });
    }

    // GPT command
    if (text.toLowerCase().startsWith("gpt ")) {
      const reply = await askChatGPT(text.slice(4));
      await sock.sendMessage(sender, { text: reply });
    }
  });

  // 👥 Auto-welcome new group members
  sock.ev.on("group-participants.update", async ({ id, participants, action }) => {
    for (let user of participants) {
      if (action === "add") {
        await sock.sendMessage(id, {
          text: `🎉 Welcome <@${user.split("@")[0]}> to the group!`,
          mentions: [user]
        });
      }
    }
  });
}

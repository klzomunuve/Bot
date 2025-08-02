// 📁 bot.js

import pkg from '@whiskeysockets/baileys';
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = pkg;

import P from "pino";
import { Boom } from "@hapi/boom";
import qrcode from 'qrcode-terminal';
import { askChatGPT } from "./services/chatgpt.js";
import { academyBot } from "./routes/academy.js";

export async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: P({ level: "silent" }),
    auth: state,
    browser: ["Alfred Bot", "Chrome", "1.0"]
  });

  // ✅ Handle QR code + connection status
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('📸 Scan this QR to link your WhatsApp:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      console.log('✅ Connected as:', sock.user.id);
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
      console.log('❌ Disconnected. Reconnecting:', shouldReconnect);
      if (shouldReconnect) startBot();
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // 💬 Message listener
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
    if (!text) return;

    console.log(`📩 Message from ${sender}: ${text}`);

    // Simple reply
    if (text.toLowerCase() === "hi") {
      await sock.sendMessage(sender, { text: "Hello! 👋 I'm Alfred Bot. How can I help you today?" });
    }

    // Business bot (Alfred Academy)
    const academyResponse = academyBot(text);
    if (academyResponse) {
      await sock.sendMessage(sender, { text: academyResponse });
    }

    // GPT feature
    if (text.toLowerCase().startsWith("gpt ")) {
      const reply = await askChatGPT(text.slice(4));
      await sock.sendMessage(sender, { text: reply });
    }
  });

  // 👥 Group welcome
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

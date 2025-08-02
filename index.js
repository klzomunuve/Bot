import express from "express";
import dotenv from "dotenv";
import readline from "readline";
import { startBot } from "./bot.js";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Alfred WhatsApp Bot is running.");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🌐 Server running...");
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("📞 Enter your WhatsApp number: ", (number) => {
  console.log(`🔐 Now linking with ${number}...`);
  startBot();
  rl.close();
});

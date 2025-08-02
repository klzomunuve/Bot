import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export async function askChatGPT(prompt) {
  try {
    const res = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      }
    });
    return res.data.choices[0].message.content;
  } catch (err) {
    console.error("GPT error:", err.message);
    return "Sorry, I couldn't process that.";
  }
}

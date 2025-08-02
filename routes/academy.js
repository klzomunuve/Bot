export function academyBot(message) {
  const text = message.toLowerCase();
  if (text.includes("fee") || text.includes("payment")) {
    return "📚 Alfred Academy: Our fee structure is available at https://alfredacademy.com/fees";
  } else if (text.includes("unit") || text.includes("register")) {
    return "📝 Alfred Academy: You can register your units here: https://alfredacademy.com/units";
  }
  return null;
}

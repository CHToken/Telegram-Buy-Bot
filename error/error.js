const { Telegraf } = require("telegraf");

const bot = new Telegraf("5561811963:AAFV83oL535KmiZOHwkSIybgiwmoCAxUCxQ");

module.exports = function ({ err, name, ctx }) {
  const headers = JSON.stringify(err?.response?.headers, null, "-  ") || null;
  const request = JSON.stringify(err?.request, null, "-  ") || null;
  const config = JSON.stringify(err?.config, null, "-  ") || null;
  const message = err?.message || null;
  const status = err?.status || null;
  const data = err?.data || null;

  let stringMessage;

  if (err.response) {
    stringMessage = `Data: ${data}\n\nStatus: ${status}\n\nHeaders: ${headers}\n\nConfig: ${config}`;
  } else if (err.request) {
    stringMessage = `Request: ${request}\n\nConfig: ${config}`;
  } else {
    stringMessage = `Message: ${message}\n\nConfig: ${config}`;
  }
  if (err.name === "TypeError") {
    ctx.reply("can't read test");
  }

  // notify user
  ctx.reply(`Error ${message}...Start again`);
};

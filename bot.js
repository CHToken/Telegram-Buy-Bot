const Telegraf = require("telegraf");
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });

const bot = new Telegraf(process.env.BOT);

module.exports = bot;

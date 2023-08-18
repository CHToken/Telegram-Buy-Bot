const Transaction = require("./crypt");
const User = require("../models/userModel");

class Bot {
  constructor(bot) {
    this.bot = bot;
    this.transaction = new Transaction();
  }

  sendMessages(message, chatId, image) {
    if (image === "Not Set" || !image) {
      this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });
    } else {
      // Add the button here
      const buttonOptions = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Follow us!",
                url: "https://t.me/PopperPortal/",
              },
            ],
          ],
        },
      };
      this.bot.telegram.sendPhoto(chatId, image, {
        caption: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...buttonOptions, // Spread the button options here
      });
    }
  }

  async watchChanges() {
    try {
      const users = await User.find();
      for (const user of users) {
        await this.transaction.getTransaction((message) =>
          this.sendMessages(message, user.chatId, user.mImage)
        );
      }
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = Bot;

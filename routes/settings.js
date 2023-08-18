module.exports = (text) => {
  const bot = require("../bot");
  const { Composer } = require("telegraf");
  const User = require("../models/userModel");
  const settingsRoute = new Composer();

  settingsRoute.action("setting", function (ctx) {
    if (mainId[0] == undefined) {
      return ctx.reply("Click The Link from your group again");
    } else {
      ctx.deleteMessage();
      User.find({ chatId: mainId[0] }, (error, data) => {
        if (error) {
          console.log(err);
        } else {
          console.log(data[0]?.ethAddress);
          if (
            data[0]?.ethAddress == null ||
            data[0]?.ethAddress.name == undefined
          ) {
            ctx.reply(
              "No token Registered To the group... Trying adding a New token"
            );
          } else {
            bot.telegram.sendMessage(ctx.chat.id, text.setting, {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: `${data[0].ethAddress.name}`,
                      callback_data: "tsetting",
                    },
                  ],
                  [
                    {
                      text: `>>cancel`,
                      callback_data: "cancel",
                    },
                  ],
                ],
              },
            });
          }
        }
      });
    }
  });

  return settingsRoute;
};

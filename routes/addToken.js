module.exports = (text, groupNameee) => {
  const bot = require("../bot");
  const { Composer } = require("telegraf");
  const Group = require("../models/groupModel");
  const User = require("../models/userModel");
  const addTokenRoute = new Composer();

  addTokenRoute.hears(["/addtoken", "/buildsettings"], async (ctx, next) => {
    if (!ctx.session) {
      ctx.session = {};
    }

    if (ctx.chat && ctx.chat.id && ctx.update.message) {
      let admi = ctx.update.message.chat._admins;
      groupNameee.unshift(ctx.chat.title);
      console.log(ctx.chat.id);
      console.log(admi);
      await User.findOne({ chatId: ctx.chat.id }).then((user) => {
        if (user) {
          Group.findOne({ chatId: ctx.chat.id }, (error, doc) => {
            if (error) {
              console.log(error);
            } else {
              doc.updateOne({ $set: { adminList: admi } }, (error, ree) => {
                if (error) {
                  console.log(error);
                } else {
                  console.log("New=>", ree);
                }
              });
              console.log(doc);
            }
          });
          next();
        } else {
          User.create({
            chatId: ctx.chat.id,
            step: "5",
            cSupply: "0",
            emoji: "",
            mEnable: false,
            mImage: "Not Set",
            timeStamp: "0000000",
            hash: "nill",
          }).then((neww) => {
            console.log(neww);
            groupNameee.unshift(ctx.chat.title);
            Group.create({
              chatId: ctx.chat.id,
              groupName: ctx.chat.title,
              updateId: 0o0,
              adminList: admi,
            }).then((upda) => {
              console.log(upda);
            });
          });
        }
      });
    } else {
      return next();
    }

    const test_welcome = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Click Me",
              url: `http://t.me/BasePopperBuyBot?start=${ctx.chat.id}`,
            },
          ],
        ],
      },
      parse_mode: "HTML",
    };
    bot.telegram.sendMessage(ctx.chat.id, text.welcome, test_welcome);
  });

  return addTokenRoute;
};

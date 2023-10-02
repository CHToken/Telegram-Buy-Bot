import { WizardScene } from 'telegraf';
const teleLinkScene = new WizardScene('teleLink',
  (ctx) => {
    bot.action("tele", function (ctx) {
        if (mainId[0] == undefined) {
          return ctx.reply("Click The Link from your group again");
        } else {
          ctx.deleteMessage();
          const chatId = mainId[0];
          User.find({ chatId }, (error, data) => {
            if (error) {
              console.log(error);
            } else {
              bot.telegram.sendMessage(ctx.chat.id, "What do you want to do", {
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "View Current Link",
                        callback_data: `currentLink`,
                      },
                    ],
                    [
                      {
                        text: "Add/Update Link",
                        callback_data: `updateTele`,
                      },
                    ],
                  ],
                },
              });
            }
          });
        }
      });    
},
(ctx) => {
    bot.action("currentLink", (ctx) => {
        if (mainId[0] == undefined) {
          return ctx.reply("Click The Link from your group again");
        } else {
          ctx.deleteMessage();
          chatId = mainId[0];
          User.find({ chatId }, (error, data) => {
            if (error) {
              console.log(error);
            } else {
              if (data[0].telegram == "Not Set") {
                ctx.reply("No Link saved yet");
              } else {
                ctx.reply(`Your link is: ${data[0].telegram}`);
              }
            }
          });
        }
      });
}
);

export default teleLinkScene;
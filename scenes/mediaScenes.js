import { WizardScene } from 'telegraf';

const mediaScene = new WizardScene('media',
(ctx) => {
    ctx.reply(`Please type in 'true' for Yes and "false" for No`);
    ctx.wizard.state.data = {};
    return ctx.wizard.next();
  },
  (ctx) => {
    if (ctx?.message?.text == undefined) {
      ctx.scene.leave();
    } else {
      ctx.wizard.state.data.address = ctx.message.text;
      const menable = ctx.wizard.state.data.address;
      console.log(ctx.chat.id);

      const user = User.findOneAndUpdate(
        { chatId: mainId[0] },
        { mEnable: `${menable}` },
        (error, data) => {
          if (error) {
            ctx.reply(
              `Not Accepted... Type either "true" or "false" in small letters`
            );
          } else {
            bot.telegram.sendMessage(ctx.chat.id, `Saved Successfully`, {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: `>>Back`,
                      callback_data: "tsetting",
                    },
                  ],
                ],
              },
            });
          }
        }
      );
      return ctx.scene.leave();
    }
  }
);

export default mediaScene;

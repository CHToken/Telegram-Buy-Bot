import { WizardScene } from 'telegraf';

const emojiScene = new WizardScene('emoji',
(ctx) => {
  ctx.reply(`Input Emoji`);
  ctx.wizard.state.data = {};
  return ctx.wizard.next();
},
(ctx) => {
  if (ctx?.message?.text == undefined) {
    ctx.scene.leave();
  } else {
    ctx.wizard.state.data.address = ctx.message.text;
    const emoji = ctx.wizard.state.data.address;

    const user = User.findOneAndUpdate(
      { chatId: mainId[0] },
      { emoji: `${emoji}` },
      (error, data) => {
        if (error) {
          ctx.reply(`Not accepted`);
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

export default emojiScene;

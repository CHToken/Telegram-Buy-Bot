import { WizardScene } from 'telegraf';

const stepScene = new WizardScene('step',
"step",
(ctx) => {
  ctx.reply(`Input Step Amount`);
  ctx.wizard.state.data = {};
  return ctx.wizard.next();
},
(ctx) => {
  if (ctx?.message?.text == undefined) {
    ctx.scene.leave();
  } else {
    ctx.wizard.state.data.address = ctx.message.text;
    const step = ctx.wizard.state.data.address;
    console.log(ctx.chat.id);
    const chatId = ctx.chat.id;
    const user = User.findOneAndUpdate(
      { chatId: mainId[0] },
      { step: `${step}` },
      (error, data) => {
        if (error) {
          ctx.reply("Not Valid... Numbers only");
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

export default stepScene;
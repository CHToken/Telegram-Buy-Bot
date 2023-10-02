import { WizardScene } from 'telegraf';

const cSupplyScene = new WizardScene("cSupply",
(ctx) => {
  ctx.reply(`Input New Circulating Supply`);
  ctx.wizard.state.data = {};
  return ctx.wizard.next();
},
(ctx) => {
  if (ctx?.message?.text == undefined) {
    ctx.scene.leave();
  } else {
    ctx.wizard.state.data.address = ctx.message.text;
    const supply = ctx.wizard.state.data.address;
    console.log(ctx.chat.id);

    // Update the cSupply value for the user
    User.findOneAndUpdate(
      { chatId: mainId[0] },
      { cSupply: `${supply}` },
      (error, data) => {
        if (error) {
          ctx.reply("Numbers only");
        } else {
          bot.telegram.sendMessage(
            ctx.chat.id,
            `Circulating Supply Updated Successfully`,
            {
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
            }
          );
        }
      }
    );
    return ctx.scene.leave();
  }
}
);

export default cSupplyScene;

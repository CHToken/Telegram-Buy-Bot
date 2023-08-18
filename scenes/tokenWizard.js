const WizardScene = require("telegraf/scenes/wizard");
const verifyToken = require("../ethvalidate");
const User = require("../models/userModel");

module.exports = function createTokenWizard(mainId) {
  const tokenWizard = new WizardScene(
    "token",
    (ctx) => {
      ctx.reply(
        "Please paste the TOKEN address of the token you would like PopperBuyBot to track."
      );
      ctx.wizard.state.data = {};
      return ctx.wizard.next();
    },
    async (ctx) => {
      if (ctx.message && ctx.message.text) {
        ctx.wizard.state.data.address = ctx.message.text;
        const tokenAddress = ctx.wizard.state.data.address;

        try {
          const res = await verifyToken.validateToken(tokenAddress);
          const { pairs } = res.data;

          if (pairs.length === 0 || pairs[0].chainId !== "ethereum") {
            ctx.reply("Address is not valid");
          } else {
            await User.findOneAndUpdate(
              { chatId: mainId[0] },
              {
                ethAddress: {
                  name: pairs[0].baseToken.name,
                  token_Address: pairs[0].baseToken.address,
                  pair_Address: pairs[0].pairAddress,
                },
              }
            );

            bot.telegram.sendMessage(ctx.chat.id, `Token found\n Tap to save`, {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: `${pairs[0].baseToken.symbol}/${pairs[0].quoteToken.symbol} \n\n ${pairs[0].pairAddress}`,
                      callback_data: "tsave",
                    },
                  ],
                ],
              },
            });
          }
        } catch (error) {
          console.error(error);
          ctx.reply("An error occurred while validating the token address.");
        }
      }

      return ctx.scene.leave();
    }
  );

  return tokenWizard;
};

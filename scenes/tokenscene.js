const { WizardScene, Stage } = require("telegraf");
const User = require("../models/userModel");
const verifyToken = require("../ethvalidate");


  const tokenVerify = new WizardScene(
    "token",
    (ctx, next) => {
      ctx.reply(
        `Please paste the TOKEN address of the token you would like PopperBuyBot to track.`
      );
      ctx.wizard.state.data = {};
      return ctx.wizard.next();
    },
    (ctx, next) => {
      if (ctx?.message?.text == undefined) {
        ctx.scene.leave();
        return;
      }
  
      const tokenAddress = ctx.message.text;
      verifyToken
        .validateToken(tokenAddress)
        .then((res) => {
          const { pairs } = res.data;
  
          if (pairs.length === 0 || pairs[0].chainId !== "ethereum") {
            ctx.reply("Address is not valid");
            ctx.scene.leave();
          } else {
            // Update the user's token information, including cSupply
            const updateData = {
              ethAddress: {
                name: pairs[0].baseToken.name,
                token_Address: pairs[0].baseToken.address,
                pair_Address: pairs[0].pairAddress,
              },
              cSupply: pairs[0].circulatingSupply || 0,
            };
  
            User.findOneAndUpdate({ chatId: mainId[0] }, updateData)
              .then((neww) => {
                if (neww) {
                  console.log("User data updated:", neww);
                  ctx.reply(`Token found\n Tap to save`, {
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
                } else {
                  console.log("User not found or update failed.");
                  ctx.reply("Error updating user data.");
                }
              })
              .catch((error) => {
                console.error("Error updating user data:", error);
                ctx.reply("Error occurred while updating user data.");
              });
  
            ctx.scene.leave();
          }
        })
        .catch((err) => {
          console.error(err);
          ctx.reply(
            err.message || "An error occurred while processing the request."
          );
          ctx.scene.leave();
        });
    }
  );

  module.exports = tokenVerify;

const User = require("./models/userModel");

export default function deleteTokenHandler(ctx) {
  // Add a new action for deleting tokens
bot.action("tokenDelete", async (ctx) => {
  if (mainId[0] == undefined) {
    return ctx.reply("Click The Link from your group again");
  } else {
    ctx.deleteMessage();

    // Create a confirmation step for token deletion
    ctx.reply("Are you sure you want to delete the token?", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Yes",
              callback_data: "confirmDelete",
            },
            {
              text: "No",
              callback_data: "cancelDelete",
            },
          ],
        ],
      },
    });
  }
});

// Implement the token deletion logic
bot.action("confirmDelete", async (ctx) => {
  if (mainId[0] == undefined) {
    return ctx.reply("Click The Link from your group again");
  } else {
    ctx.deleteMessage();

    // Find the user and group by chatId
    const chatId = mainId[0];
    const user = await User.findOne({ chatId });
    const group = await Group.findOne({ chatId });

    if (!user || !group) {
      return ctx.reply("User or group not found. Token deletion failed.");
    }

    // Delete the user's token information
    user.ethAddress = [];
    user.cSupply = 0;
    user.emoji = "💚";
    user.mEnable = false;
    user.mImage = "Not Set";
    user.mGif = "Not Set";
    user.timeStamp = 0;
    user.hash = "nill";
    await user.save();

    // Provide feedback to the user
    ctx.reply("Token deleted successfully!");

    // You may also want to delete the group entry if necessary
  }
});

// Handle cancel token deletion
bot.action("cancelDelete", async (ctx) => {
  ctx.deleteMessage();
  ctx.reply("Token deletion canceled.");
});
};

const User = require("./models/userModel");

module.exports = (deleteComposer) => {
  // Handle the token delete confirmation callback
  deleteComposer.action("confirmDelete", async (ctx) => {
    try {
      const chatId = mainId[0];
      const user = await User.findOne({ chatId });

      if (!user || !user.ethAddress || !user.ethAddress.name) {
        return ctx.reply("Token not found for this group.");
      }
      const tokenName = user.ethAddress.name;
      const deletedUser = await User.findOneAndRemove({
        "ethAddress.name": tokenName,
      });

      if (deletedUser) {
        ctx.reply("Token has been deleted successfully.");
        console.log(ctx.reply);
      } else {
        ctx.reply("Error deleting token");
      }
    } catch (error) {
      console.error(error);
      ctx.reply("Error occurred while processing the request.");
    }
  });

  // Handle the cancellation callback
  deleteComposer.action("cancelDelete", (ctx) => {
    ctx.deleteMessage();
    ctx.reply("Deletion canceled");
  });

  // Token Delete
  deleteComposer.action("tokenDelete", (ctx) => {
    if (mainId[0] == undefined) {
      return ctx.reply("Click The Link from your group again");
    } else {
      const name = ctx.match.split(":")[1];
      User.findOne({ chatId: mainId[0] }, "ethAddress", (error, data) => {
        if (error) {
          console.log(error);
          return ctx.reply("Error retrieving token information");
        }
        if (!data || !data.ethAddress || !data.ethAddress.name) {
          return ctx.reply("Token not found for this group.");
        }

        const tokenName = data.ethAddress.name;
        ctx.replyWithMarkdown(
          `Are you sure you want to delete the *${tokenName}*?\nClick Yes to Delete\nClick No to Cancel`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Yes", callback_data: "confirmDelete" }],
                [{ text: "No", callback_data: "cancelDelete" }],
              ],
            },
          }
        );
      });
    }
  });
};

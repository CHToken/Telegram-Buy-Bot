module.exports = (text) => {
  const { mainId } = require("../shared");
  const bot = require("../bot");
  const { Composer } = require("telegraf");
  const Group = require("../models/groupModel");
  const tokenActionsRoute = new Composer();

  tokenActionsRoute.hears(/\/start(.*)/, async (ctx, next) => {
    console.log(msg.update.update_id);

    let upd = msg.match.input.split(" ");
    mainId.unshift(upd[1]);
    let chatId = upd[1];
    Group.findOne(
      { chatId },
      { adminList: { $elemMatch: { "user.id": msg.update.message.from.id } } },
      (error, data) => {
        if (error) {
          console.log(error);
        } else {
          Group.findOneAndUpdate(
            { chatId },
            { updateId: msg.update.update_id },
            (error, upid) => {
              if (error) {
                console.log(error);
              } else {
                Group.findOne({ chatId }, (error, result) => {
                  if (error) {
                    console.log(error);
                  } else {
                    let adminId = data?.adminList[0]?.user.id;
                    if (adminId == undefined || adminId == null) {
                      bot.telegram.sendMessage(
                        msg.update.message.from.id,
                        text.chatStart,
                        {
                          parse_mode: "HTML",
                          disable_web_page_preview: true,
                        }
                      );
                    } else {
                      // console.log(data.adminList[0].status);
                      // console.log(data.adminList[0].can_promote_members);
                      if (
                        data.adminList[0].status == "creator" ||
                        data.adminList[0].can_promote_members == true
                      ) {
                        bot.telegram.sendMessage(
                          msg.update.message.from.id,
                          text.setting,
                          {
                            reply_markup: {
                              inline_keyboard: [
                                [
                                  {
                                    text: "Add Token",
                                    callback_data: "add",
                                  },
                                ],
                                [
                                  {
                                    text: "Token Setting",
                                    callback_data: "setting",
                                  },
                                ],
                              ],
                            },
                          }
                        );
                      } else {
                        bot.telegram.sendMessage(
                          msg.update.message.from.id,
                          "You can't access this... Tell the Group creator to enable you 'Add new Admins', Then send '/addtoken' to the bot in the group"
                        );
                      }
                    }
                  }
                });
              }
            }
          );
        }
      }
    );

    // Call the next middleware
    await next();
  });

  return tokenActionsRoute;
};

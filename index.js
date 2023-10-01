const Telegraf = require("telegraf");
const telegrafSession = require("telegraf/session");
require("telegraf-session-mongoose");
const mongoose = require("mongoose");
const text = require("./text.json");
const verifyToken = require("./ethvalidate");
const User = require("./models/userModel");
const Group = require("./models/groupModel");
const Stage = require("telegraf/stage");
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });
// Transaction Robot
const Robot = require("./transactionDetect/bot");
const { Composer } = require("telegraf");
const WizardScene = require("telegraf/scenes/wizard");
const bot = new Telegraf(process.env.BOT);
//Transaction RObot Instance
const instance = new Robot(bot);
const errorMiddleware = require("./error/error");
const mainId = [];
const groupNameee = [];
// Bot alert interval
setInterval(async () => {
  try {
    instance.watchChanges();
  } catch (error) {
    console.error(error);
    return;
  }
}, 15000);

// Session start
bot.use(function (ctx, next) {
  if (ctx.chat.id > 0) {
    next();
  } else {
    return bot.telegram
      .getChatAdministrators(ctx.chat.id)
      .then(function (data) {
        if (!data || !data.length) return;
        console.log("admin list:", data);
        ctx.chat._admins = data;
      })
      .catch(console.log)
      .then((_) => next(ctx));
  }
});

bot.catch((err, ctx) => {
  return errorMiddleware({ err, ctx, name: "index.js/bot.catch()" });
});

// Token add and Database Save
bot.command(["addtoken", "buildsettings"], async (ctx, next) => {
  if (!ctx.session) {
    ctx.session = {};
  }

  if (ctx.chat && ctx.chat.id && ctx.update.message) {
    let admi = ctx.update.message.chat._admins;
    groupNameee.unshift(ctx.chat.title);
    // Check if the group already exists in the database
    const existingGroup = await Group.findOne({ chatId: ctx.chat.id });
    // Update the existingGroup and newUser creation logic
    if (existingGroup) {
      // Update the admin list in the existing group document
      existingGroup.adminList = admi;
      await existingGroup.save();
      // Check if a user document already exists for this group
      const existingUser = await User.findOne({ chatId: ctx.chat.id });
      if (!existingUser) {
        // Create a new User document
        const newUser = await User.create({
          chatId: ctx.chat.id,
          step: 10,
          cSupply: "",
          emoji: "💚",
          mEnable: false,
          mImage: "Not Set",
          timeStamp: "",
          hash: "",
        });
      }
    } else {
      // Create a new Group document
      const newGroup = await Group.create({
        chatId: ctx.chat.id,
        groupName: ctx.chat.title,
        updateId: 0,
        adminList: admi,
        assignedToken: "",
      });

      // Create a new User document
      const newUser = await User.create({
        chatId: ctx.chat.id,
        step: "",
        cSupply: "",
        emoji: "",
        mEnable: "",
        mImage: "",
        timeStamp: "",
        hash: "",
      });
    }
  } else {
    return next();
  }

  const test_welcome = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Click Me",
            url: `http://t.me/BasePopperBuyBot?start=${ctx.chat.id}`,
          },
        ],
      ],
    },
    parse_mode: "HTML",
  };
  bot.telegram.sendMessage(ctx.chat.id, text.welcome, test_welcome);
});

// handler for deleting token
bot.action("tokenDelete", async (ctx) => {
  try {
    if (mainId[0] == undefined) {
      return ctx.reply("Click The Link from your group again");
    }
    const user = await User.findOne({ chatId: mainId[0] });
    if (!user) {
      return ctx.reply("User not found.");
    }
    if (!user.ethAddress || user.ethAddress.length === 0) {
      return ctx.reply("No token registered for this group.");
    }

    // Ask for confirmation
    ctx.reply("Are you sure you want to delete your token?", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Yes",
              callback_data: "confirmTokenDelete",
            },
            {
              text: "No",
              callback_data: "cancelTokenDelete",
            },
          ],
        ],
      },
    });

  } catch (error) {
    console.error("Error deleting token:", error);
    ctx.reply("An error occurred while deleting the token.");
  }
});

// Add handlers for confirmation actions
bot.action("confirmTokenDelete", async (ctx) => {
  try {
    // Delete the token
    const user = await User.findOne({ chatId: mainId[0] });
    if (!user) {
      return ctx.reply("User not found.");
    }
    if (!user.ethAddress || user.ethAddress.length === 0) {
      return ctx.reply("No token registered for this group.");
    }
    user.ethAddress = [];
    await user.save();
    ctx.reply("Token deleted successfully.");
  } catch (error) {
    console.error("Error deleting token:", error);
    ctx.reply("An error occurred while deleting the token.");
  }
});

// hears{/addtoken, /buildsettings}
bot.hears(["/addtoken", "/settings", "/buildsettings"], (ctx) => {
  if (ctx.chat.id > 0) {
    bot.telegram.sendMessage(ctx.chat.id, text.chatStart, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
  }
});

bot.hears(/\/start(.*)/, (msg, match) => {
  // console.log(msg.update.update_id);

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
});

// Token Add function
bot.action("add", function (ctx) {
  if (mainId[0] == undefined) {
    return ctx.reply("Click The Link from your group again");
  } else {
    ctx.deleteMessage();
    User.find({ chatId: mainId[0] }, (error, data) => {
      if (error) {
        console.log(error);
      } else {
        if (
          data[0]?.ethAddress.length === 0 ||
          data[0]?.ethAddress[0].name == null ||
          data[0]?.ethAddress[0].name == undefined
        ) {
          bot.telegram.sendMessage(
            ctx.chat.id,
            text.set + " " + `${groupNameee[0]}`,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "ETH",
                      callback_data: "eth",
                    },
                  ],
                ],
              },
            }
          );
        } else {
          bot.telegram.sendMessage(
            ctx.chat.id,
            "Are you sure you want to change the already registered Token?",
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "Yes",
                      callback_data: "eth",
                    },
                    {
                      text: "No",
                      callback_data: "cancel",
                    },
                  ],
                  [
                    {
                      text: "View Settings of Already Added Token",
                      callback_data: "tsetting",
                    },
                  ],
                ],
              },
            }
          );
        }
      }
    });
  }
});

// Setting
bot.action("setting", function (ctx) {
  if (mainId[0] == undefined) {
    return ctx.reply("Click The Link from your group again");
  } else {
    ctx.deleteMessage();
    User.find({ chatId: mainId[0] }, (error, data) => {
      if (error) {
        console.log(error);
      } else {
        console.log(data[0]?.ethAddress);
        if (
          data[0]?.ethAddress.length === 0 ||
          data[0]?.ethAddress[0].name == null ||
          data[0]?.ethAddress[0].name == undefined
        ) {
          ctx.reply(
            "No token Registered To the group... Trying adding a New token"
          );
        } else {
          bot.telegram.sendMessage(ctx.chat.id, text.setting, {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: `${data[0].ethAddress[0].name}`,
                    callback_data: "tsetting",
                  },
                ],
                [
                  {
                    text: ">>cancel",
                    callback_data: "cancel",
                  },
                ],
              ],
            },
          });
        }
      }
    });
  }
});

// handle tsetting
bot.action("tsetting", function (ctx) {
  if (mainId[0] == undefined) {
    return ctx.reply("Click The Link from your group again");
  } else {
    ctx.deleteMessage();
    User.find({ chatId: mainId[0] }, (error, data) => {
      if (error) {
        console.log(error);
      } else {
        const tokenAddress = data[0]?.ethAddress[0]?.token_Address || "N/A";
        const pairAddress = data[0]?.ethAddress[0]?.pair_Address || "N/A";

        const set = {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: `Telegram Group Link: ${data[0].telegram}`,
                  callback_data: "tele",
                },
              ],
              [
                {
                  text: `step: $ ${data[0].step}`,
                  callback_data: "step",
                },
              ],
              [
                {
                  text: `Circulating Supply: ${data[0].cSupply}`,
                  callback_data: "cSupply",
                },
              ],
              [
                {
                  text: `Emoji: ${data[0].emoji}`,
                  callback_data: "emoji",
                },
              ],
              [
                {
                  text: `Media Enabled: ${data[0].mEnable}`,
                  callback_data: "menable",
                },
              ],
              [
                {
                  text: `Media Image (click to view/change)`,
                  callback_data: "mImages",
                },
              ],
              [
                {
                  text: "Save Token settings",
                  callback_data: "save",
                },
              ],
              [
                {
                  text: "Delete Token",
                  callback_data: "tokenDelete",
                },
              ],
              [
                {
                  text: ">>Cancel",
                  callback_data: "cancel",
                },
              ],
            ],
          },
          parse_mode: "HTML",
        };

        bot.telegram.sendMessage(
          ctx.chat.id,
          `Successfully added Token Name: ${data[0]?.ethAddress[0]?.name}  to ${ctx.chat.title}.\nPlease update each of the settings below to suit your needs. If you want to change any, simply\nclick on the applicable button.\nToken Name: ${data[0]?.ethAddress[0]?.name} \nToken Address: ${tokenAddress} \nPair Address: ${pairAddress}`,
          set
        );
      }
    });
  }
});

bot.action("mImages", (ctx) => {
  if (mainId[0] == undefined) {
    return ctx.reply("Click The Link from your group again");
  } else {
    ctx.deleteMessage();
    chatId = mainId[0];
    User.find({ chatId }, (error, data) => {
      if (error) {
        console.log(error);
      } else {
        console.log(data[0].mEnable);
        if (data[0].mEnable == false) {
          ctx.reply("Media is not enabled... Enable in settings");
        } else {
          bot.telegram.sendMessage(ctx.chat.id, "What do you want to do", {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "View Already Saved Image",
                    callback_data: `viewImage`,
                  },
                ],
                [
                  {
                    text: "Change Image",
                    callback_data: `mImageChange`,
                  },
                ],
              ],
            },
          });
        }
      }
    });
  }
});

bot.action("viewImage", (ctx) => {
  if (mainId[0] == undefined) {
    return ctx.reply("Click The Link from your group again");
  } else {
    chatId = mainId[0];
    User.find({ chatId }, (error, data) => {
      if (error) {
        console.log(error);
      } else {
        if (data[0].mImage === "Not Set") {
          bot.telegram.sendMessage(ctx.chat.id, `No Image Saved`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: ">>back", callback_data: "tsetting" }],
              ],
            },
          });
        } else {
          bot.telegram.sendPhoto(ctx.chat.id, data[0].mImage, {
            reply_markup: {
              inline_keyboard: [
                [{ text: ">>back", callback_data: "tsetting" }],
              ],
            },
          });
        }
      }
    });
  }
});

// Telegram Link Update and Edit

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

//ETH  Scene

bot.action("eth", function (ctx) {
  if (mainId[0] == undefined) {
    return ctx.reply("Click The Link from your group again");
  } else {
    ctx.deleteMessage();
    bot.telegram.sendMessage(ctx.chat.id, text.token, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Uniswap",
              callback_data: "e-Uniswap",
            },
            {
              text: "Shibaswap",
              callback_data: "e-Shibaswap",
            },
          ],
          [
            {
              text: "Uniswap v3",
              callback_data: "e-UniswapV3",
            },
            {
              text: "Sushiswap",
              callback_data: "e-Sushiswap",
            },
          ],

          [
            {
              text: ">>cancel",
              callback_data: "cancel",
            },
            {
              text: ">>cancel",
              callback_data: "cancel",
            },
          ],
        ],
      },
    });
  }
});
let ethList = ["e-Uniswap", "e-UniswapV3", "e-Sushiswap", "e-Shibaswap"];

// tokenVerify scene
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

// const imageScene = new WizardScene("imageScene",

const step1 = (ctx) => {
  ctx.reply(
    "Be sure when sending image, it is sent with compression(if you're using a PC)"
  );
  console.log("main Id", mainId);
  return ctx.wizard.next();
};

const step2 = new Composer();

step2.on(["photo", "document"], (ctx) => {
  if (ctx.update.message.document) {
    ctx.reply(
      "Image invalid! Please send image as 'Photo' and not a 'File'. Try again"
    );
  } else {
    let photos = ctx.message.photo;
    const { file_id: fileId } = photos[0];
    console.log(fileId);
    const chatId = mainId[0];
    User.findOneAndUpdate(
      { chatId },
      {
        mImage: `${fileId}`,
      },
      (error, data) => {
        if (error) {
          console.log(error);
        } else {
          bot.telegram.sendMessage(ctx.chat.id, "Done", {
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
});

const imageScene = new WizardScene("imageScene", (ctx) => step1(ctx), step2);

// Setting Scences
const telegramLink = new WizardScene(
  "updateTele",
  (ctx) => {
    ctx.reply(`Please paste your Telegram Link`);
    ctx.wizard.state.data = {};
    return ctx.wizard.next();
  },
  (ctx) => {
    if (ctx.message && ctx.message.text) {
      ctx.wizard.state.data.address = ctx.message.text;
      const telegramLink = ctx.wizard.state.data.address;
      const chatId = ctx.chat.id;
      console.log(ctx.chat.id);
      const user = User.findOneAndUpdate(
        { chatId: mainId[0] },
        { telegram: `${telegramLink}` },
        (error, data) => {
          if (error) {
            ctx.reply("Not valid");
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
      ctx.reply("Link saved successfully");
    } else {
      ctx.reply("Please provide a valid Telegram link.");
    }
    ctx.scene.leave();
  }
);

const Step = new WizardScene(
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

// Add a new action handler for updating the circulating supply
bot.action("updateCsupply", (ctx) => {
  ctx.deleteMessage();
  ctx.scene.enter("cSupply");
});

// Csupply Scene
const Csupply = new WizardScene(
  "cSupply",
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

const Emoji = new WizardScene(
  "emoji",
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

const Media = new WizardScene(
  "menable",
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

const stage = new Stage([
  tokenVerify,
  telegramLink,
  Step,
  Csupply,
  Emoji,
  Media,
  imageScene,
  // mImages
]);

// sessions
bot.use(telegrafSession());
bot.use(stage.middleware());

//ETHList action

bot.action(ethList, Stage.enter("token"));
bot.action("updateTele", (ctx) => {
  ctx.deleteMessage();
  ctx.scene.enter("updateTele");
});
bot.action("step", (ctx) => {
  ctx.deleteMessage();
  Stage.enter("step")(ctx);
});
bot.action("cSupply", (ctx) => {
  ctx.deleteMessage();
  Stage.enter("cSupply")(ctx);
});
bot.action("emoji", (ctx) => {
  ctx.deleteMessage();
  Stage.enter("emoji")(ctx);
});
bot.action("mImageChange", Stage.enter("imageScene"));
bot.action("menable", (ctx) => {
  ctx.deleteMessage();
  Stage.enter("menable")(ctx);
});

// Cancel Action
bot.action("cancel", (ctx) => {
  ctx.deleteMessage();
  ctx.reply("You have cancelled the action");
});

//Save Token
bot.action("save", (ctx) => {
  ctx.deleteMessage();
  ctx.reply("Saved");
});
bot.action("tsave", (ctx) => {
  ctx.deleteMessage();
  ctx.reply(
    "Token Successfully added. To change settings please click on the link from within your Telegram group."
  );
});
// Token Delete
bot.action("cancelTokenDelete", (ctx) => {
  ctx.deleteMessage();
  ctx.reply("Token deletion canceled.");
});

const init = async () => {
  try {
    // Set Mongoose option before connecting
    mongoose.set("strictQuery", false);
    const mongooseOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    // Connect to the MongoDB database
    await mongoose.connect(process.env.DB_URI, mongooseOptions);
    console.log(`Mongodb connected with server: ${mongoose.connection.host}`);
    // Launch the Telegram bot
    await bot.launch();
    console.log("Telegram bot is up and running!");
  } catch (error) {
    console.error("Error initializing the bot:", error);
    process.exit(1);
  }
};

init();
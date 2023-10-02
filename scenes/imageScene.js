import { WizardScene } from 'telegraf';

const imageScene = new WizardScene("imageScene", (ctx) => step1(ctx), step2);
const step1 = (ctx) => {
    ctx.reply(
      "Be sure when sending image or video, it is sent with compression(if you're using a PC)"
    );
    console.log("main Id", mainId);
    return ctx.wizard.next();
  };
  const step2 = new Composer();
  
  step2.on(["photo", "video"], (ctx) => {
    if (ctx.update.message.video) {
      // Handle video
      let video = ctx.update.message.video;
      const { file_id: fileId } = video;
      const chatId = mainId[0];
      User.findOneAndUpdate(
        { chatId },
        {
          mVideo: `${fileId}`,
        },
        (error, data) => {
          if (error) {
            console.log(error);
          } else {
            bot.telegram.sendMessage(ctx.chat.id, "Video saved!", {
              reply_markup: {
                inline_keyboard: [
                  {
                    text: `>>Back`,
                    callback_data: "tsetting",
                  },
                ],
              },
            });
          }
        }
      );
    } else if (ctx.update.message.photo) {
      // Handle photo
      let photos = ctx.update.message.photo;
      const { file_id: fileId } = photos[0];
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
            bot.telegram.sendMessage(ctx.chat.id, "Image saved!", {
              reply_markup: {
                inline_keyboard: [
                  {
                    text: `>>Back`,
                    callback_data: "tsetting",
                  },
                ],
              },
            });
          }
        }
      );
    }
    return ctx.scene.leave();
  });

export default imageScene;

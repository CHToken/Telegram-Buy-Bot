const WizardScene = require("telegraf/scenes/wizard");
const User = require("../models/userModel");

module.exports = function createSettingsWizard(mainId) {
  const settingsWizard = new WizardScene(
    "settings",
    (ctx) => {
      ctx.reply(`What setting would you like to update?`);
      ctx.wizard.state.data = {};
      return ctx.wizard.next();
    },
    (ctx) => {
      if (ctx.message && ctx.message.text) {
        const selectedSetting = ctx.message.text.toLowerCase();
        ctx.wizard.state.data.setting = selectedSetting;

        switch (selectedSetting) {
          case "Telegram link":
            ctx.reply(`Please paste your new Telegram Link`);
            return ctx.wizard.next();
          case "Step":
            ctx.reply(`Input Step Amount`);
            return ctx.wizard.next();
          case "Circulating supply":
            ctx.reply(`Input Circulating Supply`);
            return ctx.wizard.next();
          case "Emoji":
            ctx.reply(`Input Emoji`);
            return ctx.wizard.next();
          case "Media enabled":
            ctx.reply(`Please type 'true' for Yes and 'false' for No`);
            return ctx.wizard.next();
          default:
            ctx.reply("Invalid setting. Please select a valid setting.");
            return ctx.wizard.selectStep(0);
        }
      }

      return ctx.scene.leave();
    },
    // Additional step: Handle the "Back" option
    (ctx) => {
      if (ctx.message && ctx.message.text.toLowerCase() === ">>Back") {
        ctx.reply("You have returned to the main settings menu.");
        return ctx.scene.leave();
      } else {
        ctx.reply("Invalid setting. Please select a valid setting.");
        return ctx.wizard.selectStep(0);
      }
    },

    async (ctx) => {
      const { setting } = ctx.wizard.state.data;
      const chatId = ctx.chat.id;

      try {
        switch (setting) {
          case "Telegram link":
            if (ctx.message && ctx.message.text) {
              const telegramLink = ctx.message.text;
              // Update the Telegram link
              await User.findOneAndUpdate(
                { chatId },
                { telegram: telegramLink }
              );
              ctx.reply("Telegram link updated successfully.");
            } else {
              ctx.reply("Please provide a valid Telegram link.");
            }
            break;
          case "Step":
            if (ctx?.message?.text) {
              const step = ctx.message.text;
              // Update the step
              await User.findOneAndUpdate({ chatId }, { step: step });
              ctx.reply("Step amount updated successfully.");
            } else {
              ctx.reply("Please provide a valid step amount.");
            }
            break;
          case "Circulating supply":
            if (ctx?.message?.text) {
              const circulatingSupply = ctx.message.text;
              // Update the circulating supply
              await User.findOneAndUpdate(
                { chatId },
                { cSupply: circulatingSupply }
              );
              ctx.reply("Circulating supply updated successfully.");
            } else {
              ctx.reply("Please provide a valid circulating supply.");
            }
            break;
          case "Emoji":
            if (ctx?.message?.text) {
              const emoji = ctx.message.text;
              // Update the emoji
              await User.findOneAndUpdate({ chatId }, { emoji: emoji });
              ctx.reply("Emoji updated successfully.");
            } else {
              ctx.reply("Please provide a valid emoji.");
            }
            break;
          case "Media enabled":
            if (
              ctx?.message?.text === "true" ||
              ctx?.message?.text === "false"
            ) {
              const mediaEnabled = ctx.message.text === "true";
              // Update the media
              await User.findOneAndUpdate(
                { chatId },
                { mEnable: mediaEnabled }
              );
              ctx.reply("Media enabled setting updated successfully.");
            } else {
              ctx.reply("Please type 'true' for Yes or 'false' for No.");
            }
            break;
          default:
            ctx.reply("An error occurred while updating the setting.");
            break;
        }
      } catch (error) {
        console.error(error);
        ctx.reply("An error occurred while updating the setting.");
      }

      return ctx.scene.leave();
    }
  );

  return settingsWizard;
};

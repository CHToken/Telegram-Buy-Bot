const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  chatId: { type: String },
  ethAddress: [
    {
      name: { type: String },
      token_Address: { type: String },
      pair_Address: { type: String },
    },
  ],
  telegram: { type: String },
  step: { type: Number },
  cSupply: { type: Number },
  emoji: { type: String },
  mEnable: { type: Boolean },
  mImage: { type: String },
  mGif: { type: String },
  timeStamp: { type: Number },
  hash: { type: String },
  groupId: { type: String },
  processedTransactions: [{ type: String }],
});
const User = mongoose.model("user", userSchema);

module.exports = User;

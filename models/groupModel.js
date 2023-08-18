const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  chatId: {
    type: Number,
    required: true,
  },
  groupName: String,
  updateId: Number,
  adminList: Array,
  assignedToken: {
    type: String,
    default: null,
  },
});

const Group = mongoose.model("Group", groupSchema);

module.exports = Group;

const { Composer } = require("telegraf");

const deleteComposer = new Composer();

// Import the logic from Delete.js
require("../Delete")(deleteComposer);

module.exports = deleteComposer;

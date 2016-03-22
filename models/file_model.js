const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  fileName:     String,
  url:          String
});

module.exports = mongoose.model('Files', fileSchema);

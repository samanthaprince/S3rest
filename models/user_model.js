const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
  name:         String,
  files:      [{type: Schema.Types.ObjectId, ref: 'Files'}]
});

module.exports = mongoose.model('Users', userSchema);

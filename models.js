const mongoose = require('mongoose');

const Schema   = mongoose.Schema;
const ObjectId = Schema.ObjectId;

// posting a reply will bump the thread
const ReplySchema = new Schema({
  text: {type: String},
  created_on: {type: Date, default: new Date},
  reported: {type: Boolean, default: false},
  delete_password: {type: String, required: true}
});

const ThreadSchema = new Schema({
  board: {type: String, required: true},
  text: {type: String},
  delete_password: {type: String, required: true},
  created_on: {type: Date, default: new Date},
  bumped_on: {type: Date, default: new Date},
  reported: {type: Boolean, default: false},
  replies: [ReplySchema]
});

module.exports.Thread = mongoose.model('Thread', ThreadSchema);
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const songSchema = new Schema({
    songName: String,
    singer: String,
    imageURL: String,
    songURL: String
});

module.exports = mongoose.model('Song', songSchema);
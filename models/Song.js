const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const songSchema = new Schema({
    songName: String,
    singer: String,
    imageURL: String,
    songURL: String,
    views: {
        type: Number,
        default: 0
    },
    category: {
        type: String
    },
    likes: [
        {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'users'
            }
        }
    ],
    comments: [
        {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'users'
            },
            text: {
                type: String,
                required: true
            },
            name: {
                type: String
            },
            date: {
                type: Date,
                default: Date.now
            }
        }
    ]
});

module.exports = mongoose.model('Song', songSchema);
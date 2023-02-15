const mongoose = require('mongoose');


const fileAppSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true
    },
    fileId: {
        type: String,
        required: true
    },
    fileExpires: {
        type: Date,
        required: true
    }
})

// fileSchema.

const fileApp = new mongoose.model('fileApp', fileAppSchema);

module.exports = fileApp;
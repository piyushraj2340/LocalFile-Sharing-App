const mongoose = require('mongoose');

mongoose.set("strictQuery", false);

const DB = 'mongodb://127.0.0.1:27017/fileSharingApp';

mongoose.connect(DB,{
    useNewUrlParser: true,

}).then(() => {
    console.log("connection successful!...");
}).catch((err) => {
    console.log(`connection failed!.... ${err}`);
});




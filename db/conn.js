const mongoose = require('mongoose');
const dbUrl = process.env.dbUrl;
function dbConnect() {
  mongoose.connect("mongodb+srv://admin:admin@cluster0.aslcu8g.mongodb.net/NodeApiDb", {
    // useCreateIndex:true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useFindAndModify:false,
  }).then(()=>{
    console.log('Connection Successfully with mongoDB');
  }).catch((e)=>{
    console.log('connection error', e);
    process.exit(1);
  });
}

function dbDisconnect() {
  mongoose.disconnect();
}

module.exports = {dbConnect, dbDisconnect};


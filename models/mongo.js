//mongoose
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/selfiedb');
var db = mongoose.connection;
var Schema = mongoose.Schema;
var selfieSchema = new Schema({
      userName:  String,
      userId: String,
      follows: [{ userName: String, userId: String }],   
});
var InstaUser = mongoose.model('InstaUser', selfieSchema);
module.exports = InstaUser;
// we're connected!
console.log("Mongo - We are connected");

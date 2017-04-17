//mongoose
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/selfiedb');
var db = mongoose.connection;
var Schema = mongoose.Schema;
var selfieSchema = new Schema({
      userName:  {type: String, unique: true, index: true},
      userId: {type: String, unique: true, index: true},
      follows: [{ userName: String, userId: String }]
});
var followsSchema = new Schema({
      userName: {type: String, unique: true, index: true},
      userId: {type: String, unique: true, index: true},
      media:[{imageURL : String, productRelated : {type: String, default: "-1"}}]
});
var InstaUser = mongoose.model('InstaUser', selfieSchema);
var followsUser = mongoose.model('followsUser', followsSchema);

module.exports = {
    InstaUser: InstaUser,
    followsUser: followsUser
};
// we're connected!
console.log("Mongo - We are connected");

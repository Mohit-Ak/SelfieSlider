var express=require("express");
var logger=require("morgan");
app = express();
var router=express.Router();

app.get('/', function (req, res, next) {
  try {
    // var html = "{TestKey : TestValue}";
    // res.json(html);
    res.send('Hello World!')
  } catch (e) {
    next(e);
  }
});

app.listen(process.env.PORT || 3000, function () {
  console.log('Listening on http://localhost:' + (process.env.PORT || 3000))
});
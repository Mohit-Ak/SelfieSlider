var express = require('express')
, logger = require('morgan')
, app = express()
, session = require('express-session')
, template = require('jade').compileFile(__dirname + '/source/templates/homepage.jade');
var http = require('http');
var ig = require('instagram-node').instagram();
var request = require('request');
var syncrequest = require('sync-request');
var models= require('./models/mongo');

// Every call to `ig.use()` overrides the `client_id/client_secret`  or `access_token` previously entered if they exist. 
//ig.use({ access_token: '310536973.e3b7231.a6130cafd49644b59b3e3438e8f01650'});
ig.use({ client_id: 'e3b7231267f04e37a97f2c2e640ce6ec',
	client_secret: '99467aae21b74427a9e87691468b387d' });

app.use(logger('dev'))
app.use(express.static(__dirname + '/static'))
app.use(session({
	secret: 'Crazy Cat',
	resave: false,
	saveUninitialized: true,
	cookie: { secure: true }
}))

var redirect_uri = 'http://localhost:3000/handleauth';
exports.authorize_user = function(req, res) {
	ig.use({ client_id: 'e3b7231267f04e37a97f2c2e640ce6ec',client_secret: '99467aae21b74427a9e87691468b387d' });
	res.redirect(ig.get_authorization_url(redirect_uri, { scope: ['likes','public_content','basic','relationships','follower_list']}));
};
app.get('/authorize_user', exports.authorize_user);

app.get('/', function (req, res, next) {
	try {
		var html = template({ title: 'Home' })
		res.send(html)
	} catch (e) {
		next(e)
	}
});

exports.handleauth = function(req, res) {
	ig.authorize_user(req.query.code, redirect_uri, function(err, result) {
		if (err) {
			console.log(err.body);
			res.send("Didn't work");
		} else {
			console.log('Yay! Access token is ' + result.access_token);
			console.log('The query was' + req.query);
			console.log('The result is ' + result);
			console.log('The userId is' + result.user.id);
			//res.redirect('/token/'+result.access_token);
			ig.use({
				access_token: result.access_token
			});

			SelfieAPI.getAllInstaUsersYouFollow(result.access_token, result.user.id,result.user.username,req,res)


		//res.json(follows);
	}
});
};

// app.get('/SelfieHome', function (req, res, next) {
//   try {

//     var first = ig.user_media_recent('2022842435', function(err, medias, pagination, remaining, limit) {
//       console.log(err +'\n'+ remaining+'\n' + limit);
//       var photos = medias.map(function(m){
//         return {
//           likes: m.likes.count,
//           image: m.images.standard_resolution.url,
//           id: m.id
//         }
//       });
//       res.json(photos);
//       });
//   } catch (e) {
//     next(e)
//   }
// });
// app.get('/getAllInstaUsersYouFollow', function (req, res, next) {
//   try {
//     console.log("Inside getAllInstaUsersYouFollow-"+req.query.userId);
//     SelfieAPI.getAllInstaUsersYouFollow(req.query.userId,req.query.username,req, res);
//   } catch (e) {
//     next(e)
//   }
// });
// app.get('/getAllMediaFromAUser', function (req, res, next) {
// 	try {
// 		console.log("Inside getAllMediaFromAUser-"+req.query.userName);
// 		SelfieAPI.getAllMediaFromAUser(req.query.userName,req, res);
// 	} catch (e) {
// 		next(e)
// 	}
// });

app.get('/doUserFollowsProcessing', function (req, res, next) {
	try {
		console.log("Inside doUserFollowsProcessing");
		SelfieAPI.doUserFollowsProcessing(req, res);
	} catch (e) {
		next(e)
	}
});
app.get('/doMediaDumping', function (req, res, next) {
	try {
		console.log("Inside doMediaDumping");
		SelfieAPI.doMediaDumping(req, res);
	} catch (e) {
		next(e)
	}
});

app.get('/handleauth', exports.handleauth);
app.listen(3000, function(){
	console.log('Magic happens on port 3000');
});

SelfieAPI={
	getAllInstaUsersYouFollow : function(accessToken, userId,userName,req,res){
		console.log("getAllInstaUsersYouFollow -"+userId+"("+userName+")-follows and access_token is -"+accessToken);
		ig.use({ access_token: accessToken});
		ig.user_follows(userId, function(err, follows, pagination, limit) {

			if (follows!=null && follows.length!=0) { 
				console.log("Follows length -"+follows.length);
				var followsRefined=[];
				for(i in follows){
							//console.log(follows[i].id+"-"+follows[i].username);
							followsRefined.push({ userName: follows[i].username, userId: follows[i].id })
						}
						console.log("Mongo - We are going to insert");
						var newUser = new models.InstaUser({
							userName:  userName,
							userId: userId,
							follows: followsRefined,   
						});
						newUser.save(function(err) {
							if (err){
								console.log(err);
							} 
							console.log('User saved successfully!');
						});
					}else{
						console.log('User '+userName+' Does not follow anyone');
					}
					res.json(follows);
				});    
	},

	doUserFollowsProcessing : function(req,res){
		console.log("doUserFollowsProcessing");
		models.InstaUser.find({}, function(err, instausers) {
			if (err){ 
				console.log(err);
				throw err
			};
		 // console.log("All Instausers-"+instausers);
		 var allFollows=[];
		 instausers.forEach(function(user) {
		 	console.log("---------Logging individual userssssss------");
			 //console.log(user); 
			 var userFollows=user.follows;
				 //console.log(userFollows); 
				 console.log("User -"+user.userName+" - userFollows Length -"+userFollows.length);
				 for(var j=0; j<userFollows.length;j++){
				 	var fUserName=userFollows[j].userName;
				 	var fUserId=userFollows[j].userId;
				 	console.log("fUserName - "+fUserName);
				 	console.log("fUserId - "+fUserId);
				 	try{
				 		var newfUser = new models.followsUser({
				 			userName:  fUserName,
				 			userId: fUserId,
				 			media:[]
				 		});
				 		newfUser.save(function(err) {
				 			if (err){ 
				 				console.log(err);
				 			}else{
				 				console.log('newfUser saved successfully!');
				 			}
				 		});
				 	}catch(e){
				 		console.log('exception during saving');
				 		console.log(e);
				 	}
				 }
				});

		 res.send("Done");
		});
},
doMediaDumping : function(req,res){
	console.log("doMediaDumping Starting");
	models.followsUser.find({}, function(err, followsusers) {
		if (err){ 
			console.log(err);
			throw err
		};
		followsusers.forEach(function(user) {
			//user.media = [{"imageURL" : "test image url2", "productRelated" : "-1"}];
			//console.log("User -"+user.userName+" and the responseJson is - \n");
			// var responseJson=SelfieAPI.getAllMediaFromAUser(user.userName,null,null);
			// console.log(responseJson);
			
			var response =syncrequest('GET','https://www.instagram.com/'+user.userName+'/media/');
			console.log("getAllMediaFromAUser response returned-");
			console.log(response.getBody('utf8'));
			var responseItems=JSON.parse(response.getBody('utf8'));
			var responseItemsArray=responseItems.items;
			if (responseItemsArray.length>0) {
				user.media=[];
				for(i in responseItemsArray){
					var imageURL=responseItemsArray[i].images.standard_resolution.url;
					if (imageURL!=null && !imageURL=="") {
						console.log("doMediaDumping - User "+user.userName+" imageURL - "+imageURL);
						var tempObj={"imageURL" : imageURL, "productRelated" : "-1"};
						user.media.push(tempObj);
						//user.media = [{"imageURL" : "test image url2", "productRelated" : "-1"}];
					}
				}
				user.save(function(err) {
							if (err){
								console.log(err);
							} 
							console.log('User saved successfully!');
						});
			}
		});
});
res.send("Done");	
},
getAllMediaFromAUser : function(userName,req,res){
	console.log("getAllMediaFromAUser  "+userName);
			// ig.use({ access_token: '310536973.e3b7231.a6130cafd49644b59b3e3438e8f01650'});
			// ig.user_media_recent(userId, function(err, medias, pagination, remaining, limit) {
			//   console.log("pagination");
			//   console.log(pagination);
			//   console.log(err +'\n'+ remaining+'\n' + limit);
			//   var photos = medias.map(function(m){
			//     return {
			//       likes: m.likes.count,
			//       image: m.images.standard_resolution.url,
			//       id: m.id
			//     }
			//   });
			//   res.json(medias);
			//   });
var request = require('request');
request('https://www.instagram.com/'+userName+'/media/', function (error, response, body) {
	if (!error && response.statusCode == 200) {
		console.log("getAllMediaFromAUser response returned-");
		console.log(body);
		if (req!=null) {
			res.send(body);  
		}else{
			return body;
		}
		
	}
})
}
}
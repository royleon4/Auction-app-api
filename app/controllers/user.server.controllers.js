const users = require('../models/user.server.models')
  log = require('../lib/logger')(),
  validator = require('../lib/validator'),
  config = require('../../config/config.js'),
  schema = require('../../config/seng365-2018_auction_0.0.5_swagger.json');

/**
* create a new user, from a request body that follows the `User` schema definition
*/
exports.create = function(req, res){
  if (false){ //!validator.isValidSchema(req.body, 'components.schemas.user')) {
      log.warn(`users.controller.create: bad user ${JSON.stringify(req.body)}`);
      return res.sendStatus(400);
  } else {
      let user = Object.assign({}, req.body);
      users.insert(user, function(err, id){
          if (err)
          {
              log.warn(`user.controller.create: couldn't create ${JSON.stringify(user)}: ${err}`);
              return res.sendStatus(400); // duplicate record
          }
          res.status(201).json({id:id});
      });
  }
}
//
// exports.login = function(req, res){
//     validator.areValidParameters(req.body, schema.paths['/users/login'].post.parameters)
//         .then(function(){
//                 //console.log("hello");
//                 //log.warn(`success ${JSON.stringify(req.body)}`);
//
//                 let username = '';
//                 let email = '';
//                 let password = req.body.password;
//
//                 //res.status(200).json({username:username,email:email,password:password});
//
//                 //check these parameters manually as swagger doesn't allow for oneOf type semantics so email and username are given as optional
//                 if (req.body.hasOwnProperty('username')) username = req.body.username;
//                 if (req.body.hasOwnProperty('email')) email = req.body.email;
//
//                 //res.status(200).json({username:username,email:email,password:password});
//
//                 users.authenticate(username, email, password, function(err, id){
//                     //console.log(err, id);
//                     if(err) res.status(400).send('Invalid username/email/password supplied');
//
//                     users.getToken(id, function(err, token){
//                         /// return existing token if already set (don't modify tokens)
//                         if (token) return res.status(200).json({id: id, token: token});
//
//                         // but if not, complete login by creating a token for the user
//                         users.setToken(id, function(err, token){
//                            res.status(200).json({id: id, token: token});
//                         });
//
//                     });
//                 });
//         })
//         .catch(function(err){
//             //console.log(err);
//             log.warn(`users.controller.login: bad request ${JSON.stringify(req.body)}`);
//             res.sendStatus(400);
//         });
// }
//
//
//
//
// exports.logout = function(req, res){
//     let token = req.get(config.get('authToken'));
//     users.removeToken(token, function(err){
//         if (err)
//             return res.sendStatus(401);
//         return res.sendStatus(200);
//     });
//     return null;
// }
//
// /**
//  * return details for the user given by the request param :id
//  * include email and accountBalance fields only if id == authenticated user's id
//  */
// exports.get_one = function(req, res){
//     let id = parseInt(req.params.id);
//     if (!validator.isValidId(id)) return res.sendStatus(404);
//
//     users.getOne(id, function(err, results){
//         if (err)
//             return res.sendStatus(500);
//         if (!results)  // no user found
//             return res.sendStatus(404);
//         let token = req.get(config.get('authToken'));
//         //console.log(token);
//         users.getIdFromToken(token, function(err, _id){
//             //console.log(id, _id);
//             if (_id !== id) {
//                 delete results.user_email;
//             }
//             res.status(200).json(results);
//         })
//     })
// };
//
//
// /**
//  * update the user given by request param :id from a request body that follows the `User` schema definition
//  * (auth required)
//  */
// exports.update = function(req, res){
//     let id = parseInt(req.params.id);
//     if (!validator.isValidId(id)) return res.sendStatus(404);
//
//     let token = req.get(config.get('authToken'));
//     users.getIdFromToken(token, function(err, _id){
//         if (_id !== id)
//             return res.sendStatus(403);
//         if (false){ //!validator.isValidSchema(req.body, 'components.schemas.user')) {
//             log.warn(`users.controller.update: bad user ${JSON.stringify(req.body)}`);
//             return res.sendStatus(400);
//         }
//         // TODO: get current state of person, and merge with changes in req.body
//         users.getOne(id, function(err, results){
//             if(err) return res.sendStatus(500);
//             if (!results) return res.sendStatus(404);  // no user found
//
//             //console.log(results);
//
//             let username = '';
//             let givenname = '';
//             let familyname = '';
//             let email = '';
//             let password = '';
//
//             if(req.body.hasOwnProperty('username')){
//                 username = req.body.username;
//             }else{
//                 username = results.user_username;
//             }
//
//             if(req.body.hasOwnProperty('givenname')){
//                 givenname = req.body.givenname;
//             }else{
//                 givenname = results.user_givenname;
//             }
//
//             if(req.body.hasOwnProperty('familyname')){
//                 familyname = req.body.familyname;
//             }else{
//                 familyname = results.user_familyname;
//             }
//
//             if(req.body.hasOwnProperty('email')){
//                 email = req.body.email;
//             }else{
//                 email = results.user_email;
//             }
//
//             if(req.body.hasOwnProperty('password')) {
//                 password = req.body.password;
//             }
//
//             let user = {};
//
//             if(password != ''){
//                 user = {
//                     "username": username,
//                     "givenname": givenname,
//                     "familyname": familyname,
//                     "email": email,
//                     "password": password
//                 }
//             }else{
//                 user = {
//                     "username": username,
//                     "givenname": givenname,
//                     "familyname": familyname,
//                     "email": email
//                 }
//             }
//             console.log(user);
//             users.alter(id, user, function(err){
//                 if (err)
//                     return res.sendStatus(500);
//                 return res.sendStatus(200);
//             });
//         });
//     })
// }

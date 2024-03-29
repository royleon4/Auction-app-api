const users = require('../models/user.server.models'),
  log = require('../lib/logger')(),
  validator = require('../lib/validator'),
  config = require('../../config/config.js'),
  schema = require('../../config/seng365-2018_auction_0.0.11_swagger.json'),
  emailvalidator = require("email-validator");


/**
* create a new user, from a request body that follows the `User` schema definition
*/
exports.create = function(req, res){
  if (!validator.isValidSchema(req.body, 'components.schemas.User')) {
      log.warn(`users.controller.create: bad user ${JSON.stringify(req.body)}`);
      //log.warn(validator.getLastErrors());
      return res.sendStatus(400);
  } else {
      let user = Object.assign({}, req.body);

      if(!emailvalidator.validate(user['email']) || user['password'].length == 0){
        log.warn(`user.controller.create: failed validation ${JSON.stringify(user)}`);
        res.status(400).send('Malformed request');
      }else{
        users.insert(user, function(err, id){
            if (err)
            {
                log.warn(`user.controller.create: couldn't create ${JSON.stringify(user)}: ${err}`);
                return res.sendStatus(400); // duplicate record
            }
            res.status(201).send({id:id});
        });
      }
  }
}

exports.login = function(req, res){
    if(!validator.isValidSchema(req.body, 'components.schemas.LoginUser')){
      log.warn(`users.controller.login: bad request ${JSON.stringify(req.body)}`);
      res.sendStatus(400);
    }else{
      //console.log("hello");
      //log.warn(`success ${JSON.stringify(req.body)}`);

      let username = '';
      let email = '';
      let password = req.body.password;

      //res.status(200).json({username:username,email:email,password:password});

      //check these parameters manually as swagger doesn't allow for oneOf type semantics so email and username are given as optional
      if (req.body.hasOwnProperty('username')) username = req.body.username;
      if (req.body.hasOwnProperty('email')) email = req.body.email;

      if(username == "" && email == ""){
        res.status(400).send('Invalid username/email/password supplied');
      }else{
        users.authenticate(username, email, password, function(err, id){
            //console.log(err, id);
            if(err){
                log.warn("Here: " + err);
                res.status(400).send('Invalid username/email/password supplied');
            } else {
                users.getToken(id, function(err, token){
                    /// return existing token if already set (don't modify tokens)
                    if (token){
                        return res.send({id: id, token: token});
                    } else {
                        // but if not, complete login by creating a token for the user
                        users.setToken(id, function(err, token){
                            res.send({id: id, token: token});
                        });
                    }
                });
            }
        });
      }
    }
}




exports.logout = function(req, res){
    let token = req.get(config.get('authToken'));
    users.removeToken(token, function(err){
        if (err){
            return res.sendStatus(401);
        }else{
            return res.sendStatus(200);
        }
    });
    return null;
}

/**
 * return details for the user given by the request param :id
 * include email and accountBalance fields only if id == authenticated user's id
 */
exports.get_one = function(req, res){
    let id = parseInt(req.params.id);
    if (!validator.isValidId(id)) return res.sendStatus(404);

    users.getOne(id, function(err, results){
        if (err) {
            return res.sendStatus(500);
        } else if (!results) {  // no user found
            return res.sendStatus(404);
        }
        let token = req.get(config.get('authToken'));
        //console.log(token);
        users.getIdFromToken(token, function(err, _id){
            //console.log(id, _id);
            if (_id !== id) {
                delete results.email;
                delete results.accountBalance;
            }
            res.status(200).json(results);
        })
    })
};


/**
 * update the user given by request param :id from a request body that follows the `User` schema definition
 * (auth required)
 */
exports.update = function(req, res){
    let id = parseInt(req.params.id);
    if (!validator.isValidId(id)) return res.sendStatus(404);

    let token = req.get(config.get('authToken'));
    users.getIdFromToken(token, function(err, _id){
        if (_id !== id)
            return res.sendStatus(403);
        if (!validator.isValidSchema(req.body, 'components.schemas.User')) {
            log.warn(`users.controller.update: bad user ${JSON.stringify(req.body)}`);
            return res.sendStatus(400);
        }

        users.getOne(id, function(err, results){
            if(err) return res.sendStatus(500);
            if (!results) return res.sendStatus(404);  // no user found

            // console.log(results);
            // console.log(req.body);

            let username = '';
            let givenname = '';
            let familyname = '';
            let email = '';
            let password = '';

            if(req.body.hasOwnProperty('username')){
                username = req.body.username;
            }else{
                username = results.username;
            }

            if(req.body.hasOwnProperty('givenName')){
                givenname = req.body.givenName;
            }else{
                givenname = results.givenName;
            }

            if(req.body.hasOwnProperty('familyName')){
                familyname = req.body.familyName;
            }else{
                familyname = results.familyName;
            }

            if(req.body.hasOwnProperty('email')){
                email = req.body.email;
            }else{
                email = results.email;
            }

            if(req.body.hasOwnProperty('password')) {
                password = req.body.password;
            }

            if(!emailvalidator.validate(email)){
              res.status(400).send('Invalid email supplied');
            }else{

              let user = {};

              if(password != ''){
                  user = {
                      "username": username,
                      "givenName": givenname,
                      "familyName": familyname,
                      "email": email,
                      "password": password
                  }
              }else{
                  user = {
                      "username": username,
                      "givenName": givenname,
                      "familyName": familyname,
                      "email": email
                  }
              }
              console.log(user);
              users.alter(id, user, function(err){
                  if (err)
                      return res.sendStatus(500);
                  return res.sendStatus(201);
              });
            }
        });
    })
}

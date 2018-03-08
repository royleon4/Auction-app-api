const users = require('../models/user.server.models'),
  log = require('../lib/logger'),
  validator = require('../lib/validator');

  /**
   * create a new user, from a request body that follows the `User` schema definition
   */
exports.create = function(req, res){
  if (!validator.isValidSchema(req.body, 'components.schemas.user')) {
      log.warn(`users.controller.create: bad user ${JSON.stringify(req.body)}`);
      return res.sendStatus(400);
  }
  else {
      let user = Object.assign({}, req.body);
      users.insert(user, (err, id) => {
          if (err)
          {
              log.warn(`user.controller.create: couldn't create ${JSON.stringify(user)}: ${err}`);
              return res.sendStatus(400); // duplicate record
          }
          res.status(201).json({id:id});
      })
  }
}

exports.get_one = function(req, res){
  return null;
}

exports.update = function(req, res){
  return null;
}

exports.login = function(req, res){
  return null;
}

exports.logout = function(req, res){
  return null;
}

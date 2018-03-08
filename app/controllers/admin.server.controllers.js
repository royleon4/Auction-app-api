const admin = require('../models/admin.server.models')

exports.status = function(req, res){
  res.sendStatus(200).json({"msg":"I'm up!"})
}

exports.reset = function(req, res){
  return null;
}

exports.resample = function(req, res){
  return null;
}

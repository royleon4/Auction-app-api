const admin = require('../models/admin.server.models');

exports.status = function(req, res){
  res.status(200).json({"msg":"I'm up!"})
}

exports.reset = function(req, res){
    admin.database_reset(function(err){
        if(err) res.sendStatus(500);

        res.sendStatus(200);
    });
}

exports.resample = function(req, res){
    admin.database_resample(function(err){
        if(err) res.sendStatus(500);

        res.sendStatus(201);
    });
}

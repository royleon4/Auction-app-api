const admin = require('../models/admin.server.models');

// const log = require('../lib/logger')();
// const config = require('../../config/config.js');
//
// const execsql = require('execsql');
//
// const dbConfig = {
//     host: config.get('db.host'),
//     user: config.get('db.user'),
//     password: config.get('db.password')
// };
//
// const sql = 'use ' + config.get('db.database') + ';';

exports.status = function(req, res){
  res.status(200).json({"msg":"I'm up!"})
}

exports.reset = function(req, res){
    admin.database_reset(function(err){
        if(err) res.sendStatus(500);

        res.sendStatus(200);
    });


    // execsql.config(dbConfig)
    //     .exec(sql)
    //     .execFile('./app/scripts/reset.sql', function(err, results){
    //         if(err) throw err;
    //         console.log(results);
    //         //res.sendStatus(200);
    //     })
    //     .end();
}

exports.resample = function(req, res){
    admin.database_resample(function(err){
        if(err) res.sendStatus(500);

        res.sendStatus(200);
    });

    // execsql.config(dbConfig)
    //     .exec(sql)
    //     .execFile('./app/scripts/resample.sql', function(err, results){
    //         if (err){
    //
    //         }
    //         console.log(results);
    //     })
    //     .end();
}

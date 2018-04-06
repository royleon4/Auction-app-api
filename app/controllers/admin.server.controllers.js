const admin = require('../models/admin.server.models')
      fs = require('fs'),
      path = require('path'),
      app_dir = path.dirname(require.main.filename);

exports.status = function(req, res){
  res.status(200).json({"msg":"I'm up!"})
}

exports.reset = function(req, res){
    admin.database_reset(function(err){
        if(err) res.sendStatus(500);

        fs.readdir(app_dir + "/uploads", function(err, files){
          if(err){
            res.sendStatus(500);
          }else{

            let i = 0;
            let flag = false;

            files.forEach(function(file, index){
              if(file != "default.png"){
                file_path = app_dir + "/uploads/" + file
                fs.unlink(file_path, function(err){
                  if(err){
                    flag = true;
                  }
                });
              }

              i++;
              if(i == files.length){
                if(flag){
                  res.sendStatus(500);
                }else{
                  res.sendStatus(200);
                }
              }

            })
          }
        });
    });
}

exports.resample = function(req, res){
    admin.database_resample(function(err){
        if(err) res.sendStatus(500);

        res.sendStatus(201);
    });
}

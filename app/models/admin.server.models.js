const db = require('../../config/db');
const fs = require('fs');

exports.database_reset = function(done){
    let script = fs.readFileSync('./app/scripts/reset.sql', 'utf8');

    db.get_pool().query(script, function (err, rows){
        //console.log(err, rows);
        if (err){
            return done(err);
        }
        done(false);
    });
}

exports.database_resample = function(done){
    let script = fs.readFileSync('./app/scripts/resample.sql', 'utf8');

    db.get_pool().query(script, function (err, rows) {
        //console.log(err, rows);
        if (err) {
            return done(err);
        }
        done(false);
    });
}

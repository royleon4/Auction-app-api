const db = require('../../config/db');
const fs = require('fs');
const User = require('./user.server.models')

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

  // ('', 'T', '', 'black.panther@super.heroes', 'Wakanda', '0.00' , '500'),
  let user1 = {
    "username": "black.panther",
    "givenName": "T",
    "familyName": "Challa",
    "email": "black.panther@super.heroes",
    "password": "Wakanda"
  }

  // ('superman', 'Clark', 'Kent', 'superman@super.heroes', 'kryptonite', '0.00', '900'),
  let user2 = {
    "username": "superman",
    "givenName": "Clark",
    "familyName": "Kent",
    "email": "superman@super.heroes",
    "password": "kryptonite"
  }

  // ('batman', 'Bruce', 'Wayne', 'dark.knight@super.heroes', 'frankmiller', '0.00', '850'),
  let user3 = {
    "username": "batman",
    "givenName": "Bruce",
    "familyName": "Wayne",
    "email": "dark.knight@super.heroes",
    "password": "frankmiller"
  }

  // ('spiderman', 'Peter', 'Parker', 'spiderman@super.heroes', 'arachnid', '0.00', '500'),
    let user4 = {
    "username": "spiderman",
    "givenName": "Peter",
    "familyName": "Parker",
    "email": "spiderman@super.heroes",
    "password": "arachnid"
  }

  // ('ironman', 'Tony', 'Stark', 'ironman@super.heroes', 'robertdowney', '0.00', '700'),
    let user5 = {
    "username": "ironman",
    "givenName": "Tony",
    "familyName": "Stark",
    "email": "ironman@super.heroes",
    "password": "robertdowney"
  }

  // ('captain.america', 'Steve', 'Rogers', 'captain.america@super.heroes', 'donaldtrump', '0.00', '300'),
  let user6 = {
    "username": "captain.america",
    "givenName": "Steve",
    "familyName": "Rogers",
    "email": "captain.america@super.heroes",
    "password": "donaldtrump"
  }

  // ('dr.manhatten', 'Jonathan', 'Osterman', 'dr.manhatten@super.heroes', 'hydrogen', '0.00', '1000'),
  let user7 = {
    "username": "dr.manhatten",
    "givenName": "Jonathan",
    "familyName": "Osterman",
    "email": "dr.manhatten@super.heroes",
    "password": "hydrogen"
  }

  // ('vampire.slayer', 'Buffy', 'Summers', 'vampire.slayer@super.heroes', 'sarahgellar', '0.00' , '600'),
  let user8 = {
    "username": "vampire.slayer",
    "givenName": "Buffy",
    "familyName": "Summers",
    "email": "vampire.slayer@super.heroes",
    "password": "sarahgellar"
  }

  // ('Ozymandias', 'Adrian', 'Veidt', 'Ozymandias@super.villains', 'shelley', '0.00' , '200'),
  let user9 = {
    "username": "Ozymandias",
    "givenName": "Adrian",
    "familyName": "Veidt",
    "email": "Ozymandias@super.villains",
    "password": "shelley"
  }

  // ('Rorschach', 'Walter', 'Kovacs', 'Rorschach@super.villains', 'Joseph', '0.00' , '200'),
  let user10 = {
    "username": "Rorschach",
    "givenName": "Walter",
    "familyName": "Kovacs",
    "email": "Rorschach@super.villains",
    "password": "Joseph"
  }

  // ('power.woman', 'Jessica', 'Jones', 'power.woman@super.heroes', 'lukecage', '0.00' , '200')
  let user11 = {
    "username": "power.woman",
    "givenName": "Jessica",
    "familyName": "Jones",
    "email": "power.woman@super.heroes",
    "password": "lukecage"
  }

  User.insert(user1, function(){
    User.insert(user2, function(){
      User.insert(user3, function(){
        User.insert(user4, function(){
          User.insert(user5, function(){
            User.insert(user6, function(){
              User.insert(user7, function(){
                User.insert(user8, function(){
                  User.insert(user9, function(){
                    User.insert(user10, function(){
                      User.insert(user11, function(){
                        let script = fs.readFileSync('./app/scripts/resample.sql', 'utf8');

                        db.get_pool().query(script, function (err, rows) {
                            //console.log(err, rows);
                            if (err) {
                                return done(err);
                            }
                            done(false);
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

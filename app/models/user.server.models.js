const db = require('../../config/db'),
  crypto = require('crypto');

  /**
   * insert user
  */
const insert = function(user, done){

    const salt = crypto.randomBytes(64);
    const hash = getHash(user.password, salt);

    let values = [user.username, user.givenname, user.familyname, user.email, hash, salt.toString('hex')]

    db.get().query(
        'INSERT INTO users (username, givenname, familyname, email, hash, salt) VALUES (?)',
        values,
        function(err, results){
            if (err) return done(err);

            return done(err, results.insertId)
        }
    );
};

module.exports = {
    insert: insert
};

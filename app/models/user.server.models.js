const db = require('../../config/db'),
  crypto = require('crypto');

  const getHash = function(password, salt){
      return crypto.pbkdf2Sync(password, salt, 100000, 256, 'sha256').toString('hex');
  };


  /**
   * insert user
  */
const insert = function(user, done){

    const salt = crypto.randomBytes(64);
    const hash = getHash(user.password, salt);

    let values = [[user.username, user.givenName, user.familyName, user.email, hash, salt.toString('hex')]];

    db.get_pool().query(
        'INSERT INTO auction_user (user_username, user_givenname, user_familyname, user_email, user_password, user_salt) VALUES (?)',
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

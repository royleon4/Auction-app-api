const db = require('../../config/db');

/**
 * return all projects between `limit` and `limit+offset` when ordered by creation timestamp
 *
 */
const getAll = function(options, done){
    // TODO: parse options for server side searching

    let query = 'SELECT * FROM auction';
    db.get_pool().query(
        query,
        function(err, auctions){
            if (err)
                return done(err);
            return done(err, auctions);
        }
    )
};

module.exports = {
    getAll: getAll
}
const db = require('../../config/db');
const dateTime = require('node-datetime');
const dateFormat = require('dateformat');

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

/**
 * insert auction
 */
const insert = function(auction, user_id, done){

    let startDateTime = new Date(parseInt(auction.startDateTime));
    let endDateTime = new Date(parseInt(auction.endDateTime));

    let creation_date = dateTime.create().format('Y-m-d H:M:S');
    let start_date = dateFormat(startDateTime, "yyyy-mm-dd h:MM:ss");
    let end_date = dateFormat(endDateTime, "yyyy-mm-dd h:MM:ss");

    let values = [[auction.categoryId, auction.title, auction.description, creation_date, start_date, end_date, auction.reservedPrice, auction.startingBid, user_id]];

    db.get_pool().query(
        'INSERT INTO auction (auction_categoryid, auction_title, auction_description, auction_creationdate, auction_startingdate, auction_endingdate, auction_reserveprice, auction_startingprice, auction_userid) VALUES (?)',
        values,
        function(err, results){
            if (err) return done(err);

            return done(err, results.insertId)
        }
    );
}

/**
 * Return all bids for an auction
 */
const get_bids = function(id, done) {
    let query = 'SELECT bid.bid_amount AS amount, bid.bid_datetime AS datetime, bid.bid_userid AS buyerID, auction_user.user_username AS buyerUsername FROM bid, auction_user WHERE bid.bid_userid = auction_user.user_id AND bid.bid_auctionid = ?';
    db.get_pool().query(
        query,
        [id],
        function (err, bids) {

            if (err) return done(err);
            if(bids.length == 0) return done(err, []);

            for(let item of bids) {
                console.log('item: ', item['datetime']);
            }

            return done(err, bids);
        }
    )
}

module.exports = {
    getAll: getAll,
    insert: insert,
    getBids: get_bids
}
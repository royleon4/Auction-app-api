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
    let query = 'SELECT bid.bid_amount AS amount, bid.bid_datetime AS datetime, bid.bid_userid AS buyerId, auction_user.user_username AS buyerUsername FROM bid, auction_user WHERE bid.bid_userid = auction_user.user_id AND bid.bid_auctionid = ?';
    db.get_pool().query(
        query,
        [id],
        function (err, bids) {

            if (err) return done(err);
            if(bids.length == 0) return done(err, []);

            let format_bids = [];

            for(let item of bids) {
                //console.log(item);
                format_bids.push({
                    "amount": item['amount'],
                    "datetime": Date.parse(item['datetime']),
                    "buyerId": item['buyerId'],
                    "buyerUsername": item["buyerUsername"]
                });
            }

            return done(err, format_bids);
        }
    )
}


/**
 * Add a bid to an auction
 */
const add_bid = function(auction_id, user_id, amount, done) {
    let creation_date = dateTime.create().format('Y-m-d H:M:S');

    let values = [[user_id, auction_id, amount, creation_date]];

    db.get_pool().query(
        'INSERT INTO bid (bid_userid, bid_auctionid, bid_amount, bid_datetime) VALUES (?)',
        values,
        function(err, results){
            if (err) return done(err);

            return done(err, results.insertId)
        }
    );

}


/**
 * Get a single auction
 */
const get_one = function(auction_id, done) {

    let values = [[auction_id]];

    let query = 'SELECT auction.auction_categoryid, category.category_title, auction.auction_title, auction.auction_reserveprice, auction.auction_startingdate, auction.auction_endingdate, auction.auction_description, auction.auction_creationdate, auction.auction_userid, auction_user.user_username, auction.auction_startingprice FROM auction, category, auction_user WHERE auction.auction_categoryid = category.category_id AND auction.auction_userid = auction_user.user_id AND auction.auction_id = ?';

    db.get_pool().query(
        query,
        values,
        function(err, results){
            if (err){
                return done(err, false);
            }else{
                return done(false, results);
            }
        }
    )

}

/**
 * update auction
 *
 */
const alter = function(id, auction, done){

    let query_string = 'UPDATE auction SET auction_categoryid=?, auction_title=?, auction_reserveprice=?, auction_startingdate=?, auction_endingdate=?, auction_description=?, auction_startingprice=? WHERE auction_id=?';
    let values = [auction.category_id, auction.title, auction.reserve_price, auction.start_date_time, auction.end_date_time, auction.description, auction.starting_bid, id];

     db.get_pool().query(query_string,
        values,
        function(err, results){
            done(err);
        }
    );
};

module.exports = {
    getAll: getAll,
    insert: insert,
    getBids: get_bids,
    addBid: add_bid,
    getOne: get_one,
    alter: alter
}
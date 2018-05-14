const db = require('../../config/db');
const dateTime = require('node-datetime');
const dateFormat = require('dateformat');

/**
 * return all projects between `limit` and `limit+offset` when ordered by creation timestamp
 *
 */
const getAll = function(searchParams, done){
  let sql = `SELECT auction.auction_id AS id, category.category_title AS categoryTitle, category.category_id AS categoryId, ` +
        `auction.auction_title AS title, auction.auction_reserveprice AS reservePrice, auction.auction_startingdate AS startDateTime, ` +
        `auction.auction_endingdate AS endDateTime, bid.bid_amount AS currentBid, auction.auction_startingprice AS startingPrice ` +
        `FROM auction JOIN category ON auction.auction_categoryid = category.category_id LEFT OUTER JOIN bid ON bid.bid_auctionid = auction.auction_id ` +
        `WHERE (bid.bid_amount IN (SELECT MAX(bid_amount) FROM bid JOIN auction ON bid.bid_auctionid = auction.auction_id GROUP BY auction.auction_id) OR bid.bid_amount IS NULL)`;
    if (searchParams['q']) {
        sql += ` AND auction.auction_title LIKE '%${searchParams['q']}%'`
    }
    if (searchParams['category-id']) {
        sql += ` AND category.category_id = ${searchParams['category-id']}`;
    }
    if (searchParams['seller']) {
        sql += ` AND auction.auction_userid = ${searchParams['seller']}`;
    }
    if (searchParams['bidder']) {
        sql += ` AND auction.auction_id IN (SELECT bid_auctionid FROM bid WHERE bid_userid =${searchParams['bidder']})`;
    }
    sql += ` ORDER BY endDateTime ASC`;
    if (searchParams['count']) {
        sql += ` LIMIT ${searchParams['count']}`;
    }
    if (searchParams['startIndex']) {
        if (searchParams['count']) {
            sql += ` OFFSET ${searchParams['startIndex']}`;
        } else {
            sql += ` LIMIT 18446744073709551615 OFFSET ${searchParams['startIndex']}`; //This random big number is from the official solution from the mySQL team for using an offset when no limit is provided
        }
    }
    db.get_pool().query(sql, function (err, results) {
        if (err) return done(err, false);
        for (i = 0; i < results.length; i++) {

            if(results[i].currentBid == null){
              results[i].currentBid = results[i].startingPrice;
            }

            delete results[i].startingPrice;

            results[i].startDateTime = Date.parse(results[i].startDateTime);
            results[i].endDateTime = Date.parse(results[i].endDateTime);
        }

        /**
          FILTER BY STATUS - THIS IS A DIRTY HACK.
        */
        status = searchParams["status"];
        if(status !== undefined && status !== "" && status !== "all"){
          let results_to_return = [];
          let now = new Date(parseInt((new Date).getTime()));

          for(let result of results){
            let start_time = result.startDateTime;
            let end_time = result.endDateTime;

            if(status === "upcoming"){
              if(start_time > now){
                results_to_return.push(result);
              }
            }

            if(status === "active"){
              if(start_time <= now && end_time > now){
                results_to_return.push(result);
              }
            }

            if(status === "expired"){ //failed to meet reserve
              if(end_time <= now && result.currentBid < result.reservePrice){
                results_to_return.push(result);
              }
            }

            if(status === "won"){
              if(end_time <= now && result.currentBid >= result.reservePrice){
                results_to_return.push(result);
              }
            }


          }
          results = results_to_return;
        }
        /**
          DELETE FROM ABOVE COMMENT TO HERE TO REMOVE
        */


        return done(false, results);
    });
}



/**
 * insert auction
 */
const insert = function(auction, user_id, done){

    let startDateTime = new Date(parseInt(auction.startDateTime));
    let endDateTime = new Date(parseInt(auction.endDateTime));

    //let creation_date = dateTime.create().format('Y-m-d H:M:S');
    // let creation_date = dateFormat((new Date).getTime(), "yyyy-mm-dd h:MM:ss");
    // let start_date = dateFormat(startDateTime, "yyyy-mm-dd h:MM:ss");
    // let end_date = dateFormat(endDateTime, "yyyy-mm-dd h:MM:ss");

    let creation_date = new Date(parseInt((new Date).getTime()));
    /*
    let creation_date = new Date((new Date).getTime());
    let start_date = new Date(startDateTime);
    let end_date = new Date(endDateTime);
    */

    console.log("***********");
    console.log('creating auction creation_date=', creation_date);
    console.log("***********");

    let values = [[auction.categoryId, auction.title, auction.description, creation_date, startDateTime, endDateTime, auction.reservePrice, auction.startingBid, user_id]];

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
                console.log("ending date from DB", results[0]['auction_endingdate']);
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

    console.log(auction);

    let query_string = 'UPDATE auction SET auction_categoryid=?, auction_title=?, auction_reserveprice=?, auction_startingdate=?, auction_endingdate=?, auction_description=?, auction_startingprice=? WHERE auction_id=?';
    let values = [
      auction.category_id,
      auction.title,
      auction.reserve_price,
      new Date(parseInt(auction.start_date_time)),
      new Date(parseInt(auction.end_date_time)),
      auction.description,
      auction.starting_bid,
      id
    ];

     db.get_pool().query(query_string,
        values,
        function(err, results){
            done(err);
        }
    );
};

/**
* Get all categories
*/
const get_categories = function(done){
  db.get_pool().query(
      'SELECT category_id AS categoryId, category_title AS categoryTitle, category_description AS categoryDescription FROM category',
      function(err, results){
          if (err){
            return done(err, false);
          }else{
            return done(false, results)
          }
      }
  );
};

module.exports = {
    getAll: getAll,
    insert: insert,
    getBids: get_bids,
    addBid: add_bid,
    getOne: get_one,
    alter: alter,
    getCategories: get_categories
}

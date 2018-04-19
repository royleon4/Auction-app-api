const db = require('../../config/db');
const dateTime = require('node-datetime');
const dateFormat = require('dateformat');

/**
 * return all projects between `limit` and `limit+offset` when ordered by creation timestamp
 *
 */
const getAll = function(options, done){
    let startindex = options.startIndex;
    let count = options.count;
    let q = options.q;
    let categoryid = options.categoryid;
    let seller = options.seller;
    let bidder = options.bidder;

    let values = [];
    let query =
        "SELECT a.*, c.category_title  " +
        "FROM auction a " +
        "LEFT JOIN category c " +
        "ON a.auction_categoryid = c.category_id " +
        "WHERE a.auction_id > -1";

    if (q !== undefined) {
        values.push("%" + q + "%");
        query += " AND a.auction_title LIKE ?";
        //console.log(query);
    }

    if (categoryid !== undefined && categoryid == parseInt(categoryid, 10)  && categoryid > 0) {
        values.push(categoryid);
        query += " AND a.auction_categoryid = ?";
    }

    if (seller !== undefined && seller == parseInt(seller, 10)  && seller > 0) {
        values.push(seller);
        query += ' AND a.auction_userid = ?';
    }

    if (bidder !== undefined && bidder == parseInt(bidder, 10)  && bidder > 0) {
        values.push(bidder);
        query = sql.substring(0, 106) + "LEFT JOIN bid b ON a.auction_id = b.bid_auctionid " + sql.substring(106,);
        query = sql.substring(0, 29) + ", b.bid_amount " + sql.substring(29,);
        query += ' AND b.bid_userid = ? AND a.auction_id = b.bid_auctionid AND b.bid_amount = (SELECT max(bid_amount) FROM bid WHERE bid_auctionid = a.auction_id)';
    }

    query += ' order by auction_startingdate DESC';

    if ( count !== undefined && count == parseInt(count, 10)  && count > 0) {
        query += " LIMIT " + count;
    }

    if (startindex !== undefined && startindex == parseInt(startindex, 10)  && startindex > 0) {
        query +=" OFFSET " + startindex;
    }


    db.get_pool().query(
        query,
        values,
        function(err, rows){
            if (err || !rows) return done(err);

            //console.log(rows);

            if(rows.length == 0){
              //console.log("empty");
              return done(false, rows)
            }else{
              let values = [];

              for(let row of rows){
                if(!values.includes(row.auction_id)){
                  values.push(row.auction_id);
                }
              }

              let auction_bids_query = "SELECT max(bid_amount) as max, bid_auctionid, bid_userid from bid WHERE bid_auctionid IN (?)";

              db.get_pool().query(auction_bids_query, values, function (err, bids) {
                if(err) return done(err, false);

                let auction_results = [];

                for(let row of rows){
                  let auction_result = {
                    "id": row.auction_id,
                    "categoryTitle": row.category_title,
                    "categoryId": row.auction_categoryid,
                    "title": row.auction_title,
                    "reservePrice": row.auction_reserveprice ,
                    "startDateTime": Date.parse(row.auction_startingdate),
                    "endDateTime": Date.parse(row.auction_endingdate),
                    "currentBid": row.auction_startingprice
                  }

                  let id = row.auction_id;

                  if(row.bid_amount !== undefined){
                    auction_result.currentBid = row.bid_amount;
                  }

                  for(let bid of bids){
                    if(bid.bid_auctionid == id){
                      if(bid.bid_amount > auction_result.currentBid){
                        auction_result.currentBid = bid.bid_amount;
                      }
                    }
                  }
                  auction_results.push(auction_result);
                }

                return done(false, auction_results);
              });

            }
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

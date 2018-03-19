const   auctions = require('../models/auction.server.models'),
        users = require('../models/user.server.models'),
        log = require('../lib/logger')(),
        validator = require('../lib/validator'),
        config = require('../../config/config.js'),
        schema = require('../../config/seng365-2018_auction_0.0.5_swagger.json');

/**
 * list all auctions
 */
exports.list = function(req, res){
    validator.areValidParameters(req.query, schema.paths['/auctions'].get.parameters)
        .then(function(){
            auctions.getAll(req.query, function(err, auctions){
                // validate response
                if (auctions.length > 0) {
                    if (false){ //!validator.isValidSchema(auctions, 'components.schemas.auctionOverview')) {
                        log.warn(JSON.stringify(auctions, null, 2));
                        log.warn(validator.getLastErrors());
                        return res.sendStatus(500);
                    }
                }
                return res.status(200).json(auctions);
            })
        })
        .catch(() => res.sendStatus(400))
}

/**
 * create a new auction, from a request body that follows the `Auction` schema definition
 *
 * (must be authenticated)
 */
exports.create = function(req, res){
    if (false){ //!validator.isValidSchema(req.body, 'components.schemas.auctionsOverview')) {
        log.warn(`auctions.controller.create: bad auction ${JSON.stringify(req.body)}`);
        return res.sendStatus(400);
    } else {
        let auction = Object.assign({}, req.body);

        let token = req.get(config.get('authToken'));

        users.getIdFromToken(token, function(err, user_id){
            if (err){
                log.warn(`auctions.controller.create: couldn't get id from token: ${err}`);
                return res.sendStatus(400);
            }

            auctions.insert(auction, user_id, function(err, id){
                if (err){
                    log.warn(`auctions.controller.create: couldn't create ${JSON.stringify(auction)}: ${err}`);
                    return res.sendStatus(400); // duplicate record
                }
                res.status(201).json({id:id});
            });

        });
    }
}

/**
 * Get all bids for a given auction
 */
exports.get_bids = function(req, res){
    let auction_id = parseInt(req.params.id);
    if (!validator.isValidId(auction_id)) return res.sendStatus(404);

    auctions.getBids(auction_id, function(err, results){
        if (err){
            log.warn(`auctions.controller.get_bids: model returned error: ${err}`);
            return res.sendStatus(500);
        }

        res.status(200).json(results);
    });
}

/**
 * Add a bid for an auction
 *
 * (must be authenticated)
 */
exports.add_bid = function(req, res){
    let auction_id = parseInt(req.params.id);
    if (!validator.isValidId(auction_id)) return res.sendStatus(404);

    let amount = parseInt(req.query.amount);
    if (!validator.isValidId(amount)) return res.sendStatus(400);

    auctions.getBids(auction_id, function(err, current_bids){
        if (err){
            log.warn(`auctions.controller.get_bids: model returned error: ${err}`);
            return res.sendStatus(500);
        }

        let max_bid = current_bids[0]['amount'];

        for(let item of current_bids){
            if(item['amount'] > max_bid){
                max_bid = item['amount'];
            }
        }

        if(amount <= max_bid){
            res.sendStatus(400);
        }else{
            let token = req.get(config.get('authToken'));

            users.getIdFromToken(token, function(err, user_id){
                if (err){
                    log.warn(`auctions.controller.add_bid: couldn't get id from token: ${err}`);
                    return res.sendStatus(400);
                }

                auctions.addBid(auction_id, user_id, amount, function(err, results){
                    if (err){
                        log.warn(`auctions.controller.get_bids: model returned error: ${err}`);
                        return res.sendStatus(500);
                    }

                    res.sendStatus(201);
                });
            });
        }


    });
}


/**
 * Get a single auction
 */
exports.get_one = function(req, res){
    let auction_id = parseInt(req.params.id);
    if (!validator.isValidId(auction_id)) return res.sendStatus(404);


    auctions.getOne(auction_id, function(err, results){
       if(err){
           log.warn(`auctions.controller.get_one: model returned err: ${err}`);
           return res.sendStatus(500);
       } else if(!results){
           return res.sendStatus(404);
       }else{

           //console.log(results);
           let result = results[0]

           let temp_result = {
               "categoryId": result['auction_categoryid'],
               "categoryTitle": result['category_title'],
               "title": result['auction_title'],
               "reservePrice": result['auction_reserveprice'],
               "startDateTime": Date.parse(result['auction_startingdate']),
               "endDateTime": Date.parse(result['auction_endingdate']),
               "description": result['auction_description'],
               "creationDateTime": Date.parse(result['auction_creationdate']),
               "seller": {
                   "id": result['auction_userid'],
                   "username": result['user_username']
               },
               "startingBid": result['auction_startingprice']
           };

           //console.log(temp_result);

           auctions.getBids(auction_id, function(err, current_bids) {
               if (err) {
                   log.warn(`auctions.controller.get_bids: model returned error: ${err}`);
                   return res.sendStatus(500);
               } else {
                   let max_bid = current_bids[0]['amount'];

                   let bids = []

                   for (let item of current_bids) {

                       bids.push({
                           "amount": item['amount'],
                           "datetime": item['datetime'],
                           "buyerId": item['buyerId'],
                           "buyerUsername": item['buyerUsername']
                       });


                       if (item['amount'] > max_bid) {
                           max_bid = item['amount'];
                       }
                   }

                   temp_result['currentBid'] = max_bid;
                   temp_result['bids'] = bids;

                   return res.status(200).send(temp_result);
               }
           });
       }
    });
}
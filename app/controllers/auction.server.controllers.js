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

        for(let i = 0; i < data.length; i++){

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

}
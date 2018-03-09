const   auctions = require('../models/auction.server.models'),
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
// exports.create = function(req, res){
//
// }
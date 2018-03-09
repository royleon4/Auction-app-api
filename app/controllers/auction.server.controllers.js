const auctions = require('../models/auction.server.models');

/**
 * list all auctions
 */
exports.list = function(req, res){
    validator.areValidParameters(req.query, schema.paths['/auctions'].get.parameters)
        .then(query => {
            projects.getAll(query, (err, projects) => {
                // validate response
                if (projects.length > 0) {
                    if (!validator.isValidSchema(projects, 'components.schemas.auctionOverview')) {
                        log.warn(JSON.stringify(projects, null, 2));
                        log.warn(validator.getLastErrors());
                        return res.sendStatus(500);
                    }
                }
                return res.status(200).json(projects);
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

}
const   auctions = require('../models/auction.server.models'),
        users = require('../models/user.server.models'),
        log = require('../lib/logger')(),
        validator = require('../lib/validator'),
        config = require('../../config/config.js'),
        schema = require('../../config/seng365-2018_auction_0.0.5_swagger.json'),
        fs = require('fs'),
        path = require('path'),
        app_dir = path.dirname(require.main.filename);


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
           let result = results[0];

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

/**
 * Update an auction
 */
exports.update = function(req, res){
    let auction_id = parseInt(req.params.id);
    if (!validator.isValidId(auction_id)) return res.sendStatus(404);

    let token = req.get(config.get('authToken'));
    users.getIdFromToken(token, function(err, _id){
        if (_id !== auction_id){
            return res.sendStatus(401);
        }

        if (false){ //!validator.isValidSchema(req.body, 'components.schemas.auction')) {
            log.warn(`users.controller.update: bad auction ${JSON.stringify(req.body)}`);
            return res.sendStatus(400);
        }

        auctions.getOne(auction_id, function(err, results){
            if(err){
                log.warn(`auctions.controller.update: model returned err: ${err}`);
                return res.sendStatus(500);
            } else if(!results){
                return res.sendStatus(404);
            }else{

                let result = results[0];

                //get time now and start time
                let time_now = Date.now();
                let auction_start_time = Date.parse(result['auction_startingdate']);

                if(auction_start_time < time_now){
                    res.status(403);
                    //res.statusText('Forbidden - bidding has begun on the auction.');
                    res.send();
                }else{
                    //do the update
                    let category_id = 0;
                    let title = "";
                    let reserve_price = 0;
                    let start_date_time = 0;
                    let end_date_time = 0;
                    let description = ""
                    let starting_bid = 0;

                    if(req.body.hasOwnProperty('categoryId')){
                        category_id = req.body['categoryId'];
                    }else{
                        category_id = results['categoryId'];
                    }

                    if(req.body.hasOwnProperty('title')){
                        title = req.body['title'];
                    }else{
                        title = results['title'];
                    }

                    if(req.body.hasOwnProperty('reservePrice')){
                        reserve_price = req.body['reservePrice'];
                    }else{
                        reserve_price = results['reservePrice'];
                    }

                    if(req.body.hasOwnProperty('startDateTime')){
                        start_date_time = req.body['startDateTime'];
                    }else{
                        start_date_time = results['startDateTime'];
                    }

                    if(req.body.hasOwnProperty('endDateTime')){
                        end_date_time = req.body['endDateTime'];
                    }else{
                        end_date_time = results['endDateTime'];
                    }

                    if(req.body.hasOwnProperty('description')){
                        description = req.body['description'];
                    }else{
                        description = results['description'];
                    }

                    if(req.body.hasOwnProperty('startingBid')){
                        starting_bid = req.body['startingBid'];
                    }else{
                        starting_bid = results['startingBid'];
                    }

                    let auction = {
                        "category_id": category_id,
                        "title": title,
                        "reserve_price": reserve_price,
                        "start_date_time": start_date_time,
                        "end_date_time": end_date_time,
                        "description": description,
                        "starting_bid": starting_bid
                    };

                    auctions.alter(auction_id, auction, function(err){
                        if(err) return res.sendStatus(500);

                        return res.sendStatus(200);
                    })

                }
            }
        });
    });
}

/**
* Get a photo for an auction
*/
exports.list_photos = function(req, res){
  let auction_id = parseInt(req.params.id);
  if (!validator.isValidId(auction_id)) return res.sendStatus(404);

  // Check file exists
  let check_path_jpeg = app_dir + "/uploads/" + auction_id + ".jpeg"
  let check_path_png = app_dir + "/uploads/" + auction_id + ".png"

  let default_path = app_dir + "/uploads/default.png"

  fs.stat(check_path_jpeg, function(err, stat){
    if(err){
      fs.stat(check_path_png, function(err, stat){
        if(err){
          // Not found JPEG or PNG
          fs.stat(default_path, function(err, stat){
            if (err){
              // There is a problem
              res.sendStatus(500);
            }else{
              // Send the default
              res.set("Content-Type", 'image/png');
              res.sendFile(default_path);
            }
          });
        }else{
          // Its found a png
          res.set("Content-Type", 'image/png');
          res.sendFile(check_path_png);
        }
      });
    }else{
      // Its found a JPEG
      res.set("Content-Type", 'image/jpeg');
      res.sendFile(check_path_jpeg);
    }
  });
}

/**
* Post a photo for an auction
*/
exports.add_photo = function(req, res){
  let auction_id = parseInt(req.params.id);
  if (!validator.isValidId(auction_id)) return res.sendStatus(404);

  let token = req.get(config.get('authToken'));
  users.getIdFromToken(token, function(err, _id){
    auctions.getOne(auction_id, function(err, results){
      if(err){
        log.warn(`auctions.controller.get_one: model returned err: ${err}`);
        return res.sendStatus(500);
      }else if(!results){
        return res.sendStatus(404);
      }else{
        let result = results[0];
        let owner_id = result['auction_userid']

        if(_id !== owner_id){
          return res.sendStatus(403);
        }else{
          let content_type = req.get('Content-Type')

          let file_ext = "";
          if(content_type === 'image/png'){
            file_ext = "png";
          }else if(content_type === 'image/jpeg'){
            file_ext = "jpeg";
          }

          req.pipe(fs.createWriteStream('./uploads/' + auction_id + '.' + file_ext));

          res.sendStatus(201);

        }
      }
    });
  });
}

/**
* Delete an auctions photo
*/
exports.delete_photo = function(req, res){
  let auction_id = parseInt(req.params.id);
  if (!validator.isValidId(auction_id)) return res.sendStatus(404);

  let token = req.get(config.get('authToken'));
  users.getIdFromToken(token, function(err, _id){
    auctions.getOne(auction_id, function(err, results){
      if(err){
        log.warn(`auctions.controller.get_one: model returned err: ${err}`);
        return res.sendStatus(500);
      } else if(!results){
        return res.sendStatus(404);
      }else{
        let result = results[0];
        let owner_id = result['auction_userid']

        if(_id !== owner_id){
          return res.sendStatus(403);
        }else{
          let check_path_jpeg = "./uploads/" + auction_id + ".jpeg"
          let check_path_png = "./uploads/" + auction_id + ".png"

          fs.unlink(check_path_jpeg, function(err){
            if(err){
              fs.unlink(check_path_png, function(err){
                if(err){
                  log.warn(`auctions.controller.delete_photo: unlinking file returned: ${err}`);
                  res.sendStatus(500);
                }else{
                  res.sendStatus(201);
                }
              });
            }else{
              res.sendStatus(201)
            }
          });
        }
      }
    });
  });
}

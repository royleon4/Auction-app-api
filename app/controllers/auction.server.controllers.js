const   auctions = require('../models/auction.server.models'),
        users = require('../models/user.server.models'),
        log = require('../lib/logger')(),
        validator = require('../lib/validator'),
        config = require('../../config/config.js'),
        schema = require('../../config/seng365-2018_auction_0.0.7_swagger.json'),
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

                if(err || !auctions) return res.sendStatus(400);

                if(auctions.length == 0){
                  //console.log("empty");
                  return res.status(200).json(auctions);
                }else{
                    if (!validator.isValidSchema(auctions, 'components.schemas.auctionsOverview')) {
                        log.warn(JSON.stringify(auctions, null, 2));
                        log.warn(validator.getLastErrors());
                        return res.sendStatus(500);
                    }else{
                      return res.status(200).json(auctions);
                    }
                }
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
    if (!validator.isValidSchema(req.body, 'components.schemas.PostAuction')) {
        log.warn(`auctions.controller.create: bad auction against schema ${JSON.stringify(req.body)}`);
        return res.sendStatus(400);
    } else {
        let auction = Object.assign({}, req.body);

        if(!auction["endDateTime"] || auction["endDateTime"] <= 0){
          log.warn(`auctions.controller.create: bad end date ${JSON.stringify(auction)}`);
          return res.sendStatus(400);
        }

        if(!auction["startDateTime"] || auction["startDateTime"] <= 0){
          log.warn(`auctions.controller.create: bad start date ${JSON.stringify(auction)}`);
          return res.sendStatus(400);
        }

        if(auction["startDateTime"] >= auction["endDateTime"]){
          log.warn(`auctions.controller.create: start date must be before end ${JSON.stringify(auction)}`);
          return res.sendStatus(400);
        }

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
                log.warn(`auctions.controller.create: created successfully ${JSON.stringify(auction)}`);
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
    let date_time_now = (new Date).getTime();

    let auction_id = parseInt(req.params.id);
    if (!validator.isValidId(auction_id)) return res.sendStatus(404);

    let amount = parseInt(req.query.amount);
    if (!validator.isValidId(amount)) return res.sendStatus(400);


    auctions.getOne(auction_id, function(err, results){
        if(err) return res.sendStatus(404);

        if (!results || results.length != 1) return res.sendStatus(400);

        let result = results[0];

        let end_date_time = Date.parse(result['auction_endingdate']);

        console.log("*************");
        console.log("end_date", result['auction_endingdate'], end_date_time);
        console.log("now", date_time_now);
        let iso_time = new Date().toISOString();
        console.log("iso_time", iso_time, Date.parse(iso_time));
        console.log("*************");

        if(end_date_time <= date_time_now){
            log.warn(`auctions.controller.add_bids: adding bid after end date: ${result['auction_endingdate']}`);
            return res.sendStatus(400);
        }else {
            auctions.getBids(auction_id, function (err, current_bids) {
                if (err) {
                    log.warn(`auctions.controller.get_bids: model returned error: ${err}`);
                    return res.sendStatus(500);
                }

                let max_bid = 0;
                if (current_bids && current_bids.length > 0) {

                    max_bid = current_bids[0]['amount'];

                    for (let item of current_bids) {
                        if (item['amount'] > max_bid) {
                            max_bid = item['amount'];
                        }
                    }
                }

                if (amount <= max_bid) {
                    log.warn(`auctions.controller.add_bids: bid is less than or equal to current amount`);
                    res.sendStatus(400);
                } else {
                    let token = req.get(config.get('authToken'));

                    users.getIdFromToken(token, function (err, user_id) {
                        if (err) {
                            log.warn(`auctions.controller.add_bid: couldn't get id from token: ${err}`);
                            return res.sendStatus(400);
                        }

                        auctions.addBid(auction_id, user_id, amount, function (err, results) {
                            if (err) {
                                log.warn(`auctions.controller.get_bids: model returned error: ${err}`);
                                return res.sendStatus(500);
                            }

                            res.sendStatus(201);
                        });
                    });
                }


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
                 if(current_bids && current_bids.length > 0){
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
                 }else{
                   temp_result['currentBid'] = 0;
                   temp_result['bids'] = [];
                 }

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
    console.log('Update auction=',token);
    users.getIdFromToken(token, function(err, _id){

        if (!validator.isValidSchema(req.body, 'components.schemas.Auction')) {
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

                let user_id = results[0]['auction_userid'];

                if (_id !== user_id){
                    console.log('user_id=',user_id, ' and user_id=', _id);
                    return res.sendStatus(401);
                }

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
                        category_id = result['auction_categoryid'];
                    }

                    if(req.body.hasOwnProperty('title')){
                        title = req.body['title'];
                    }else{
                        title = result['title'];
                    }

                    if(req.body.hasOwnProperty('reservePrice')){
                        reserve_price = req.body['reservePrice'];
                    }else{
                        reserve_price = result['auction_reserveprice'];
                    }

                    if(req.body.hasOwnProperty('startDateTime')){
                        start_date_time = req.body['startDateTime'];
                    }else{
                        start_date_time = result['auction_startingdate'];
                    }

                    if(req.body.hasOwnProperty('endDateTime')){
                        end_date_time = req.body['endDateTime'];
                    }else{
                        end_date_time = result['auction_endingdate'];
                    }

                    if(req.body.hasOwnProperty('description')){
                        description = req.body['description'];
                    }else{
                        description = result['auction_description'];
                    }

                    if(req.body.hasOwnProperty('startingBid')){
                        starting_bid = req.body['startingBid'];
                    }else{
                        starting_bid = result['auction_startingprice'];
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
                        if(err){
                            console.log(auction);
                            console.log(err)
                            return res.sendStatus(500);
                        }

                        console.log('Update auction: invalid end date');
                        console.log(auction);

                        return res.sendStatus(201);
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
              res.status(200);
              res.sendFile(default_path);
            }
          });
        }else{
          // Its found a png
          res.set("Content-Type", 'image/png');
          res.status(200);
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
          let content_type = req.get('Content-Type');
          console.log('Content-Type=', content_type);
          if (!content_type){console.log(req)};

          let file_ext = "";
          if(content_type === 'image/png'){
            file_ext = "png";
          }else if(content_type === 'image/jpeg' || content_type === 'image/jpg'){
            file_ext = "jpeg";
          }
          if (file_ext === '') {console.log('file_ext is empty')};
          console.log('add_photo:', auction_id + file_ext, 'user_id', owner_id);
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
      } else if(!results || results.length == 0){
        return res.sendStatus(404);
      }else{
        let result = results[0];
        log.warn(result);
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

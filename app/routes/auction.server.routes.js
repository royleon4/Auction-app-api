const auction = require('../controllers/auction.server.controllers'),
      auth = require('../lib/middleware');

module.exports = function(app){
  app.route('/api/v1/auctions')
    .get(auction.list)
    .post(auth.isAuthenticated, auction.create);

  app.route('/api/v1/auctions/:id')
     .get(auction.get_one)
     .patch(auth.isAuthenticated, auction.update);

  app.route('/api/v1/auctions/:id/bids')
     .get(auction.get_bids)
     .post(auth.isAuthenticated, auction.add_bid);
  //
  // app.route('/auctions/:id/photos')
  //   .get(auction.list_photos)
  //   .post(auction.add_photo);
  //


}

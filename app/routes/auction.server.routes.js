const auction = require('../controllers/auction.server.controllers'),
      auth = require('../lib/middleware');

module.exports = function(app){
  app.route('/api/v1/auctions')
    .get(auction.list);
    //.post(auth.isAuthenticated, auction.create);

  // app.route('/auctions/:id')
  //   .get(auction.get_one)
  //   .patch(auction.update);
  //
  // app.route('/auctions/:id/bids')
  //   .get(auction.get_bids)
  //   .post(auction.add_bid);
  //
  // app.route('/auctions/:id/photos')
  //   .get(auction.list_photos)
  //   .post(auction.add_photo);
  //
  // app.route('/auctions/:id/photos/:photo_id')
  //   .get(auction.get_photo)
  //   .put(auction.update_photo)
  //   .delete(auction.delete_photo);

}

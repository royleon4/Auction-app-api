const database = require('../controllers/database.server.controllers');

module.exports = function(app){
  app.route('/reset')
    .post(database.reset);

  app.route('/resample')
    .post(database.resample);

}

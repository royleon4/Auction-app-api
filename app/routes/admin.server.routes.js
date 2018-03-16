const admin = require('../controllers/admin.server.controllers');

module.exports = function(app){
  app.route('/api/v1/status')
      .get(admin.status);

  app.route('/api/v1/reset')
     .post(admin.reset);

  app.route('/api/v1/resample')
     .post(admin.resample);

}

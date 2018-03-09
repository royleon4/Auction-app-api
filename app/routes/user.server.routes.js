const users = require('../controllers/user.server.controllers'),
      auth = require('../lib/middleware');

module.exports = function(app){
  app.route('/api/v1/users')
    .post(users.create);

  app.route('/api/v1/users/:id')
    .get(users.get_one)
    .patch(auth.isAuthenticated, users.update);

  app.route('/api/v1/users/login')
    .post(users.login);

  app.route('/api/v1/users/logout')
    .post(auth.isAuthenticated, users.logout);
}

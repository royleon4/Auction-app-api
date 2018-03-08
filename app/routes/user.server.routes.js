const users = require('../controllers/user.server.controllers');

module.exports = function(app){
  app.route('/api/v1/users')
    .post(users.create);

  // app.route('/users/:id')
  //   .get(users.get_one)
  //   .patch(users.update);
  //
  app.route('/api/v1/users/login')
    .post(users.login);

  app.route('/api/v1/users/logout')
    .post(users.logout);
}

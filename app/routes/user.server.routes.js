const users = require('../controllers/user.server.controllers');

module.exports = function(app){
  app.route('/users')
    .get(users.list)
    .post(users.create);

  app.route('/users/:id')
    .get(users.get_one)
    .patch(users.update);

  app.route('/users/login')
    .post(users.login);

  app.route('/users/logout')
    .post(users.logout)
}

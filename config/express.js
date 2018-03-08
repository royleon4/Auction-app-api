const express = require('express'),
	bodyParser = require('body-parser');

module.exports = function(){
	const app = express()

	app.use(bodyParser.json());

	require('../app/routes/user.server.routes')(app);
	// require('../app/routes/auction.server.routes')(app);
	// require('../app/routes/database.server.routes')(app);

	return app;
}

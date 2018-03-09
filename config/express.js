const express = require('express'),
	bodyParser = require('body-parser');

module.exports = function(){
	const app = express()

	app.use(bodyParser.json());


	app.get('/', function(req, res){
		res.status(200).json({"msg": "Server up"});
    });

	require('../app/routes/user.server.routes')(app);
	require('../app/routes/auction.server.routes')(app);
	require('../app/routes/admin.server.routes')(app);

	return app;
}

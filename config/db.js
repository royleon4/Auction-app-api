const mysql = require('mysql');

let state = {
	pool: null
}

exports.connect = function(done){
	state.pool = mysql.createPool({
		host: "mysql3.csse.canterbury.ac.nz",
		user: "coscc770",
		password: "123456789",
		database: "coscc770"
	});
	done();
}

exports.get_pool = function(){
	return state.pool;
}

const chai = require('chai');
const chaiHttp = require('chai-http');

const should = chai.should();

chai.use(chaiHttp);

const server_url = "http://csse-s365.canterbury.ac.nz:5470/api/v1";

describe('Server check', function(){
	describe('GET /api/v1/status', function(){
		it('it should check the server is up', function(done){
			chai.request(server_url)
				.get('/status')
				.end(function(err, res){
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.should.have.property('msg');
					res.body.msg.should.equal("I'm up!");
					done();
				});
		});
	});
});


describe('User functionality', function(){
	describe('POST /api/v1/users', function(){
		it('it should add a user when username, givenname, familyname, email and password are supplied', function(done){
			let user = {
				"username": "awi111",
				"givenName": "Ashley",
				"familyName": "Williams",
				"email": "ashley.williams@pg.canterbury.ac.nz",
				"password": "123456"
			}

			chai.request(server_url)
				.post('/users')
				.send(user)
				.end(function(err, res){
					res.should.have.status(201);
					res.body.should.be.an('object');
					res.body.should.have.property('id');
					done();
				});
		});
		it('it should not allow us to add users if a user with the same username exists', function(done){
			let user = {
				"username": "awi111",
				"givenName": "Ashley",
				"familyName": "Williams",
				"email": "ashley.williams@pg.canterbury.ac.nz",
				"password": "123456"
			}

			chai.request(server_url)
				.post('/users')
				.send(user)
				.end(function(err, res){
					res.should.have.status(400);
					done();
				});
		});
		it('it should not allow us to add users if they do not meet our schema', function(done){
			let user = {
				"username": "different_username",
				"familyName": "Williams",
				"email": "ashley.williams@pg.canterbury.ac.nz",
				"password": "123456"
			}

			chai.request(server_url)
				.post('/users')
				.send(user)
				.end(function(err, res){
					res.should.have.status(400);
					done();
				});
		});









	});

	describe('POST /api/v1/users/login', function(){

	});

	describe('POST /api/v1/users/logout', function(){

	});

	describe('GET /api/v1/users/{id}', function(){

	});

	describe('PATCH /api/v1/users/{id}', function(){

	});
});

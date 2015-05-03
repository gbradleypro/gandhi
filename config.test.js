'use strict';

var fs = require('fs');
var crypto = require('crypto');

module.exports = {
	root: '',
	db: {
		host: process.env.TEST_RETHINKDB || '127.0.0.1',
		db: 'gandhi'
	},
	pool: {
		max: 1,
		min: 1,
		timeout: 30000
	},
	redis: {
		host: process.env.TEST_REDIS || '127.0.0.1'
	},
	auth: {
		secret: 'rubber bunny'
	},
	mail: {
		transport: null,
		defaults: {
			from: 'test@test.gandhi.io'
		}
	},
	modules: fs.readdirSync(__dirname + '/lib/modules').map(function(dir){
		return __dirname + '/lib/modules/' + dir;
	}),
	files: {
		directory: __dirname + '/uploads'
	},
	port: 3000,
	log: false
};

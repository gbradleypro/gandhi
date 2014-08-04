'use strict';

var crypto = require('crypto');

module.exports = {
	root: '',
	db: {
		host: '127.0.0.1',
		db: 'gandhi'
	},
	auth: {
		secret: 'rubber bunny'
	},
	mail: {
		transport: 'stub',
		mailOptions: {},
		messageOptions: {
			from: 'test@test.gandhi.io'
		}
	},
	modules: [
		__dirname + '/lib/modules/gandhi-component',
		__dirname + '/lib/modules/gandhi-component-start',
		__dirname + '/lib/modules/gandhi-component-message'
	],
	files: {
		directory: __dirname + '/files'
	},
	port: 3000,
	log: false
};

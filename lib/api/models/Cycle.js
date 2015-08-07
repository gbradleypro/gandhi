'use strict';

var Promise     = require('bluebird');
var util        = require('util');
var errors      = require('../errors');

var Model       = require('../Model');
var Assignments = require('../collections/Cycles/Assignments');
var Invitations = require('../collections/Cycles/Invitations');
var Roles       = require('../collections/Cycles/Roles');
var Stages      = require('../collections/Cycles/Stages');
var Statuss     = require('../collections/Cycles/Statuses');
var Triggers    = require('../collections/Cycles/Triggers');


// Schema Validator
// ----------------

var validator = require('jjv')();
validator.addSchema(require('../schemas/cycle'));


// Model Constructor
// -----------------

function Cycle (data, user) {
	var self = this;

	if(typeof data === 'undefined' || typeof user === 'undefined')
		throw new Error('All constructor arguments are required by Model constructors.');

	// user
	Object.defineProperty(self, 'user', {
		value: user
	});

	return Model.call(self, data)
	.then(function(self){


		// authorizations
		self.authorizations = {
			'cycle:create':            self.user === true,
			'cycle:read':              self.user === true || self.status_id !== 'draft',
			'cycle:update':            self.user === true,
			'cycle:delete':            self.user === true,
			'cycle/assignments:read':  self.user === true || self.status_id !== 'draft',
			'cycle/assignments:write': self.user === true,
			'cycle/invitations:read':  self.user === true || self.status_id !== 'draft',
			'cycle/invitations:write': self.user === true,
			'cycle/roles:read':        self.user === true || self.status_id !== 'draft',
			'cycle/roles:write':       self.user === true,
			'cycle/stages:read':       self.user === true || self.status_id !== 'draft',
			'cycle/stages:write':      self.user === true,
			'cycle/statuses:read':     self.user === true || self.status_id !== 'draft',
			'cycle/statuses:write':    self.user === true,
			'cycle/triggers:read':     self.user === true || self.status_id !== 'draft',
			'cycle/triggers:write':    self.user === true
		};


		// role
		return Promise.resolve().then(function(){

			// admin user
			if(self.user === true)
				return self.role = true;

			// invalid user
			if(typeof self.user !== 'object' || typeof self.user.id !== 'string')
				return self.role = false;

			// lookup role in cycle
			return self.assignments.get(user.id)
			.then(function(assignment){
				self.role = self.roles.get(assignment.role_id);
			})
			.catch(function(err){
				self.role = false;
			});
		})
		.then(function(){
			return self;
		});
	});
}


// Model Configuration
// -------------------

Cycle.table = 'cycles';
Cycle.collections = {
	assignments: Assignments,
	invitations: Invitations,
	roles:       Roles,
	stages:      Stages,
	statuses:    Statuss,
	triggers:    Triggers
};
Cycle.reconstruct = function(data, old) {
	return new Cycle(data, old.user);
};
Cycle.validate = function(data) {
	return validator.validate('http://www.gandhi.io/schema/cycle', data, {useDefault: true, removeAdditional: true});
};
Cycle.create = function(conn, data, user) {
	return new Cycle(data, user)
	.then(function(cycle){
		return cycle.save(conn);
	});
};



// Public Methods
// --------------

util.inherits(Cycle, Model);


// TODO: check authorizations for create


// check authorizations for update
Cycle.prototype.update = function(conn, delta) {
	var self = this;

	if(!self.authorizations['cycle:update'])
		return Promise.reject(new errors.ForbiddenError());

	return Model.prototype.update.call(this, conn, delta);
};

// check authorizations for delete
Cycle.prototype.delete = function(conn) {
	var self = this;

	if(!self.authorizations['cycle:delete'])
		return Promise.reject(new errors.ForbiddenError());

	return Model.prototype.delete.call(this, conn);
};


module.exports = Cycle;
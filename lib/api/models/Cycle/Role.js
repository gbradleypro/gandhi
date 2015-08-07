'use strict';

var util = require('util');
var errors = require('../../errors');
var EmbeddedModel = require('../../EmbeddedModel');


// Schema Validator
// ----------------

var validator = require('jjv')();
validator.addSchema(require('../../schemas/cycle'));


// EmbeddedModel Constructor
// -------------------------

function Role (data, parent) {
	return EmbeddedModel.call(this, data, parent);
}


// EmbeddedModel Configuration
// ---------------------------

Role.key = 'roles';
Role.collections = {};
Role.validate = function(data) {
	return validator.validate('http://www.gandhi.io/schema/cycle#/definitions/role', data, {useDefault: true, removeAdditional: true});
};
Role.create = function(conn, data, parent) {
	
	if(!parent.authorizations['cycle/roles:write'])
		return Promise.reject(new errors.ForbiddenError());

	return new Role(data, parent)
	.then(function(role) {
		return role.save(conn);
	});
};


// Public Methods
// --------------

util.inherits(Role, EmbeddedModel);


// check authorizations for update
Role.prototype.update = function(conn, delta) {
	var self = this;

	if(!self.parent.authorizations['cycle/roles:write'])
		return Promise.reject(new errors.ForbiddenError());

	return EmbeddedModel.prototype.update.call(this, conn, delta);
};

// check authorizations for delete
Role.prototype.delete = function(conn) {
	var self = this;

	if(!self.parent.authorizations['cycle/roles:write'])
		return Promise.reject(new errors.ForbiddenError());

	return EmbeddedModel.prototype.delete.call(this, conn);
};


module.exports = Role;
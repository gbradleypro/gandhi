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

function Trigger (data, parent) {
	return EmbeddedModel.call(this, data, parent);
}


// EmbeddedModel Configuration
// ---------------------------

Trigger.key = 'triggers';
Trigger.collections = {};
Trigger.validate = function(data) {
	return validator.validate('http://www.gandhi.io/schema/cycle#/definitions/trigger', data, {useDefault: true, removeAdditional: true});
};
Trigger.create = function(conn, data, parent) {
	
	if(!parent.authorizations['cycle/triggers:write'])
		return Promise.reject(new errors.ForbiddenError());

	return new Trigger(data, parent)
	.then(function(trigger) {
		return trigger.save(conn);
	});
};


// Public Methods
// --------------

util.inherits(Trigger, EmbeddedModel);


// check authorizations for update
Trigger.prototype.update = function(conn, delta) {
	var self = this;

	if(!self.parent.authorizations['cycle/triggers:write'])
		return Promise.reject(new errors.ForbiddenError());

	return EmbeddedModel.prototype.update.call(this, conn, delta);
};

// check authorizations for delete
Trigger.prototype.delete = function(conn) {
	var self = this;

	if(!self.parent.authorizations['cycle/triggers:write'])
		return Promise.reject(new errors.ForbiddenError());

	return EmbeddedModel.prototype.delete.call(this, conn);
};


module.exports = Trigger;
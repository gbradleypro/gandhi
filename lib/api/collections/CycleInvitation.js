'use strict';

var r = require('rethinkdb');
var Q = require('q');

var uuid = require('../utils/uuid.js');
var collection = require('../collection.js');

module.exports = function CycleInvitation(config, resources) {
	return {
		query: queryInvitations,
		get: getInvitation,
		create: createInvitation,
		save: saveInvitation,
		update: updateInvitation,
		delete: deleteInvitation,
	};



	function queryInvitations(conn, cycleId, query, user){
		if(!user) return Q.reject(401);
		return r.table('cycles').get(cycleId).do(function(cycle){

			// get the cycle
			return r.branch(
				cycle.not(),
				r.error('{"code": 404, "message": "Cycle not found."}'),

				// get the invitations
				cycle('invitations').coerceTo('array').map(function(kv){
					return kv.nth(1).merge({
						cycle_id: cycle('id')
					});
				})
			);
		}).run(conn)

		// parse errors
		.catch(collection.throwError);
	}


	function getInvitation(conn, cycleId, invitationId, user){
		if(!user) return Q.reject(401);
		return r.table('cycles').get(cycleId).do(function(cycle){

			// get the cycle
			return r.branch(
				cycle.not(),
				r.error('{"code": 404, "message": "Cycle not found."}'),

				// get the invitation
				cycle('invitations')(invitationId).default(null).do(function(invitation){
					return r.branch(
						invitation.not(),
						r.error('{"code": 404, "message": "Invitation not found."}'),
						invitation.merge({
							cycle_id: cycle('id')
						})
					);
				})
			);
		}).run(conn)

		// parse errors
		.catch(collection.throwError);
	}

	function createInvitation(conn, cycleId, data, user){
		if(!user) return Q.reject(401);
		if(user !== true) return Q.reject(403);

		// validate lack of id
		if(data.id) return Q.reject({code: 400, message: 'No id should be set.'});

		// set new id
		var invitationId = data.id = uuid();

		// validate invitation
		var err = resources.validator.validate('http://www.gandhi.io/schema/cycle#/definitions/invitation', data, {useDefault: true});
		if(err) return Q.reject({code: 400, message: err});

		// acquire a lock for this cycle
		var lock = new resources.lock('cycle:' + cycleId);
		return lock.acquire()

		// run the query
		.then(function(){
			return r.table('cycles').get(cycleId).do(function(cycle){
				var delta = {
					invitations: {},
					updated: r.now().toEpochTime()
				}; delta.invitations[invitationId] = r.literal(data);

				// get the cycle
				return r.branch(
					cycle.not(),
					r.error('{"code": 404, "message": "Cycle not found."}'),

					// update the cycle
					cycle.merge(delta).do(function(write){
						return r.branch(
							r.table('cycles').get(cycleId).replace(write)('errors').gt(0),
							r.error('{"code": 500, "message": "Error writing to the database."}'),

							// return new value
							write('invitations')(invitationId).merge({
								cycle_id: cycle('id')
							})
						);
					})
				);
			}).run(conn)

			// parse errors
			.catch(collection.throwError);
		})

		// release the lock
		.finally(lock.release.bind(lock));
	}


	function updateInvitation(conn, cycleId, invitationId, data, user){
		if(!user) return Q.reject(401);
		if(user !== true) return Q.reject(403);

		// validate id
		if(typeof data.id !== 'undefined' && invitationId !== data.id) return Q.reject({code: 400, message: 'The request body\'s id did not match the URL param.'});

		// validate invitation
		var err = resources.validator.validate('http://www.gandhi.io/schema/cycle#/definitions/invitation', data, {checkRequired: false});
		if(err) return Q.reject({code: 400, message: err});

		// acquire a lock for this cycle
		var lock = new resources.lock('cycle:' + cycleId);
		return lock.acquire()

		// run the query
		.then(function(){
			return r.table('cycles').get(cycleId).do(function(cycle){
				var delta = {
					invitations: {},
					updated: r.now().toEpochTime()
				}; delta.invitations[invitationId] = data;

				// get the cycle
				return r.branch(
					cycle.not(),
					r.error('{"code": 404, "message": "Cycle not found."}'),

					// get the invitation
					r.branch(
						cycle('invitations')(invitationId).default(null).not(),
						r.error('{"code": 404, "message": "Invitation not found."}'),

						// update the cycle
						r.table('cycles').get(cycleId).update(delta, {returnChanges: true}).do(function(result){
							return r.branch(
								result('errors').gt(0),
								r.error('{"code": 500, "message": "Error writing to the database."}'),

								// return new value
								result('changes').nth(0)('new_val')('invitations')(invitationId).merge({
									cycle_id: cycle('id')
								})
							);
						})
					)
				);
			}).run(conn)

			// parse errors
			.catch(collection.throwError);
		})

		// release the lock
		.finally(lock.release.bind(lock));
	}


	function saveInvitation(conn, cycleId, invitationId, data, user){
		if(!user) return Q.reject(401);
		if(user !== true) return Q.reject(403);

		// validate id
		if(invitationId !== data.id) return Q.reject({code: 400, message: 'The request body\'s id did not match the URL param.'});

		// validate invitation
		var err = resources.validator.validate('http://www.gandhi.io/schema/cycle#/definitions/invitation', data, {useDefault: true});
		if(err) return Q.reject({code: 400, message: err});

		// acquire a lock for this cycle
		var lock = new resources.lock('cycle:' + cycleId);
		return lock.acquire()

		// run the query
		.then(function(){
			return r.table('cycles').get(cycleId).do(function(cycle){
				var delta = {
					invitations: {},
					updated: r.now().toEpochTime()
				}; delta.invitations[invitationId] = r.literal(data);

				// get the cycle
				return r.branch(
					cycle.not(),
					r.error('{"code": 404, "message": "Cycle not found."}'),

					// make sure the invitation exists
					r.branch(
						cycle('invitations').hasFields(invitationId).not(),
						r.error('{"code": 404, "message": "Invitation not found."}'),

						// update the cycle
						cycle.merge(delta).do(function(write){
							return r.branch(
								r.table('cycles').get(cycleId).replace(write)('errors').gt(0),
								r.error('{"code": 500, "message": "Error writing to the database."}'),

								// return new value
								write('invitations')(invitationId).merge({
									cycle_id: cycle('id')
								})
							);
						})
					)
				);
			}).run(conn)

			// parse errors
			.catch(collection.throwError);
		})

		// release the lock
		.finally(lock.release.bind(lock));
	}


	function deleteInvitation(conn, cycleId, invitationId, user){
		if(!user) return Q.reject(401);
		if(user !== true) return Q.reject(403);

		// acquire a lock for this cycle
		var lock = new resources.lock('cycle:' + cycleId);
		return lock.acquire()

		// run the query
		.then(function(){
			return r.table('cycles').get(cycleId).do(function(cycle){
				var delta = {
					updated: r.now().toEpochTime()
				};

				var without = { invitations: {} };
				without.invitations[invitationId] = true;

				// get the cycle
				return r.branch(
					cycle.not(),
					r.error('{"code": 404, "message": "Cycle not found."}'),

					// get the invitation
					r.branch(
						cycle('invitations')(invitationId).default(null).not(),
						r.error('{"code": 404, "message": "Invitation not found."}'),

						// update the cycle
						cycle.without(without).merge(delta).do(function(write){
							return r.branch(
								r.table('cycles').get(cycleId).replace(write)('errors').gt(0),
								r.error('{"code": 500, "message": "Error writing to the database."}'),

								// return old value
								cycle('invitations')(invitationId).merge({
									cycle_id: cycle('id')
								})
							);
						})
					)
				);
			}).run(conn)

			// parse errors
			.catch(collection.throwError);
		})

		// release the lock
		.finally(lock.release.bind(lock));
	}

};
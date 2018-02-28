/*
 * transfer.js
 * https://github.com/skalio/teambeamjs
 *
 * Copyright (c) 2015 Skalio GmbH
 * Licensed under the MIT license.
 * 
 * @license
 */

'use strict';

var Q = require('q'),
	path = require('path'),
	jsonfile = require('jsonfile'),
	moment = require('moment'),
	reqHelper = require('./reqHelper'),
	settings = require('./settings'),
	logHelper = require('./logHelper'),
	File = require('./file');
	
/**
 * Creates a new Transfer object
 * @param {object} input source object
 */	
var Transfer = function(input) {
	input = input || {};
	
	this.recipientId = input.recipientId || undefined;
	this.sender = {
		email: input.sender ? (input.sender.email || undefined) : undefined,
		realname: input.sender ? (input.sender.realname || undefined) : undefined
	};
	this.receiver = {
		email: input.receiver ? (input.receiver.email || undefined) : undefined,
		realname: input.receiver ? (input.receiver.realname || undefined) : undefined,
		type: input.receiver ? (input.receiver.type || undefined) : undefined
	};
	this.uploadTimestamp = moment(input.uploadTimestamp || 0).toDate();
	this.downloadTimestamp = moment(input.downloadTimestamp || 0).toDate();
	this.expirationTimestamp = moment(input.expirationTimestamp || 0).toDate();
	this.downloadCounter = input.downloadCounter || 0;
	this.subject = input.subject || undefined;
	this.description = input.description || undefined;
	this.folderIdx = input.folderIdx || undefined;
	this.priority = input.priority || 3;
	this.isLocked = input.isLocked || false;
	this.isInDrive = input.isInDrive || false;
	this.isExpired = input.isExpired || false;
	this.isBlocked = input.isBlocked || false;
	this.isBounced = input.isBounced || false;
	this.isProtected = input.isProtected || false;
	this.isRecipientAuthenticationEnabled = input.isRecipientAuthenticationEnabled || false;
	this.bounceReason = input.bounceReason || undefined;
	this.directLink = input.directLink || undefined;
	this.malwareStatus = input.malwareStatus || 'unknown';
	this.totalFileSize = input.totalFileSize || 0;
	this.files = [];
	if (input.files) {
		for (var i=0; i<input.files.length; i++) {
			this.files.push(new File(input.files[i]));
		}
	}
	this.anon = {
		email: input.anon ? (input.anon.email || undefined) : undefined,
		realname: input.anon ? (input.anon.realname || undefined) : undefined
	};
	this.meta = [];
};

Transfer.prototype.isUnread = function() {
	return (this.downloadCounter === 0);
};

Transfer.prototype.isInfected = function() {
	return (this.malwareStatus === 'infected');
};

/**
 * Retrieves all transfers
 * @returns {Array|Transfer}
 */
Transfer.getAll = function() {
	var url = settings.getBaseUrl() +'/rs/v1/transfers';
	
	return reqHelper.get(url)
	.then(function(result) {
		result = JSON.parse(result);
		logHelper.consoleOutput('Response contains ' + result.total + ' entries');
		var transfers = [],
			data;
		
		for (var i=0; i<result.transfers.length; i++) {
			data = result.transfers[i];
			transfers.push(new Transfer(data));
		}
		return transfers;
	});
};

/**
 * Fetches the transfer object of the given recipient ID
 * @param {string} recipientId
 * @returns {Transfer}
 */
Transfer.get = function(recipientId) {
	var url = settings.getBaseUrl() +'/rs/v1/transfers/'+ recipientId;
	
	return reqHelper.get(url)
	.then(function(result) {
		return new Transfer(result);
	});
};

/**
 * Creates a reduced copy of the transfer
 * @returns {Object}
 */
Transfer.prototype.export = function() {
	var i,
		obj = {},
		prop,
		fields = ['recipientId', 'sender', 'receiver', 'uploadTimestamp',
		'downloadTimestamp', 'expirationTimestamp', 'downloadCounter',
		'subject', 'description', 'folderIdx', 'priority', 'isBounced',
		'bounceReason', 'directLink', 'malwareStatus', 'totalFileSize',
		'files', 'anon', 'meta'
	];
	
	for (i=0; i<fields.length; i++) {
		prop = fields[i];
		if (this.hasOwnProperty(prop)) {
			obj[prop] = this[prop];
		}
	}
	
	return obj;
};

Transfer.prototype.exportToFile = function(basedir) {
	var that = this,
		deferred = Q.defer(),
		exportFile = path.join(basedir, 'transfer.json');

	jsonfile.writeFile(
			exportFile, 
			that.export(), 
			{spaces: 2},
			function(err) {
				if (err) {
					deferred.reject(err);
				} else {
					logHelper.consoleOutput('Transfer "' + that.recipientId + '" exported to "' + exportFile + '"');
					deferred.resolve();
				}
			});
			
	return deferred.promise;
};

Transfer.prototype.downloadFiles = function(basedir, options) {
	var that = this,
		promise = Q.resolve();

	options = options || {};
	logHelper.consoleOutput('Downloading files for transfer "' + that.recipientId + '"');
	this.files.forEach(function(file) {
		promise = promise.then(function() {
			return file.download(basedir, options);
		});
	});
	
	return promise.then(function() {
		logHelper.consoleOutput('All files for transfer "' + that.recipientId + '" have been downloaded');
		return Q.resolve();
	});
	
};

exports = module.exports = Transfer;

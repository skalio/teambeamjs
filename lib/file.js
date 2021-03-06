/*
 * file.js
 * https://github.com/skalio/teambeamjs
 *
 * Copyright (c) 2015 Skalio GmbH
 * Licensed under the MIT license.
 * 
 * @license
 */

'use strict';

var Q = require('q'),
	logHelper = require('./logHelper'),
	reqHelper = require('./reqHelper');
	
/**
 * @param {object} input
 * Creates a new File object
 */	
var File = function(input) {
	input = input || {};
	this.objectId = input.objectId || undefined;
	this.name = input.name || undefined;
	this.size = input.size || 0;
	this.hashsum = input.hashsum || undefined;
	this.url = input.url || undefined;
	this.malware = {
		status: input.malware ? (input.malware.status || 'unknown') : 'unknown',
		text: input.malware ? (input.malware.text || undefined) : undefined
	};
	this.downloadCounter = input.downloadCounter || 0;
};

File.prototype.getShortName = function() {
	if (this.name.length > 30) {
		return this.name.substr(0, 12) + "(...)" + this.name.substr(this.name.length - 12);
	} else {
		return this.name;
	}
};

File.prototype.getHTML5MediaType = function() {
	var ext = this.name.substr(this.name.length - 3);
	var type = false;
	switch (ext.toLowerCase()) {
		case "mp4":
			type = "video/mp4";
			break;
		case "m4v":
			type = "video/mp4";
			break;
		case "webm":
			type = "video/webm";
			break;
		case "mp3":
			type = "audio/mpeg";
			break;
		case "ogg":
			type = "audio/ogg";
			break;
		case "wav":
			type = "audio/wav";
			break;
		default:
			type = false;
			break;
	}
	return type;
};

File.prototype.download = function(basedir, options) {
	var that = this;
	options = options || {};
	logHelper.consoleOutput('Download starting for ' + that.objectId);
	options.use_filename = options['use-filename'] ? that.name : that.objectId;
	options.basedir = basedir;
	var deferred = Q.defer();
	
	reqHelper.getAsStream(that.url, options)
	.then(function(response) {
		if (response.statusCode >= 400) {
			deferred.reject(new Error('Request failed: '+ response.body.error.message));
		}
		
		deferred.resolve(true);
	}).done(function () {
		logHelper.consoleOutput('Download completed for ' + that.objectId);
	});	

	return deferred.promise;	
};

exports = module.exports = File;

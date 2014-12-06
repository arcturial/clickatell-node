/**
 * This class represents the Clickatell REST API. The methods all function
 * like a standard NodeJS API where the results are returned in two values "err" and "response":
 *
 * api.sendMessage(to, message, extra, function (err, response) {
 *
 * });
 *
 */

var transport   = require('./../transport');
var decoder     = require('./../decoder');
var merge       = require('merge');
var diagnostic  = require('./../diagnostic');

function Rest(token)
{
    var self = this;
    self.token = token;
}

Rest.prototype.sendMessage = function (to, message, extra, callback) {

}

Rest.prototype.getBalance = function (callback) {

}

Rest.prototype.stopMessage = function (apiMsgId, callback) {

}

Rest.prototype.queryMessage = function (apiMsgId, callback) {
    return self.getMessageCharge(apiMsgId, callback);
}

Rest.prototype.routeCoverage = function (msisdn, callback) {

}

Rest.prototype.getMessageCharge = function (apiMsgId, callback) {

}

module.exports = Rest;
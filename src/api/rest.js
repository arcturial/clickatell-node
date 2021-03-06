/**
 * This class represents the Clickatell REST API. The methods all function
 * like a standard NodeJS API where the results are returned in two values "err" and "response":
 *
 * api.sendMessage(to, message, extra, function (err, response) {
 *
 * });
 *
 */

var Transport   = require('./../transport');
var decoder     = require('./../decoder');
var merge       = require('merge');
var diagnostic  = require('./../diagnostic');
var transport   = new Transport;

function Rest(token)
{
    var self = this;
    self.token = token;
}

// For REST we need to encode the packets en decode the responses. We will
// be using JSON since it's just the easiest.
Rest.prototype._invoke = function (uri, args, method, callback) {
    var self = this;

    var options = {
        headers: {
            'Authorization': 'Bearer ' + self.token,
            'Content-Type': 'application/json',
            'X-Version': '1',
            'Accept': 'application/json'
        },
        method: method
    };

    args = JSON.stringify(args);

    transport.call(uri, args, options, function (content, err) {

        try {
            if (err) throw err;
            callback.apply(self, [decoder.decodeRest(content), null]);
        } catch (e) {
            callback.apply(self, [null, e]);
        }
    });
}

/**
 * http://www.clickatell.com/help/apidocs/#Message.htm#SendMessage
 */
Rest.prototype.sendMessage = function (to, message, extra, callback) {
    var self = this;

    // Merge parameter defaults together with the
    // requested parameters.
    var args = merge(
        {
            mo: 1,
            callback: 7,
            to: to,
            text: message
        },
        extra
    );

    self._invoke('/rest/message', args, 'POST', function (content, err) {

        if (err) content = { error: err.message, code: err.code };
        var messages = [];

        for (var key in content.message) {
            var message = content.message[key];

            // Build up a new message from the fields that we acquired from the API response.
            messages.push({
                id: message.apiMessageId !== '' ? message.apiMessageId : false,
                destination: typeof message.to !== 'undefined' ? message.to: false,
                error: typeof message.error !== 'undefined' && message.error ? message.error.description : false,
                code: typeof message.error !== 'undefined' && message.error ? message.error.code : false
            });
        }

        // Resolve the promised object.
        callback.apply(self, [null, messages]);
    });

    return self;
}

/**
 * http://www.clickatell.com/help/apidocs/#account-balance.htm%3FTocPath%3DClickatell%2520REST%2520API%2520Resources|_____3
 */
Rest.prototype.getBalance = function (callback) {
    var self = this;

    self._invoke('/rest/account/balance', {}, 'GET', function (content, err) {
        if (err) return callback.call(self, err);
        callback.apply(self, [null, { balance: content.balance }]);
    });
}

/**
 * http://www.clickatell.com/help/apidocs/#Message.htm#StopMessage
 */
Rest.prototype.stopMessage = function (apiMsgId, callback) {
    var self = this;

    self._invoke('/rest/message/' + apiMsgId, {}, 'DELETE', function (content, err) {
        if (err) return callback.call(self, err);

        var response = {
            id: content.apiMessageId,
            status: content.messageStatus,
            description: diagnostic[content.messageStatus],
        }

        callback.apply(self, [null, response]);
    });
}

/**
 * http://www.clickatell.com/help/apidocs/#Message.htm#QueryMsgStatus
 */
Rest.prototype.queryMessage = function (apiMsgId, callback) {
    var self = this;
    return self.getMessageCharge(apiMsgId, callback);
}

/**
 * http://www.clickatell.com/help/apidocs/#Coverage.htm%3FTocPath%3DClickatell%2520REST%2520API%2520Resources|_____1
 */
Rest.prototype.routeCoverage = function (msisdn, callback) {
    var self = this;

    self._invoke('/rest/coverage/' + msisdn, {}, 'GET', function (content, err) {
        if (err) return callback.call(self, err);

        var response = {
            routable: content.routable,
            destination: content.destination,
            charge: content.minimumCharge
        }

        callback.apply(self, [null, response]);
    });
}

/**
 * http://www.clickatell.com/help/apidocs/#Message.htm#QueryMsgStatus
 */
Rest.prototype.getMessageCharge = function (apiMsgId, callback) {
    var self = this;

    self._invoke('/rest/message/' + apiMsgId, {}, 'GET', function (content, err) {
        if (err) return callback.call(self, err);

        var response = {
            id: content.apiMessageId,
            status: content.messageStatus,
            description: diagnostic[content.messageStatus],
            charge: content.charge
        }

        callback.apply(self, [null, response]);
    });
}

module.exports = Rest;
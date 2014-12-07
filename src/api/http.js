/**
 * This class represents the Clickatell HTTP API. The methods all function
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

function Http(user, password, apiId)
{
    var self = this;
    self.user = user;
    self.password = password;
    self.apiId = apiId;
}

// Apply request and response filters to any transport invocation.
// This methods adds the HTTP methods and arguments used in the HTTP
// API. It also unwraps the content to parse those plain text responses.
Http.prototype._invoke = function (uri, args, callback, throwErr) {
    var self = this;
    args.user = self.user;
    args.password = self.password;
    args.api_id = self.apiId;

    var options = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
        },
        method: "GET"
    };

    transport.call(uri, args, options, function (content, err) {

        try {
            if (err) throw err;
            content = decoder.unwrapLegacy(content, throwErr);
            callback.apply(self, [content, null]);
        } catch (e) {
            callback.apply(self, [null, e]);
        }
    });
}

/**
 * https://www.clickatell.com/downloads/http/Clickatell_HTTP.pdf
 *
 * Section 3.3
 */
Http.prototype.sendMessage = function (to, message, extra, callback) {

    var self = this;

    // Merge parameter defaults together with the
    // requested parameters.
    var args = merge(
        {
            mo: 1,
            callback: 7,
            to: to.join(","),
            text: message
        },
        extra
    );

    self._invoke('/http/sendmsg', args, function (content, err) {

        // The sendmsg can't really fail. Since the call might succeed, but the message
        // might be in a "non-delivered" state. We will always return an array of messages and
        // the errors will be contained within the message data.
        if (err) content = { error: err.message, code: err.code };
        var messages = [];

        // Always return an array so we can make sure it's a consistent response format;
        content = (Object.keys(content))[0] === '0' ? content : [content];

        for (var key in content) {
            var message = content[key];

            // Build up a new message from the fields that we acquired from the API response.
            messages.push({
                id: typeof message.ID !== 'undefined' ? message.ID : false,
                destination: typeof message.To !== 'undefined' ? message.To: false,
                error: typeof message.error !== 'undefined' ? message.error: false,
                code: typeof message.code !== 'undefined' ? message.code : false
            });
        }

        // Resolve the promised object.
        callback.apply(self, [null, messages]);
    }, false);

    return self;
}

/**
 * https://www.clickatell.com/downloads/http/Clickatell_HTTP.pdf
 *
 * Section 5.2
 */
Http.prototype.getBalance = function (callback) {
    var self = this;

    self._invoke('/http/getbalance', {}, function (content, err) {

        if (err) return callback.call(self, err);

        callback.apply(self, [null, {
            balance: parseFloat(content.Credit)
        }]);
    });

    return self;
}

/**
 * https://www.clickatell.com/downloads/http/Clickatell_HTTP.pdf
 *
 * Section 5.1
 */
Http.prototype.stopMessage = function (apiMsgId, callback) {
    var self = this;

    self._invoke('/http/delmsg', { apimsgid: apiMsgId }, function (content, err) {
        if (err) return callback.call(self, err);

        callback.apply(self, [null, {
            id: content.ID,
            status: content.Status,
            description: diagnostic[content.Status]
        }]);
    });

    return self;
}

/**
 * https://www.clickatell.com/downloads/http/Clickatell_HTTP.pdf
 *
 * Section 3.4
 */
Http.prototype.queryMessage = function (apiMsgId, callback) {
    var self = this;
    return self.getMessageCharge(apiMsgId, callback);
}

/**
 * https://www.clickatell.com/downloads/http/Clickatell_HTTP.pdf
 *
 * Section 5.3
 */
Http.prototype.routeCoverage = function (msisdn, callback) {
    var self = this;

    self._invoke('/utils/routeCoverage', { msisdn: msisdn }, function (content, err) {

        content = {
            routable: err ? false : true,
            msisdn: msisdn,
            charge: err ? 0 : content.Charge
        }

        return callback.apply(self, [null, content])
    });

    return self;
}

/**
 * https://www.clickatell.com/downloads/http/Clickatell_HTTP.pdf
 *
 * Section 5.6
 */
Http.prototype.getMessageCharge = function (apiMsgId, callback) {
    var self = this;

    self._invoke('/http/getmsgcharge', { apimsgid: apiMsgId }, function (content, err) {
        if (err) return callback.call(self, err);

        callback.apply(self, [null, {
            id: apiMsgId,
            status: content.status,
            description: diagnostic[content.status],
            charge: parseFloat(content.charge)
        }]);
    });
}

module.exports = Http;
/**
 * This class represents the Clickatell HTTP API. The methods all function
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

function Http(user, password, apiId)
{
    var self = this;
    self.user = user;
    self.password = password;
    self.apiId = apiId;

    // Initialize a new transport protocol and register a callback
    // that will give us a chance to filter the arguments and headers
    // that are passed with the HTTP call.
    var protocol = transport.create(
        function (args, options) {
            args.user = user;
            args.password = password;
            args.api_id = apiId;
            options.method = 'GET';
            options.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8';
        },
        function (content) {
            return decoder.unwrapLegacy(content);
        }
    );

    /**
     * The "extra" parameter allows you to pass any field that clickatell supports
     * for this API call.
     *
     * @return self
     */
    self.sendMessage = function (to, message, extra, callback) {
        // Merge parameter defaults together with the
        // requested parameters.
        var args = merge(
            extra,
            {
                mo: 1,
                callback: 7,
                to: to.join(","),
                text: message
            }
        );

        protocol.call('/http/sendmsg', args, function (content, err) {

            // The sendmsg can't really fail. Since the call might succeed, but the message
            // might be in a "non-delivered" state. We will always return an array of messages and
            // the errors will be contained within the message data.
            if (err) content = { error: err.message, code: err.code };
            var messages = [];

            // Always return an array so we can make sure it's a consistent response format;
            content = (Object.keys(content))[0] === 0 ? content : [content];

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
        });

        return self;
    }

    /**
     * Retrieve the user balance.
     *
     * @return self
     */
    self.getBalance = function (callback) {

        protocol.call('/http/getbalance', {}, function (content, err) {
            if (err) return callback.call(self, err);

            callback.apply(self, [null, {
                balance: parseFloat(content.Credit)
            }]);
        });

        return self;
    }

    /**
     * Stop a specific message ID from being delivered. Only works if the message has
     * not been delivered yet off course.
     *
     *
     * @return self
     */
    self.stopMessage = function (apiMsgId, callback) {

        protocol.call('/http/delmsg', { apimsgid: apiMsgId }, function (content, err) {
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
     * Query the status of a specific message.
     *
     * Alias for getMessageCharge
     *
     * @return self
     */
    self.queryMessage = function (apiMsgId, callback) {
        return self.getMessageCharge(apiMsgId, callback);
    }

    /**
     * Check to see if a specific number is covered by the Clickatell
     * network.
     *
     * @return self
     */
    self.routeCoverage = function (msisdn, callback) {

        protocol.call('/utils/routeCoverage', { msisdn: msisdn }, function (content, err) {

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
     * Get the message charge and status.
     *
     * @return self
     */
    self.getMessageCharge = function (apiMsgId, callback) {

        protocol.call('/http/getmsgcharge', { apimsgid: apiMsgId }, function (content, err) {
            if (err) return callback.call(self, err);

            callback.apply(self, [null, {
                id: apiMsgId,
                status: content.status,
                description: diagnostic[content.status],
                charge: parseFloat(content.charge)
            }]);
        });
    }
}

module.exports = Http;
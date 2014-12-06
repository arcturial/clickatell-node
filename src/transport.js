/**
 * The transport class is a wrapper around NodeJS HTTP class.
 * It contains some custom functionalit like request and response filters
 * to make the wrapping and unwrapping of data easier.
 */

var merge       = require('merge');
var http        = require('http');
var querystring = require('querystring');

function Transport(filter, responseFilter)
{
    var self = this;

    filter = filter || null;
    responseFilter = responseFilter || null;

    // Define the default httpOptions to use
    // for our request to the Clickatell API.
    self.options = {
        hostname: 'api.clickatell.com',
        port: 80,
        method: 'GET',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
        }
    };

    self.call = function (uri, args, callback) {
        // Run the request filter. This allows us to set headers
        // or modify arguments before sending the request
        filter != null && filter.apply(this, [args, self.options]);

        var query = querystring.stringify(args);
        query = query ? "?" + query : "";

        var options = merge(self.options, { path: uri + query });

        // Run the HTTP request and register the callback listener.
        var req = http.request(options, function (res) {
            var data = [];

            res.on('data', function (chunk) {
                data.push(chunk);
            });

            res.on('end', function () {
                var content = Buffer.concat(data).toString('utf8');

                try {
                    responseFilter != null && (content = responseFilter.apply(self, [content]));
                } catch (e) {
                    callback.apply(self, [null, e]);
                    return false;
                }

                // If the response filter wasn't specified or did not fail...only
                // then can we be sure that our content is safe.
                callback.apply(self, [content, null]);
            });
        });

        // Listen for any potential errors so we can notify
        // the calling adapter.
        req.on('error', function (err) {
            callback.apply(self, [null, err]);
        });

        // Finalize the request
        req.end();
    }
}

module.exports = {
    create: function (filter, responseFilter) {
        return new Transport(filter, responseFilter);
    }
}
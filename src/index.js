/**
 * This class serves as the main script and also a sort of "factory" for all
 * the available transports.
 */

var Http = require("./api/http");
var Rest = require('./api/rest');

module.exports = {
    http: function (user, password, apiId) {
        return new Http(user, password, apiId);
    },
    rest: function (token) {
        return new Rest(token);
    }
}
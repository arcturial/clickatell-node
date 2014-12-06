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
var Http = require("./api/http");

module.exports = {
    http: function (user, password, apiId) {
        return new Http(user, password, apiId);
    },
    rest: function (token) {
        throw new Error('Not implemented currently.');
    }
}
var assert      = require("assert");
var Transport   = require("./../src/transport");
var nock        = require("nock");

describe("transport.js", function () {

    describe("call", function () {

        it("should turn arguments into a query string.", function (done) {

            nock('http://api.clickatell.com').get('/index?user=1234').reply(200, 'content');

            var transport = new Transport;
            transport.call('/index', { user: 1234 }, {}, function (content, err) {
                assert.equal('content', content);
                done();
            });
        });

        it("should handle HTTP errors on request.", function (done) {

            var transport = new Transport;

            transport.call('/', {}, { hostname: "www.notfound.error" }, function (content, err) {
                assert(content == null);
                assert(err instanceof Error);
                done();
            });
        });
    });
});
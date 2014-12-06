var assert      = require("assert");
var transport   = require("./../src/transport");
var nock        = require("nock");

describe("transport.js", function () {

    describe("call", function () {

        it("should turn arguments into a query string.", function (done) {

            nock('http://api.clickatell.com').get('/index?user=1234').reply(200, 'content');

            transport.create().call('/index', { user: 1234 }, function (content, err) {
                assert.equal('content', content);
                done();
            });
        });

        it("should change options based on filters.", function (done) {

            nock('http://api.clickatell.com').get('/index?user=1234&extra=1').reply(200, 'content');

            var test = transport.create(function (args) {
                args.extra = 1;
            });

            test.call('/index', { user: 1234 }, function (content, err) {
                assert.equal('content', content);
                done();
            });
        });

        it("should handle HTTP errors on request.", function (done) {

            var test = transport.create(function (args, options) {
                options.hostname = "www.notfound.error";
            });

            test.call('/', {}, function (content, err) {
                assert(content == null);
                assert(err instanceof Error);
                done();
            });
        });

        it("should be able to filter a response.", function (done) {

            nock('http://api.clickatell.com').get('/index?user=1234').reply(200, 'content');

            var test = transport.create(null, function (response) {
                return 'custom content';
            });

            test.call('/index', { user: 1234 }, function (content, err) {
                assert.equal('custom content', content);
                done();
            });
        })
    });
});
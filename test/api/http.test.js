var assert      = require("assert");
var Http        = require("./../../src/api/http");
var diagnostic  = require("./../../src/diagnostic");
var nock        = require("nock");


var user = "user";
var pass = "pass";
var apiId = 12345;

describe("http.js", function () {

    describe("sendMessage", function () {

        it("should ensure that default parameters are added to requests", function (done) {

            var to = "00000000000";
            var message = 'message';

            nock('http://api.clickatell.com')
                .get('/http/sendmsg?mo=1&callback=7&to=' + to + '&text=' + message + '&user=' + user + '&password=' + pass + '&api_id=' + apiId)
                .reply(200, 'ID: 12345 To: 123');

            var api = new Http(user, pass, apiId);
            api.sendMessage([to], message, {}, function (err, content) {
                assert(err == null);
                assert.equal(content[0].destination, 123);
                assert.equal(content[0].id, 12345);
                done();
            });
        });

        it("should handle error messages properly", function (done) {

            var to = "00000000000";
            var message = 'message';

            nock('http://api.clickatell.com')
                .get('/http/sendmsg?mo=1&callback=7&to=' + to + '&text=' + message + '&user=' + user + '&password=' + pass + '&api_id=' + apiId)
                .reply(200, 'ERR: 301, Some error');

            var api = new Http(user, pass, apiId);
            api.sendMessage([to], message, {}, function (err, content) {
                assert(err == null);
                assert.equal(content[0].error, 'Some error');
                assert.equal(content[0].code, 301);
                done();
            });
        });

        it("should handle mixed success/error messages properly", function (done) {

            var to = ["00000000000", "00000000001"];
            var message = 'message';

            nock('http://api.clickatell.com')
                .get('/http/sendmsg?mo=1&callback=7&to=00000000000%2C00000000001&text=' + message + '&user=' + user + '&password=' + pass + '&api_id=' + apiId)
                .reply(200, 'ERR: 301, Some error\nID: 12345 To: 00000000001');

            var api = new Http(user, pass, apiId);
            api.sendMessage(to, message, {}, function (err, content) {
                assert(err == null);
                assert.equal(content[0].error, 'Some error');
                assert.equal(content[0].code, 301);
                assert.equal(content[1].destination, '00000000001');
                assert.equal(content[1].id, 12345);
                done();
            });
        });
    });


    describe("getBalance", function () {


        it("should return an error if the call was incorrectly formatted", function (done) {

            nock('http://api.clickatell.com')
                .get('/http/getbalance?user=' + user + '&password=' + pass + '&api_id=' + apiId)
                .reply(200, 'ERR: 301, Some error');

            var api = new Http(user, pass, apiId);

            api.getBalance(function (err, content) {

                assert(err instanceof Error);
                assert.equal(301, err.code);
                assert.equal('Some error', err.message);
                done();
            });
        });

        it("should return the balance from the 'Credit' field", function (done) {

            nock('http://api.clickatell.com')
                .get('/http/getbalance?user=' + user + '&password=' + pass + '&api_id=' + apiId)
                .reply(200, 'Credit: 101');

            var api = new Http(user, pass, apiId);

            api.getBalance(function (err, content) {

                assert.equal(101, content.balance);
                done();
            });
        });

    });

    describe("stopMessage", function () {

        it("should return an error if the call failed", function (done) {

            nock('http://api.clickatell.com')
                .get('/http/delmsg?apimsgid=123456&user=' + user + '&password=' + pass + '&api_id=' + apiId)
                .reply(200, 'ERR: 301, Some error');

            var api = new Http(user, pass, apiId);

            api.stopMessage("123456", function (err, content) {
                assert(err instanceof Error);
                assert.equal(301, err.code);
                assert.equal('Some error', err.message);
                done();
            });

        });

        it("should return the message details if call was succesful", function (done) {

            nock('http://api.clickatell.com')
                .get('/http/delmsg?apimsgid=123456&user=' + user + '&password=' + pass + '&api_id=' + apiId)
                .reply(200, 'ID: 123456 Status: 004');

            var api = new Http(user, pass, apiId);

            api.stopMessage("123456", function (err, content) {
                assert.equal("123456", content.id);
                assert.equal("004", content.status);
                assert.equal(diagnostic["004"], content.description);
                done();
            });

        });

    });

    describe("queryMessage", function () {

        it("should forward the call to getMessageCharge", function (done) {

            var api = new Http(user, pass, apiId);

            api.getMessageCharge = function (apiMsgId, callback) {
                callback.apply(this, [null, true]);
            };

            api.queryMessage("123456", function (err, content) {
                assert(content);
                done();
            });
        });

    });

    describe("routeCoverage", function () {

        it("should return a non routable response incase of error", function (done) {

            nock('http://api.clickatell.com')
                .get('/utils/routeCoverage?msisdn=123456&user=' + user + '&password=' + pass + '&api_id=' + apiId)
                .reply(200, 'ERR: 301, Some error');

            var api = new Http(user, pass, apiId);
            api.routeCoverage("123456", function (err, content) {
                assert(err == null);
                assert.equal(false, content.routable);
                done();
            });
        });

        it("should return a routable status if successful", function (done) {

            nock('http://api.clickatell.com')
                .get('/utils/routeCoverage?msisdn=123456&user=' + user + '&password=' + pass + '&api_id=' + apiId)
                .reply(200, 'Charge: 100');

            var api = new Http(user, pass, apiId);
            api.routeCoverage("123456", function (err, content) {
                assert(err == null);
                assert.equal(true, content.routable);
                assert.equal(100, content.charge);
                assert.equal("123456", content.msisdn);
                done();
            });

        });
    });

    describe("getMessageCharge", function () {


        it("should return an error if the request fails", function (done) {

            nock('http://api.clickatell.com')
                .get('/http/getmsgcharge?apimsgid=123456&user=' + user + '&password=' + pass + '&api_id=' + apiId)
                .reply(200, 'ERR: 301, Some error');

            var api = new Http(user, pass, apiId);
            api.getMessageCharge("123456", function (err, content) {
                assert(err instanceof Error);
                assert.equal(301, err.code);
                assert.equal('Some error', err.message);
                done();
            });

        });

        it("should return the correct fields upon success", function (done) {

            nock('http://api.clickatell.com')
                .get('/http/getmsgcharge?apimsgid=123456&user=' + user + '&password=' + pass + '&api_id=' + apiId)
                .reply(200, 'status: 004 charge: 101');

            var api = new Http(user, pass, apiId);
            api.getMessageCharge("123456", function (err, content) {

                assert.equal(101, content.charge);
                assert.equal("004", content.status);
                assert.equal(diagnostic[content.status], content.description);
                done();
            });

        });

    });

});
var assert      = require("assert");
var Rest        = require("./../../src/api/rest");
var diagnostic  = require("./../../src/diagnostic");
var nock        = require("nock");


var token = "token";

describe("rest.js", function () {

    describe("_invoke", function () {

        it("should append the appropriate RESTful headers", function (done) {

            nock(
                'http://api.clickatell.com',
                {
                    reqheaders: {
                        'Authorization': 'Bearer ' + token,
                        'X-Version': '1',
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                })
                .post('/rest/message', { arg: true })
                .reply(200, { data: true });

            var api = new Rest(token);
            api._invoke('/rest/message', { arg: true }, 'POST', function (content, err) {
                assert(err == null);
                assert(content);
                done();
            });
        });

    });

    describe("sendMessage", function () {

        it("should handle mixed responses correctly", function (done) {

            nock('http://api.clickatell.com')
                .post('/rest/message', { mo: 1, callback: 7, to: ["0000", "0001"], text: "message" })
                .reply(
                    200,
                    {
                        data:
                        {
                            message: [
                                {
                                    apiMessageId: false,
                                    to: "0000",
                                    error: {
                                        description: "Some error",
                                        code: 301
                                    }
                                },
                                {
                                    apiMessageId: 12345,
                                    to: "0001",
                                    error: false
                                }
                            ]
                        }
                    }
                );

            var api = new Rest(token);
            api.sendMessage(["0000", "0001"], "message", {}, function (err, content) {
                assert(err == null);
                assert(!content[0].id);
                assert.equal("Some error", content[0].error);
                assert.equal(301, content[0].code);
                assert.equal(12345, content[1].id);
                assert.equal("0001", content[1].destination);
                done();
            });
        });
    });


    describe("getBalance", function () {

        it("should return an error if the call was incorrectly formatted", function (done) {

            nock('http://api.clickatell.com')
                .get('/rest/account/balance')
                .reply(
                    400,
                    {
                        error:
                        {
                            description: "Some error",
                            code: 301
                        }
                    }
                );

            var api = new Rest(token);
            api.getBalance(function (err, content) {
                assert(err instanceof Error);
                assert.equal(301, err.code);
                assert.equal("Some error", err.message);
                done();
            });
        });

        it("should return the balance from the 'balance' field", function (done) {

            nock('http://api.clickatell.com')
                .get('/rest/account/balance')
                .reply(
                    200,
                    {
                        data:
                        {
                            balance: 500
                        }
                    }
                );

            var api = new Rest(token);
            api.getBalance(function (err, content) {
                assert(err == null);
                assert.equal(500, content.balance);
                done();
            });
        });

    });

    describe("stopMessage", function () {

        it("should return an error if the call failed", function (done) {
            nock('http://api.clickatell.com')
                .delete('/rest/message/12345')
                .reply(
                    400,
                    {
                        error:
                        {
                            description: "Some error",
                            code: 301
                        }
                    }
                );

            var api = new Rest(token);
            api.stopMessage("12345", function (err, content) {
                assert(err instanceof Error);
                assert.equal(301, err.code);
                assert.equal("Some error", err.message);
                done();
            });
        });

        it("should return the message details if call was succesful", function (done) {

            nock('http://api.clickatell.com')
                .delete('/rest/message/12345')
                .reply(
                    200,
                    {
                        data:
                        {
                            apiMessageId: "12345",
                            messageStatus: "004"
                        }
                    }
                );

            var api = new Rest(token);
            api.stopMessage("12345", function (err, content) {
                assert(err == null);
                assert.equal("12345", content.id);
                assert.equal("004", content.status);
                assert.equal(diagnostic["004"], content.description);
                done();
            });
        });

    });

    describe("queryMessage", function () {

        it("should forward the call to getMessageCharge", function (done) {
            var api = new Rest(token);

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

        it("should return an error incase of a failed request", function (done) {

            nock('http://api.clickatell.com')
                .get('/rest/coverage/12345')
                .reply(
                    400,
                    {
                        error:
                        {
                            description: "Some error",
                            code: 301
                        }
                    }
                );

            var api = new Rest(token);
            api.routeCoverage("12345", function (err, content) {
                assert(err instanceof Error);
                assert.equal(301, err.code);
                assert.equal("Some error", err.message);
                done();
            });

        });

        it("should return a routable status if successful", function (done) {

            nock('http://api.clickatell.com')
                .get('/rest/coverage/12345')
                .reply(
                    200,
                    {
                        data:
                        {
                            routable: true,
                            destination: "12345",
                            minimumCharge: 1
                        }
                    }
                );

            var api = new Rest(token);
            api.routeCoverage("12345", function (err, content) {
                assert.equal(true, content.routable);
                assert.equal(1, content.charge);
                done();
            });
        });
    });

    describe("getMessageCharge", function () {

        it("should return an error if the request fails", function (done) {

            nock('http://api.clickatell.com')
                .get('/rest/message/12345')
                .reply(
                    400,
                    {
                        error:
                        {
                            description: "Some error",
                            code: 301
                        }
                    }
                );

            var api = new Rest(token);
            api.getMessageCharge("12345", function (err, content) {
                assert(err instanceof Error);
                assert.equal(301, err.code);
                assert.equal("Some error", err.message);
                done();
            });
        });

        it("should return the correct fields upon success", function (done) {

            nock('http://api.clickatell.com')
                .get('/rest/message/12345')
                .reply(
                    200,
                    {
                        data:
                        {
                            apiMessageId: "12345",
                            messageStatus: "004",
                            charge: 1
                        }
                    }
                );

            var api = new Rest(token);
            api.getMessageCharge("12345", function (err, content) {
                assert.equal("12345", content.id);
                assert.equal("004", content.status);
                assert.equal(diagnostic["004"], content.description);
                assert.equal(1, content.charge);
                done();
            });
        });

    });

});
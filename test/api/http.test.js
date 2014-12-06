var assert  = require("assert");
var Http    = require("./../../src/api/http");
var nock    = require("nock");


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

});
var assert  = require("assert");
var index   = require("./../src/index");
var Http    = require('./../src/api/http');
var Rest    = require('./../src/api/rest');

describe("index.js", function () {

    describe("http", function () {

        it("should return an instance of an HTTP API connection.", function () {
            var http = index.http('user', 'pass', 123456);
            assert(http instanceof Http, 'Object not of type Http');
        });
    });

    describe("rest", function () {

        it("should return an instance of an REST API connection.", function () {
            var rest = index.rest(123456);
            assert(rest instanceof Rest, 'Object not of type Rest');
        });
    });
});
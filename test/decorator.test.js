var assert = require("assert");
var decoder = require("./../src/decoder");

describe("decoder.js", function () {
    describe("unwrapLegacy", function () {

        it("should throw an error if a single response fails.", function () {
            var data = "ERR: 301, Some random error.";
            assert.throws(function () { decoder.unwrapLegacy(data); }, Error);
        });

        it("should return an array even if it contains an error.", function () {
            var data = "ERR: 301, Some random error.\nID: 123456 To: 0000000000";
            var result = decoder.unwrapLegacy(data);

            assert.equal(result[0]['code'], 301);
            assert.equal(result[0]['error'], "Some random error.");
        });

        it("should unwrap multiple values.", function () {
            var data = "ID: 123456 To: 123\nID:123 To:456";
            var result = decoder.unwrapLegacy(data);

            assert.equal(result[0]['ID'], 123456);
            assert.equal(result[0]['To'], 123);
            assert.equal(result[1]['ID'], 123);
            assert.equal(result[1]['To'], 456);
        });

        it("should return a single value not as an array.", function () {
            var data = "ID: 123456 To:123";
            var result = decoder.unwrapLegacy(data);

            assert.equal(result['ID'], 123456);
            assert.equal(result['To'], 123);
        });
    });
});
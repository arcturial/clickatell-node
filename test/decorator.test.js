var assert = require("assert");
var decoder = require("./../src/decoder");

describe("decoder.js", function () {
    describe("unwrapLegacy", function () {

        it("should throw an error if a single response fails.", function () {
            var data = "ERR: 301, Some random error.";
            assert.throws(function () { decoder.unwrapLegacy(data); }, Error);
        });
    });
});
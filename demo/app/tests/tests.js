var Transcoder = require("nativescript-transcoder").Transcoder;
var transcoder = new Transcoder();

describe("greet function", function() {
    it("exists", function() {
        expect(transcoder.greet).toBeDefined();
    });

    it("returns a string", function() {
        expect(transcoder.greet()).toEqual("Hello, NS");
    });
});
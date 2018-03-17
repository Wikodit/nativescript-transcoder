var Transcoder = require("nativescript-transcoder").Transcoder;
var transcoder = new Transcoder('none', {});

describe("transcode function", function() {
  it("exists", function() {
    expect(transcoder.transcode).toBeDefined();
  });
});
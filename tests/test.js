var chai = require("chai");
var expect = chai.expect;

var JitterBuffer = require("../");

const defaultSpan = 10;

describe("JitterBuffer", () => {
  it("should at least work somehow", () => {
    var jb = new JitterBuffer(10);
    jb.put({data: new Buffer([1,2,3]), ts: 0, span: defaultSpan});
    jb.put({data: new Buffer([4,5,6]), ts: 10, span: defaultSpan});
    jb.put({data: new Buffer([7,8,9]), ts: 20, span: defaultSpan});
    packet = jb.get(10);
    expect(packet).to.exist;
    expect(packet.data).to.deep.equal(new Buffer([1,2,3]));
    expect(packet.timestamp).to.equal(0);
    expect(packet.span).to.equal(defaultSpan);
    packet = jb.get(10);
    expect(packet).to.exist;
    expect(packet.data).to.deep.equal(new Buffer([4,5,6]));
    expect(packet.timestamp).to.equal(10);
    expect(packet.span).to.equal(defaultSpan);
    packet = jb.get(10);
    expect(packet).to.exist;
    expect(packet.data).to.deep.equal(new Buffer([7,8,9]));
    expect(packet.timestamp).to.equal(20);
    expect(packet.span).to.equal(defaultSpan);
    packet = jb.get(10);
    expect(packet).equal(JitterBuffer.MISSING);
  });

  it("should get and set margin", () => {
    var jb = new JitterBuffer(10);
    expect(jb.getMargin()).to.equal(0);
    jb.setMargin(100);
    expect(jb.getMargin()).to.equal(100);
  });
  it("should get and set delay step", () => {
    var jb = new JitterBuffer(10);
    expect(jb.getDelayStep()).to.equal(10);
    jb.setDelayStep(1337);
    expect(jb.getDelayStep()).to.equal(1337);
  });
  it("should get and set concealment size", () => {
    var jb = new JitterBuffer(1337);
    expect(jb.getConcealmentSize()).to.equal(1337);
    jb.setConcealmentSize(9001);
    expect(jb.getConcealmentSize()).to.equal(9001);
  });
  it("should get and set max late rate", () => {
    var jb = new JitterBuffer(1337);
    expect(jb.getMaxLateRate()).to.equal(4); // default
    jb.setMaxLateRate(9001 + 1337);
    expect(jb.getMaxLateRate()).to.equal(9001 + 1337);
  });
  it("should get and set late cost", () => {
    var jb = new JitterBuffer(1337);
    expect(jb.getLateCost()).to.equal(0);
    jb.setLateCost(42);
    expect(jb.getLateCost()).to.equal(42);
  });

  it("should interpolate", () => {
    var packet = null;
    var jb = new JitterBuffer(10);
    jb.setMargin(30);

    jb.put({data: new Buffer([1,2,3]), ts: 0, span: defaultSpan});
    packet = jb.get(10); jb.tick();
    expect(packet).to.exist;

    jb.put({data: new Buffer([4,5,6]), ts: 10, span: defaultSpan});
    packet = jb.get(10); jb.tick();
    expect(packet).to.exist;

    jb.put({data: new Buffer([7,8,9]), ts: 20, span: defaultSpan});
    var interp = jb.get(10); jb.tick();
    expect(interp).equal(JitterBuffer.INSERTION);

    packet = jb.get(10); jb.tick();
    expect(packet).to.exist;

    var miss = jb.get(10); jb.tick();
    expect(miss).equal(JitterBuffer.MISSING);
  });

  it("should reset", () => {
    var jb = new JitterBuffer(10);
    jb.put({data: new Buffer([1,2,3]), ts: 0, span: defaultSpan});
    jb.put({data: new Buffer([4,5,6]), ts: 10, span: defaultSpan});
    jb.put({data: new Buffer([7,8,9]), ts: 20, span: defaultSpan});

    packet = jb.get(10);
    expect(packet).to.exist;

    jb.reset();

    var miss = jb.get(10);
    expect(miss).equal(JitterBuffer.MISSING);
  });

  it("should return correct available count", () => {
    var jb = new JitterBuffer(10);
    jb.put({data: new Buffer([1,2,3]), ts: 0, span: defaultSpan});
    jb.put({data: new Buffer([4,5,6]), ts: 10, span: defaultSpan});
    jb.put({data: new Buffer([7,8,9]), ts: 20, span: defaultSpan});

    expect(jb.getAvailable()).to.be.equal(3);
  });

  it("getAnother() should work", () => {
    var packet = null;
    var jb = new JitterBuffer(10);
    jb.put({data: new Buffer([1,2,3]), ts: 0, span: defaultSpan});
    jb.put({data: new Buffer([4,5,6]), ts: 0, span: defaultSpan});
    jb.put({data: new Buffer([7,8,9]), ts: 10, span: defaultSpan});

    packet = jb.get(10);
    expect(packet).to.exist;
    expect(packet.data).to.deep.equal(new Buffer([1,2,3]));
    expect(packet.timestamp).to.equal(0);
    expect(packet.span).to.equal(defaultSpan);

    packet = jb.getAnother();
    expect(packet).to.exist;
    expect(packet.data).to.deep.equal(new Buffer([4,5,6]));
    expect(packet.timestamp).to.equal(0);
    expect(packet.span).to.equal(defaultSpan);

    var miss = jb.getAnother();
    expect(miss).equal(JitterBuffer.MISSING);

    packet = jb.get(10);
    expect(packet).to.exist;
    expect(packet.data).to.deep.equal(new Buffer([7,8,9]));
    expect(packet.timestamp).to.equal(10);
    expect(packet.span).to.equal(defaultSpan);
  });

  it("getPointerTimestamp() should work", () => {
    var jb = new JitterBuffer(10);
    jb.put({data: new Buffer([1,2,3]), ts: 0, span: defaultSpan});
    jb.put({data: new Buffer([4,5,6]), ts: 10, span: defaultSpan});
    jb.put({data: new Buffer([7,8,9]), ts: 20, span: defaultSpan});
    expect(jb.getPointerTimestamp()).to.equal(0);
    packet = jb.get(10);
    expect(jb.getPointerTimestamp()).to.equal(10);
    packet = jb.get(10);
    expect(jb.getPointerTimestamp()).to.equal(20);
    packet = jb.get(10);
    expect(jb.getPointerTimestamp()).to.equal(30);
    var miss = jb.get(10);
    expect(jb.getPointerTimestamp()).to.equal(40);
  });

  it("should free everything on destroy()", () => {
    var jb = new JitterBuffer(10);
    expect(jb._handle).to.exist;
    expect(jb._vi32).to.exist;
    jb.destroy();
    expect(jb._handle).to.not.exist;
    expect(jb._vi32).to.not.exist;
  });
});
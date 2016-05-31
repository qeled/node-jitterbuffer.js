"use strict";

var event = "uncaughtException";
var list = process.listeners(event);

var native = require("./libspeexdsp_jitter.js");

process.removeAllListeners(event);
for (var i = 0; i < list.length; i++) process.on(event, pl[i]);

const NULL = 0;
const Constants = {
  OK: 0,
  MISSING: 1,
  INSERTION: 2,
  INTERNAL_ERROR: -1,
  BAD_ARGUMENT: -2
};

const CTL = {
  SET_MARGIN: 0,
  GET_MARGIN: 1,
  GET_AVAILABLE_COUNT: 3,
  SET_DESTROY_CALLBACK: 4,
  GET_DESTROY_CALLBACK: 5,
  SET_DELAY_STEP: 6,
  GET_DELAY_STEP: 7,
  SET_CONCEALMENT_SIZE: 8,
  GET_CONCEALMENT_SIZE: 9,
  SET_MAX_LATE_RATE: 10,
  GET_MAX_LATE_RATE: 11,
  SET_LATE_COST: 12,
  GET_LATE_COST: 13
};

// set packet data `destroy` handler as emscripten `free` function;
// disables unnecessary buffer copying inside libspeexdsp
// > must be compiled with option `RESERVED_FUNCTION_POINTERS=1`
const freePtr = native.Runtime.addFunction(native._free);

const _PacketSize =
//struct JitterBufferPacket {
4 + //   char        *data;
4 + //   spx_uint32_t len;
4 + //   spx_uint32_t timestamp;
4 + //   spx_uint32_t span;
2 + //   spx_uint16_t sequence;
4;  //   spx_uint32_t user_data;
//};

function readPtr(address, length) {
  var data = native.HEAPU8.subarray(address, address + length);
  return new Buffer(data);
}
function copyToHeap(data) {
  var ptr = native._malloc(data.length);
  native.HEAPU8.set(data, ptr);
  return ptr;
}

function encodePacket(data, timestamp, span, seq, userData) {
  var struct = new Buffer(_PacketSize);
  struct.fill(0);
  struct.writeUInt32LE(copyToHeap(data), 0);
  struct.writeUInt32LE(data.length,      4);
  struct.writeUInt32LE(timestamp,        8);
  struct.writeUInt32LE(span,             12);
  struct.writeUInt16LE(seq || 0,         16);
  struct.writeUInt32LE(userData || 0,    18);
  return copyToHeap(struct);
}

function decodePacket(struct) {
  var dataPtr = struct.readUInt32LE(0);
  var len = struct.readUInt32LE(4);
  return {
    data: readPtr(dataPtr, len),
    timestamp: struct.readUInt32LE(8),
    span: struct.readUInt32LE(12),
    seq: struct.readUInt16LE(16),
    userData: struct.readUInt32LE(18)
  };
}

class JitterBuffer {
  constructor(stepSize) {
    this._handle = native._jitter_buffer_init(stepSize);
    this._packet = native._malloc(_PacketSize);
    this._vi32 = native._malloc(4);

    native._jitter_buffer_ctl(
      this._handle,
      CTL.SET_DESTROY_CALLBACK, freePtr
    );
  }
  _ctlGet(ctl) {
    native._jitter_buffer_ctl(this._handle, ctl, this._vi32);
    return native.getValue(this._vi32, "i32");
  }
  _ctlSet(ctl, value) {
    native.setValue(this._vi32, value, "i32");
    native._jitter_buffer_ctl(this._handle, ctl, this._vi32);
  }

  // methods

  put(p) {
    if (!p) throw new TypeError("Param must be an object");
    var packet = encodePacket(
      p.data, p.ts || p.timestamp, p.span, p.seq, p.userData
    );
    native._jitter_buffer_put(this._handle, packet);
  }
  get(desiredSpan) {
    var ret = native._jitter_buffer_get(
      this._handle, this._packet,
      desiredSpan || 0, NULL
    );
    if (ret > 0) return ret;
    if (ret < 0) throw new Error("jitter_buffer_get returned " + ret);
    return decodePacket(readPtr(this._packet, _PacketSize));
  }
  tick() {
    native._jitter_buffer_tick(this._handle);
  }
  reset() {
    native._jitter_buffer_reset(this._handle);
  }

  getAnother() {
    var ret = native._jitter_buffer_get_another(this._handle, this._packet);
    if (ret > 0) return ret;
    if (ret < 0) throw new Error("_jitter_buffer_get_another returned " + ret);
    return decodePacket(readPtr(this._packet, _PacketSize));
  }

  getPointerTimestamp() {
    return native._jitter_buffer_get_pointer_timestamp(this._handle);
  }

  updateRemainingSpan(rem) {
    native._jitter_buffer_remaining_span(this._handle, rem);
  }

  updateDelay() {
    return native._jitter_buffer_update_delay(this._handle, NULL, NULL);
  }

  // ctl

  getAvailable() {
    return this._ctlGet(CTL.GET_AVAILABLE_COUNT);
  }

  getMargin() {
    return this._ctlGet(CTL.GET_MARGIN);
  }
  setMargin(value) {
    this._ctlSet(CTL.SET_MARGIN, value);
  }

  getDelayStep() {
    return this._ctlGet(CTL.GET_DELAY_STEP);
  }
  setDelayStep(value) {
    this._ctlSet(CTL.SET_DELAY_STEP, value);
  }

  getConcealmentSize() {
    return this._ctlGet(CTL.GET_CONCEALMENT_SIZE);
  }
  setConcealmentSize(value) {
    this._ctlSet(CTL.SET_CONCEALMENT_SIZE, value);
  }

  getMaxLateRate() {
    return this._ctlGet(CTL.GET_MAX_LATE_RATE);
  }
  setMaxLateRate(value) {
    this._ctlSet(CTL.SET_MAX_LATE_RATE, value);
  }

  getLateCost() {
    return this._ctlGet(CTL.GET_LATE_COST);
  }
  setLateCost(value) {
    this._ctlSet(CTL.SET_LATE_COST, value);
  }

  destroy() {
    if (!this._handle) return;
    native._jitter_buffer_destroy(this._handle);
    native._free(this._vi32);
    this._handle = null;
    this._vi32 = null;
  }
}

Object.assign(JitterBuffer, Constants);
Object.assign(JitterBuffer.prototype, Constants);
module.exports = JitterBuffer;
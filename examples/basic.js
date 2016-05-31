var JitterBuffer = require("../");

function getOne() {
  var packet = jb.get(10);
  if (packet.data) console.log(packet.timestamp + ":", packet.data);
  else console.log("Error", packet);
  jb.tick();
}

var jb = new JitterBuffer();
jb.put({data: new Buffer("111"), ts: 10, span: 10});
jb.put({data: new Buffer("222"), ts: 20, span: 10});
jb.put({data: new Buffer("444"), ts: 40, span: 10});
getOne();
getOne();
getOne();
getOne();
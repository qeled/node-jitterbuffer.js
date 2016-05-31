var JitterBuffer = require("../");

var jb = new JitterBuffer();
jb.setMargin(50);

function getOne() {
  var packet = jb.get(10);
  if (packet.data) console.log(packet.timestamp + ":", packet.data);
  else console.log("Error", packet);
  jb.tick();
}

jb.put({data: new Buffer("111"), ts: 10, span: 10});
getOne();
jb.put({data: new Buffer("222"), ts: 20, span: 10});
getOne();
jb.put({data: new Buffer("333"), ts: 30, span: 10});
getOne();
jb.put({data: new Buffer("444"), ts: 40, span: 10});
getOne();
jb.put({data: new Buffer("555"), ts: 50, span: 10});
getOne();
jb.put({data: new Buffer("666"), ts: 60, span: 10});
getOne();
jb.put({data: new Buffer("777"), ts: 70, span: 10});
getOne();
jb.put({data: new Buffer("888"), ts: 80, span: 10});
getOne();
jb.put({data: new Buffer("999"), ts: 90, span: 10});
getOne();
getOne();
getOne();
getOne();
getOne();
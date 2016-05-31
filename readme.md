# node-jitterbuffer.js

Jitter buffer from libspeexdsp with wrappers, compiled using emscripten.

```js
var jb = new JitterBuffer();
jb.put({data: new Buffer("111"), ts: 10, span: 10});
jb.put({data: new Buffer("222"), ts: 20, span: 10});
jb.put({data: new Buffer("444"), ts: 40, span: 10});
jb.get(10); // 10: 111
jb.get(10); // 20: 222
jb.get(10); // Error 1: missing
jb.get(10); // 40: 444
```
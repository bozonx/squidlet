var uart1 = Serial1;
var uart2 = Serial3;

console.log('-----start');


//var cmd="";
//uart1.setup(9600); // baud

uart2.setup(9600); // baud

//uart1.on('data', function (data) {
//  console.log('uart1', data);
//print("<Serial4> "+data)
//});

setInterval(() => {
  uart2.print('dddata');
}, 1000);


//////////////////// esp32

var uart1 = Serial3;

console.log('-----start');

uart1.setup(9600); // baud

uart1.on('data', function (data) {
  console.log('uart1', data);
});



//////////// eso8266
var uart1 = Serial2;

console.log('-----start');

uart1.setup(9600); // baud

setInterval(() => {
  uart1.println('dd1');
  console.log('--printed');
}, 2000);

save();


////////////////////////////



//////////// eso8266
var uart1 = Serial2;

console.log('-----start');

uart1.setup(9600); // baud

uart1.on('data', function (data) {
  console.log('uart1', data);
});


//////////////////// esp32


var uart1 = Serial3;

console.log('-----start');

uart1.setup(9600); // baud

setInterval(() => {
  uart1.println('d1\r');
  console.log('--printed');
}, 3000);

save();



//////////////////////////////////////////////////
//////////////////// esp32 both

var uart1 = Serial1;
var uart2 = Serial2;

console.log('-----start');

uart1.setup(9600, { tx: 1, rx: 3 }); // baud
uart2.setup(9600, { tx: 17, rx: 16 }); // baud

setInterval(() => {
  uart1.println('d1');
  console.log('--printed1');
}, 3000);

uart2.on('data', function (data) {
  console.log('uart1', data);
});



////////////////

var pin = 23;
pinMode(pin, 'output');

var value = true;

setInterval(() => {
  digitalWrite(pin, value);
  value = !value;
}, 500);


///////////////////

var pin = 23;
pinMode(pin, 'input');

setWatch(pin, (state) => {
  print(state);
});



////////////////////

var uart1 = Serial1;
var uart2 = Serial2;
var ledPin = 13;

var ledValue = true;

pinMode(ledPin, 'output');

console.log('-----start');

uart1.setup(115200, { tx: 1, rx: 3 }); // baud
uart2.setup(115200, { tx: 17, rx: 16 }); // baud

setInterval(() => {
  uart1.println('d1222222222');
  //print('--printed1');
}, 2000);

uart2.on('data', function (data) {
  print('received', data);
  digitalWrite(ledPin, ledValue);
  ledValue = !ledValue;
});



/////////////// es[32

var uart1 = Serial3;

console.log('-----start');

uart1.setup(115200); // baud

setInterval(() => {
  uart1.println('d111');
  //console.log('--printed');
}, 2000);

save();



/////// 8266

var ledPin = 4;
var ledValue = true;
pinMode(ledPin, 'output');


var uart1 = Serial1;

console.log('-----start');

uart1.setup(115200); // baud


uart1.on('data', function (data) {
  //console.log('received', data);
  digitalWrite(ledPin, ledValue);
  ledValue = !ledValue;
});

uart1.println('wwwww');


LoopbackA.setConsole();


//save();

/////////// !!!!!!!!!! works from 8266 to 32
/////////////// 8366

var ledPin = 4;
var ledValue = true;
pinMode(ledPin, 'output');

var uart1 = Serial1;

console.log('-----start');

uart1.setup(115200); // baud

setInterval(() => {
  uart1.println('22222');
  //console.log('--printed');
  digitalWrite(ledPin, ledValue);
  ledValue = !ledValue;
}, 2000);

//LoopbackA.setConsole();

save();


//////////// esp32

var uart1 = Serial3;

console.log('-----start');

uart1.setup(115200); // baud

uart1.on('data', function (data) {
  console.log('received-----', data);
});



//////////// from 32 to 8266
////////// 32
var ledPin = 13;
var ledValue = true;
pinMode(ledPin, 'output');

var uart1 = Serial3;

console.log('-----start');

uart1.setup(115200); // baud

setInterval(() => {
  uart1.println('3333');
  //console.log('--printed');
  digitalWrite(ledPin, ledValue);
  ledValue = !ledValue;
}, 2000);

///////////// 8266

var uart1 = Serial1;

console.log('-----start');

uart1.setup(115200); // baud

uart1.on('data', function (data) {
  console.log('received-----', data);
});

LoopbackA.setConsole();

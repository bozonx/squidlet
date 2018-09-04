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

uart1.setup(9600, { tx:B1, rx:B3 }); // baud
uart2.setup(9600, { tx:B17, rx:B16 }); // baud

setInterval(() => {
  uart1.println('d1');
  console.log('--printed1');
}, 3000);

uart2.on('data', function (data) {
  console.log('uart1', data);
});


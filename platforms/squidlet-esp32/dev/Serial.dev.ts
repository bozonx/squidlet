import Serial, {BaudRate, Options, EventName} from '../../../host/src/app/interfaces/dev/Serial';


type Uart = 'Bluetooth'
  | 'LoopbackA'
  | 'LoopbackB'
  | 'Serial1'
  | 'Serial2'
  | 'Serial3'
  | 'Serial4'
  | 'Serial5'
  | 'Serial6'
  | 'Telnet'
  | 'Terminal';

interface EspOptions extends Options {
  rx?: number;                           // Receive pin (data in to Espruino)
  tx?: number;                           // Transmit pin (data out of Espruino)
  ck?: number;                           // (default none) Clock Pin
  cts?: number;                          // (default none) Clear to Send Pin

  // TODO: нужно ли???
  // flow?: null | undefined | 'none' | 'xon'; // (default none) software flow control
  // path?: null | undefined | string;      // Linux Only - the path to the Serial device to use
  // errors?: boolean;                      // (default false) whether to forward framing/parity errors
}


export default class SerialDev implements Serial {

  // TODO: events 'framing' | 'parity' - maybe they are errors

  on(uartName: Uart, eventsName: EventName, handler: (...params: any[]) => void): void {
    this.getSerial(uartName).on(eventsName, handler);
  }

  async print(uartName: Uart, data: string): Promise<void> {
    this.getSerial(uartName).print(data);
  }

  async println(uartName: Uart, data: string): Promise<void> {
    this.getSerial(uartName).println(data);
  }

  async read(uartName: Uart, chars?: number): Promise<string> {
    return this.getSerial(uartName).read(chars);
  }

  setup(uartName: Uart, baudRate?: BaudRate, options?: EspOptions): void {
    this.getSerial(uartName).setup(baudRate, options);
  }

  async write(uartName: Uart, data: Uint8Array | string[] | { data: any, count: number }, ): Promise<void> {
    return this.getSerial(uartName).write(data);
  }

  private getSerial(uartName: Uart): any {

    // TODO: проверить будет ли работать

    return (global as any)[uartName];
  }

}







// var uart1 = Serial1;
// var uart2 = Serial3;
//
// console.log('-----start');
//
//
// //var cmd="";
// //uart1.setup(9600); // baud
//
// uart2.setup(9600); // baud
//
// //uart1.on('data', function (data) {
// //  console.log('uart1', data);
// //print("<Serial4> "+data)
// //});
//
// setInterval(() => {
//   uart2.print('dddata');
// }, 1000);
//
//
// //////////////////// esp32
//
// var uart1 = Serial3;
//
// console.log('-----start');
//
// uart1.setup(9600); // baud
//
// uart1.on('data', function (data) {
//   console.log('uart1', data);
// });
//
//
//
// //////////// eso8266
// var uart1 = Serial2;
//
// console.log('-----start');
//
// uart1.setup(9600); // baud
//
// setInterval(() => {
//   uart1.println('dd1');
//   console.log('--printed');
// }, 2000);
//
// save();
//
//
// ////////////////////////////
//
//
//
// //////////// eso8266
// var uart1 = Serial2;
//
// console.log('-----start');
//
// uart1.setup(9600); // baud
//
// uart1.on('data', function (data) {
//   console.log('uart1', data);
// });
//
//
// //////////////////// esp32
//
//
// var uart1 = Serial3;
//
// console.log('-----start');
//
// uart1.setup(9600); // baud
//
// setInterval(() => {
//   uart1.println('d1\r');
//   console.log('--printed');
// }, 3000);
//
// save();
//
//
//
// //////////////////////////////////////////////////
// //////////////////// esp32 both
//
// var uart1 = Serial1;
// var uart2 = Serial2;
//
// console.log('-----start');
//
// uart1.setup(9600, { tx: 1, rx: 3 }); // baud
// uart2.setup(9600, { tx: 17, rx: 16 }); // baud
//
// setInterval(() => {
//   uart1.println('d1');
//   console.log('--printed1');
// }, 3000);
//
// uart2.on('data', function (data) {
//   console.log('uart1', data);
// });
//
//
//
// ////////////////
//
// var pin = 23;
// pinMode(pin, 'output');
//
// var value = true;
//
// setInterval(() => {
//   digitalWrite(pin, value);
//   value = !value;
// }, 500);
//
//
// ///////////////////
//
// var pin = 23;
// pinMode(pin, 'input');
//
// setWatch(pin, (state) => {
//   print(state);
// });
//
//
//
// ////////////////////
//
// var uart1 = Serial1;
// var uart2 = Serial2;
// var ledPin = 13;
//
// var ledValue = true;
//
// pinMode(ledPin, 'output');
//
// console.log('-----start');
//
// uart1.setup(115200, { tx: 1, rx: 3 }); // baud
// uart2.setup(115200, { tx: 17, rx: 16 }); // baud
//
// setInterval(() => {
//   uart1.println('d1222222222');
//   //print('--printed1');
// }, 2000);
//
// uart2.on('data', function (data) {
//   print('received', data);
//   digitalWrite(ledPin, ledValue);
//   ledValue = !ledValue;
// });
//
//
//
// /////////////// es[32
//
// var uart1 = Serial3;
//
// console.log('-----start');
//
// uart1.setup(115200); // baud
//
// setInterval(() => {
//   uart1.println('d111');
//   //console.log('--printed');
// }, 2000);
//
// save();
//
//
//
// /////// 8266
//
// var ledPin = 4;
// var ledValue = true;
// pinMode(ledPin, 'output');
//
//
// var uart1 = Serial1;
//
// console.log('-----start');
//
// uart1.setup(115200); // baud
//
//
// uart1.on('data', function (data) {
//   //console.log('received', data);
//   digitalWrite(ledPin, ledValue);
//   ledValue = !ledValue;
// });
//
// uart1.println('wwwww');
//
//
// LoopbackA.setConsole();
//
//
// //save();
//
//
//
// //////////// from 32 to 8266
// ////////// 32
// var ledPin = 13;
// var ledValue = true;
// pinMode(ledPin, 'output');
//
// var uart1 = Serial3;
//
// console.log('-----start');
//
// uart1.setup(115200); // baud
//
// setInterval(() => {
//   uart1.println('3333');
//   //console.log('--printed');
//   digitalWrite(ledPin, ledValue);
//   ledValue = !ledValue;
// }, 2000);
//
// ///////////// 8266
//
// var uart1 = Serial1;
//
// console.log('-----start');
//
// uart1.setup(115200); // baud
//
// uart1.on('data', function (data) {
//   console.log('received-----', data);
// });
//
// LoopbackA.setConsole();
//
//
// /////////// !!!!!!!!!! works from 8266 to 32
// /////////////// 8366
//
// var ledPin = 5;
// var ledValue = true;
// pinMode(ledPin, 'output');
//
// var uart1 = Serial1;
//
// console.log('-----start');
//
// uart1.setup(115200); // baud
//
// setInterval(() => {
//   uart1.println('22222');
//   //console.log('--printed');
//   digitalWrite(ledPin, ledValue);
//   ledValue = !ledValue;
// }, 2000);
//
// save();
//
//
// //////////// esp32 - serial3 - pin 16, 17
//
// var ledPin = 2;
// var ledValue = true;
// pinMode(ledPin, 'output');
//
// var uart1 = Serial3;
//
// console.log('-----start');
//
// uart1.setup(115200); // baud
//
// uart1.on('data', function (data) {
//   console.log('received-----', data);
//   digitalWrite(ledPin, ledValue);
//   ledValue = !ledValue;
// });
//
// ////////////// esp 32 serial 2 - 33, 32
// var ledPin = 2;
// var ledValue = true;
// pinMode(ledPin, 'output');
//
// var uart1 = Serial2;
//
// console.log('-----start');
//
// uart1.setup(115200, { tx: 32, rx: 35 }); // baud
//
// uart1.on('data', function (data) {
//   console.log('received-----', data);
//   digitalWrite(ledPin, ledValue);
//   ledValue = !ledValue;
// });
//
//
//
//
// //////////////// на одном контроллере
// var uart1 = Serial3;
// var uart2 = Serial2;
//
// console.log('-----start');
//
// uart1.setup(115200, { tx: 17, rx: 16 }); // baud
// uart2.setup(115200, { tx: 32, rx: 33 }); // baud
//
// uart1.on('data', function (data) {
//   //print(JSON.stringify(data));
//   console.log('received-----1', JSON.stringify(data));
// });
//
// setInterval(() => {
//   uart2.println('333');
// }, 2000);
//
//
//
// ///////////// 485
// ///// 8266
// var ledPin = 5;
// var ledValue = true;
// pinMode(ledPin, 'output');
//
// var uart1 = Serial1;
//
// console.log('-----start');
//
// uart1.setup(115200); // baud
//
// setInterval(() => {
//   uart1.println('22222');
//   //console.log('--printed');
//   digitalWrite(ledPin, ledValue);
//   ledValue = !ledValue;
// }, 2000);
//
// save();
//
//
// //// 32
// var ledPin = 2;
// var ledValue = true;
//
// var uart1 = Serial3;
//
// console.log('-----start');
//
// uart1.setup(115200, { tx: 17, rx: 16 }); // baud
//
// uart1.on('data', function (data) {
//   console.log('received-----1', JSON.stringify(data));
//   digitalWrite(ledPin, ledValue);
//   ledValue = !ledValue;
// });

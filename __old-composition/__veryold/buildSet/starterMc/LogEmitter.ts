export default class LogEmitter {
  error(msg: Error | string) {
    //console.log(`ERROR: ${String(msg)}`);
    console.log(String(msg));
  }

  warn(...params: any[]) {
    console.log(...params);
  }

  info(...params: any[]) {
    console.log(...params);
  }

}

export default class LogEmitter {
  error(msg: Error) {
    //console.log(`ERROR: ${String(msg)}`);
    console.log(String(msg));
  }

  log(...params: any[]) {
    console.log(...params);
  }

}

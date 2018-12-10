import LogEmitter from './LogEmitter';
import FsDev from '../../platforms/squidlet-esp32/dev/Fs.dev';


export default class FlashingReceiver {
  private readonly logEmitter: LogEmitter;
  private readonly fs: FsDev = new FsDev();

  constructor(logEmitter: LogEmitter) {
    this.logEmitter = logEmitter;
  }

  async start() {
    //console.log(11111111111, this.fs.readdir('/'));
  }

}

import config, {ConfigInterface} from './config';
import Starter from './Starter';
import FlashingReceiver from './FlashingReceiver';
import LogEmitter from './LogEmitter';


export default class Main {
  readonly config: ConfigInterface = config;
  readonly log: LogEmitter;
  private readonly starter: Starter;
  private readonly flashingReceiver: FlashingReceiver;

  constructor() {
    this.log = new LogEmitter();
    this.starter = new Starter(this);
    this.flashingReceiver = new FlashingReceiver(this);
  }

  init() {
    try {
      this.starter.init();
    }
    catch(err) {
      this.log.error(err);
    }

    try {
      this.flashingReceiver.init();
    }
    catch(err) {
      this.log.error(err);
    }

  }
}

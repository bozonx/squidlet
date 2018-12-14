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
    this.starter.start()
      .catch((err: any) => this.log.error(err));
    this.flashingReceiver.start()
      .catch((err: any) => this.log.error(err));
  }
}

import config, {ConfigInterface} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/buildSet/starterMc/config.js';
import Starter from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/buildSet/starterMc/Starter.js';
import FlashingReceiver from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/buildSet/starterMc/FlashingReceiver.js';
import LogEmitter from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/buildSet/starterMc/LogEmitter.js';


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

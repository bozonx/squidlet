import System from '../../app/System';
import DeviceBase from '../../baseDevice/DeviceBase';
import {BinaryLevel} from '../../app/CommonTypes';
import GpioOutputFactory, {GpioOutputDriver} from '../../drivers/Gpio/GpioOutput.driver';
import DeviceConf from '../../app/interfaces/DeviceConf';
import {convertToLevel} from '../../helpers/helpers';
import {Data} from '../../baseDevice/DeviceDataManagerBase';
import {DEFAULT_STATUS} from '../../baseDevice/Status';


export default class Switch extends DeviceBase {
  private readonly gpioOutputDriver: GpioOutputDriver;
  private deadTimeInProgress: boolean = false;

  constructor(system: System, deviceConf: DeviceConf) {
    super(system, deviceConf);

    const gpioOutputDriverFactory = this.system.drivers.getDriver('GpioOutputDriver.driver') as GpioOutputFactory;

    this.gpioOutputDriver = gpioOutputDriverFactory.getInstance(this.deviceConf.props);
  }

  protected statusGetter = async (): Promise<Data> => {
    return { [DEFAULT_STATUS]: await this.gpioOutputDriver.getLevel() };
  }

  protected statusSetter = (partialData: Data): Promise<void> => {
    return this.gpioOutputDriver.setLevel(partialData[DEFAULT_STATUS]);
  }

  protected actions = {
    turn: async (onOrOff: any): Promise<BinaryLevel> => {
      // skip while switch at dead time
      if (this.deadTimeInProgress) return this.status.getLocal().default;

      this.deadTimeInProgress = true;
      setTimeout(() => this.deadTimeInProgress = false, this.deviceConf.props.deadTime);

      const level: boolean = convertToLevel(onOrOff);

      await this.setStatus(level);

      return level;
    },

    toggle: async (): Promise<BinaryLevel> => {
      // skip while switch at dead time
      if (this.deadTimeInProgress) return this.getStatus();

      this.deadTimeInProgress = true;
      setTimeout(() => this.deadTimeInProgress = false, this.deviceConf.props.deadTime);

      const currentLevel: boolean = await this.getStatus();

      if (currentLevel) {
        return this.actions.turn(false);
      }
      else {
        return this.actions.turn(true);
      }
    }
  };

}

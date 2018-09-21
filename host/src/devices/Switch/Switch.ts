import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {BinaryLevel} from '../../app/CommonTypes';
import {DigitalOutputDriver} from '../../drivers/Digital/DigitalOutput.driver';
import {convertToLevel} from '../../helpers/helpers';
import {Data} from '../../baseDevice/DeviceDataManagerBase';
import {DEFAULT_STATUS} from '../../baseDevice/Status';


interface Props extends DeviceBaseProps {
  deadTime: number;
}


export default class Switch extends DeviceBase<Props> {
  private deadTimeInProgress: boolean = false;

  private get digitalOutput(): DigitalOutputDriver {
    return this.depsInstances.digitalOutput as DigitalOutputDriver;
  }


  protected willInit = async () => {
    this.depsInstances.digitalOutput = (await this.getDriverDep('DigitalOutput.driver'))
      .getInstance(this.props);
  }

  protected statusGetter = async (): Promise<Data> => {
    return { [DEFAULT_STATUS]: await this.digitalOutput.getLevel() };
  }

  protected statusSetter = (partialData: Data): Promise<void> => {
    return this.digitalOutput.setLevel(partialData[DEFAULT_STATUS]);
  }

  protected actions = {
    turn: async (onOrOff: any): Promise<BinaryLevel> => {
      // skip while switch at dead time
      if (this.deadTimeInProgress) return this.status.getLocal().default;

      this.deadTimeInProgress = true;
      setTimeout(() => this.deadTimeInProgress = false, this.props.deadTime);

      const level: boolean = convertToLevel(onOrOff);

      await this.setStatus(level);

      return level;
    },

    toggle: async (): Promise<BinaryLevel> => {
      // skip while switch at dead time
      if (this.deadTimeInProgress) return this.getStatus();

      this.deadTimeInProgress = true;
      setTimeout(() => this.deadTimeInProgress = false, this.props.deadTime);

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

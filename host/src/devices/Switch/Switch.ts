import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {DigitalOutputDriver} from '../../drivers/Digital/DigitalOutput.driver';
import {convertToLevel} from '../../helpers/helpers';
import {Data} from '../../baseDevice/DeviceDataManagerBase';
import {DEFAULT_STATUS} from '../../baseDevice/Status';
import {GetDriverDep} from '../../app/entities/EntityBase';


interface Props extends DeviceBaseProps {
  blockTime: number;
}


export default class Switch extends DeviceBase<Props> {
  private blockTimeInProgress: boolean = false;

  private get digitalOutput(): DigitalOutputDriver {
    return this.depsInstances.digitalOutput as DigitalOutputDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.digitalOutput = getDriverDep('DigitalOutput.driver')
      .getInstance(this.props);
  }


  protected statusGetter = async (): Promise<Data> => {
    return { [DEFAULT_STATUS]: await this.digitalOutput.read() };
  }

  protected statusSetter = (partialData: Data): Promise<void> => {
    return this.digitalOutput.write(partialData[DEFAULT_STATUS]);
  }

  protected actions = {
    turn: async (onOrOff: any): Promise<boolean> => {
      // skip while switch at dead time
      if (this.blockTimeInProgress) return this.status.getLocal().default;

      this.blockTimeInProgress = true;
      setTimeout(() => this.blockTimeInProgress = false, this.props.blockTime);

      const level: boolean = convertToLevel(onOrOff);

      await this.setStatus(level);

      return level;
    },

    toggle: async (): Promise<boolean> => {
      // skip while switch at dead time
      if (this.blockTimeInProgress) return this.status.getLocal().default;

      this.blockTimeInProgress = true;
      setTimeout(() => this.blockTimeInProgress = false, this.props.blockTime);

      const currentLevel: boolean = await this.getStatus();
      const resultLevel: boolean = !currentLevel;

      await this.setStatus(resultLevel);

      return resultLevel;
    }
  };

}

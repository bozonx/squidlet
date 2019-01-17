import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {convertToLevel} from '../../helpers/helpers';
import {Data} from '../../baseDevice/DeviceDataManagerBase';
import {DEFAULT_STATUS} from '../../baseDevice/Status';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {BinaryOutputDriver, BinaryOutputDriverProps} from '../../drivers/Binary/BinaryOutput.driver';
import Status from '../../baseDevice/Status';


interface Props extends DeviceBaseProps, BinaryOutputDriverProps {
}


export default class Switch extends DeviceBase<Props> {
  private get binaryOutput(): BinaryOutputDriver {
    return this.depsInstances.binaryOutput as any;
  }

  protected get status(): Status {
    return this._status as Status;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.binaryOutput = await getDriverDep('BinaryOutput.driver')
      .getInstance(this.props);
  }


  protected statusGetter = async (): Promise<Data> => {
    return { [DEFAULT_STATUS]: await this.binaryOutput.read() };
  }

  protected statusSetter = async (partialData: Data) => {
    await this.binaryOutput.write(partialData[DEFAULT_STATUS]);
  }

  protected transformPublishValue = (value: boolean): number => {
    return Number(value);
  }

  protected actions = {
    turn: async (onOrOff: any): Promise<boolean> => {

      // TODO: може лучше использватть getStatus

      // skip while switch at block time
      if (this.binaryOutput.isBlocked()) return this.status.getState().default;

      const level: boolean = convertToLevel(onOrOff);

      await this.setStatus(level);

      return level;
    },

    toggle: async (): Promise<boolean> => {
      // skip while switch at block time
      if (this.binaryOutput.isBlocked()) return this.status.getState().default;

      const currentLevel: boolean = await this.getStatus();
      const resultLevel: boolean = !currentLevel;

      await this.setStatus(resultLevel);

      return resultLevel;
    }
  };

}

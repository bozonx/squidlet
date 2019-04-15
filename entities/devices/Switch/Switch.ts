import DeviceBase, {DeviceBaseProps} from 'system/baseDevice/DeviceBase';
import {convertToLevel} from 'system/helpers/helpers';
import {Data} from 'system/baseDevice/DeviceDataManagerBase';
import {DEFAULT_STATUS} from 'system/baseDevice/Status';
import {GetDriverDep} from 'system/entities/EntityBase';
import Status from 'system/baseDevice/Status';

import {BinaryOutput, BinaryOutputProps} from '../../drivers/BinaryOutput/BinaryOutput';


interface Props extends DeviceBaseProps, BinaryOutputProps {
}


export default class Switch extends DeviceBase<Props> {
  private get binaryOutput(): BinaryOutput {
    return this.depsInstances.binaryOutput as any;
  }
  protected get status(): Status {
    return this._status as Status;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.binaryOutput = await getDriverDep('BinaryOutput')
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

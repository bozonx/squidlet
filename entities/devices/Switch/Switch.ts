import DeviceBase from 'system/baseDevice/DeviceBase';
import {convertToLevel} from 'system/helpers/helpers';
import {DEFAULT_STATUS} from 'system/baseDevice/StatusState';
import {GetDriverDep} from 'system/entities/EntityBase';
import {StateObject} from 'system/State';

import {BinaryOutput, BinaryOutputProps} from '../../drivers/BinaryOutput/BinaryOutput';


interface Props extends BinaryOutputProps {
}


export default class Switch extends DeviceBase<Props> {
  private get binaryOutput(): BinaryOutput {
    return this.depsInstances.binaryOutput;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.binaryOutput = await getDriverDep('BinaryOutput')
      .getInstance(this.props);

    this.depsInstances.binaryOutput.onIncomeChange((newLevel: boolean) => {
      if (!this.statusState) throw new Error(`No status`);

      this.statusState.setIncomeState({ [DEFAULT_STATUS]: newLevel });
    });
  }


  protected statusGetter = async (): Promise<StateObject> => {
    return { [DEFAULT_STATUS]: await this.binaryOutput.read() };
  }

  protected statusSetter = async (partialData: StateObject) => {
    await this.binaryOutput.write(partialData[DEFAULT_STATUS] as boolean);
  }

  protected actions = {
    turn: async (onOrOff: any): Promise<boolean> => {
      if (!this.statusState) throw new Error(`No status`);

      // skip while switch at block time
      if (this.binaryOutput.isBlocked()) return this.getStatus() as boolean;

      const level: boolean = convertToLevel(onOrOff);

      await this.setStatus(level);

      return level;
    },

    toggle: async (): Promise<boolean> => {
      if (!this.statusState) throw new Error(`No status`);

      const currentLevel: boolean = this.getStatus() as boolean;

      // skip while switch at block time
      if (this.binaryOutput.isBlocked()) return currentLevel;

      const resultLevel: boolean = !currentLevel;

      await this.setStatus(resultLevel);

      return resultLevel;
    }
  };

}

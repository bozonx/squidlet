import DeviceBase, {DEFAULT_STATUS} from 'system/base/DeviceBase';
import {resolveLevel} from 'system/lib/helpers';
import {Dictionary} from 'system/interfaces/Types';

import {BinaryOutput, BinaryOutputProps} from '../../drivers/BinaryOutput/BinaryOutput';


interface Props extends BinaryOutputProps {
}


export default class Switch extends DeviceBase<Props> {
  private get binaryOutput(): BinaryOutput {
    return this.depsInstances.binaryOutput;
  }


  protected didInit = async () => {
    this.depsInstances.binaryOutput = await this.context.getSubDriver('BinaryOutput', this.props);

    this.depsInstances.binaryOutput.onIncomeChange((newLevel: boolean) => {
      if (!this.statusState) throw new Error(`No status`);

      this.statusState.setIncomeState({ [DEFAULT_STATUS]: newLevel });
    });
  }


  protected statusGetter = async (): Promise<Dictionary> => {
    return { [DEFAULT_STATUS]: await this.binaryOutput.read() };
  }

  protected statusSetter = async (partialData: Dictionary) => {
    await this.binaryOutput.write(partialData[DEFAULT_STATUS] as boolean);
  }

  protected actions = {
    turn: async (onOrOff: any): Promise<boolean> => {
      if (!this.statusState) throw new Error(`No status`);

      // skip while switch at block time
      if (this.binaryOutput.isBlocked()) return this.getStatus() as boolean;

      const level: boolean = resolveLevel(onOrOff);

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

import DeviceBase from 'system/base/DeviceBase';
import {resolveLevel} from 'system/lib/digitalHelpers';
import {Dictionary} from 'system/interfaces/Types';
import {DEFAULT_DEVICE_STATUS} from 'system/constants';

import {BinaryOutput, BinaryOutputProps} from '../../drivers/BinaryOutput/BinaryOutput';


interface Props extends BinaryOutputProps {
}


export default class Switch extends DeviceBase<Props> {
  private get binaryOutput(): BinaryOutput {
    return this.depsInstances.binaryOutput;
  }


  protected async didInit() {
    this.depsInstances.binaryOutput = await this.context.getSubDriver('BinaryOutput', this.props);

    // this.binaryOutput.onIncomeChange((newLevel: boolean) => {
    //   if (!this.statusState) throw new Error(`No status`);
    //
    //   this.statusState.setIncomeState({ [DEFAULT_DEVICE_STATUS]: newLevel });
    // });
  }


  protected statusGetter = async (): Promise<Dictionary> => {
    return { [DEFAULT_DEVICE_STATUS]: await this.binaryOutput.read() };
  }

  protected statusSetter = async (partialData: Dictionary) => {
    await this.binaryOutput.write(partialData[DEFAULT_DEVICE_STATUS] as boolean);
  }

  protected actions = {
    turn: async (onOrOff: any): Promise<boolean> => {
      if (!this.statusState) throw new Error(`No status`);

      // TODO: review
      // skip while writing or block time are in progress
      if (this.binaryOutput.isInProgress()) return this.getStatus() as boolean;

      const level: boolean = resolveLevel(onOrOff);

      await this.setStatus(level);

      return level;
    },

    toggle: async (): Promise<boolean> => {
      if (!this.statusState) throw new Error(`No status`);

      const currentLevel: boolean = this.getStatus() as boolean;

      // TODO: review
      // skip while writing or block time are in progress
      if (this.binaryOutput.isInProgress()) return currentLevel;

      const resultLevel: boolean = !currentLevel;

      await this.setStatus(resultLevel);

      return resultLevel;
    }
  };

}

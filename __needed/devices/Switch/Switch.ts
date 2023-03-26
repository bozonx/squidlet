import DeviceBase from '__old/system/base/DeviceBase';
import {resolveLevel} from '../squidlet-lib/src/digitalHelpers';
import {Dictionary} from '../squidlet-lib/src/interfaces/Types';
import {DEFAULT_DEVICE_STATUS} from '__old/system/constants';

import {BinaryOutput, BinaryOutputProps} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/drivers/BinaryOutput/BinaryOutput.js';


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

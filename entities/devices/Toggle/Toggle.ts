import DeviceBase, {DEFAULT_STATUS} from 'system/baseDevice/DeviceBase';
import {GetDriverDep} from 'system/entities/EntityBase';
import {convertToLevel, invertIfNeed} from 'system/helpers/helpers';
import {StateObject} from 'system/State';

import {BinaryClick, BinaryClickProps} from '../../drivers/BinaryClick/BinaryClick';


interface Props extends BinaryClickProps {
  // in this time driver doesn't receive any data
  blockTime: number;
}


export default class Toggle extends DeviceBase<Props> {
  private blockTimeInProgress: boolean = false;


  private get binaryClick(): BinaryClick {
    return this.depsInstances.binaryClick;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.binaryClick = await getDriverDep('BinaryClick')
      .getInstance({
        ...this.props,
        // BinaryClick driver doesn't need a block time because it is put in place here
        blockTime: 0,
      });
  }

  protected didInit = async () => {
    // listen only keyUp events
    this.binaryClick.addUpListener(this.onUp);
  }

  protected initialStatus = async (): Promise<StateObject> => {
    return { [DEFAULT_STATUS]: invertIfNeed(false, this.props.invert) };
  }


  protected actions = {
    turn: async (onOrOff: any): Promise<boolean> => {
      if (this.blockTimeInProgress) return this.getStatus() as boolean;

      this.blockTimeInProgress = true;

      const level: boolean = convertToLevel(onOrOff);

      await this.setStatus(level);

      setTimeout(() => this.blockTimeInProgress = false, this.props.blockTime);

      return level;
    },

    toggle: async (): Promise<boolean> => {
      return this.doToggle();
    }
  };


  private onUp = async () => {
    await this.doToggle();
  }

  private async doToggle(): Promise<boolean> {
    if (this.blockTimeInProgress) return this.getStatus() as boolean;

    this.blockTimeInProgress = true;

    const level: boolean = !this.getStatus();

    await this.setStatus(level);

    setTimeout(() => this.blockTimeInProgress = false, this.props.blockTime);

    return level;
  }

}

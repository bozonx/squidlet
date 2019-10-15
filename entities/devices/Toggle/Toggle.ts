import DeviceBase from 'system/base/DeviceBase';
import {resolveLevel, invertIfNeed} from 'system/lib/helpers';
import {Dictionary} from 'system/interfaces/Types';
import {DEFAULT_DEVICE_STATUS} from 'system/constants';

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


  protected didInit = async () => {
    this.depsInstances.binaryClick = await this.context.getSubDriver(
      'BinaryClick',
      {
        ...this.props,
        // BinaryClick driver doesn't need a block time because it is put in place here
        blockTime: 0,
      }
    );

    // listen only keyUp events
    this.binaryClick.onUp(this.onUp);
  }

  protected initialStatus = async (): Promise<Dictionary> => {
    return { [DEFAULT_DEVICE_STATUS]: invertIfNeed(false, this.props.invert) };
  }


  protected actions = {
    turn: async (onOrOff: any): Promise<boolean> => {
      if (this.blockTimeInProgress) return this.getStatus() as boolean;

      this.blockTimeInProgress = true;

      const level: boolean = resolveLevel(onOrOff);

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

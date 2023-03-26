import DeviceBase from '__old/system/base/DeviceBase';
import {resolveLevel, invertIfNeed} from '../squidlet-lib/src/digitalHelpers';
import {Dictionary} from '../squidlet-lib/src/interfaces/Types';
import {DEFAULT_DEVICE_STATUS} from '__old/system/constants';

import {BinaryClick, BinaryClickProps} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/drivers/BinaryClick/BinaryClick.js';


interface Props extends BinaryClickProps {
  // in this time driver doesn't receive any data
  blockTime: number;
}


/**
 * State toggles by input pin or calling an action.
 */
export default class Toggle extends DeviceBase<Props> {
  private blockTimeout?: any;


  private get binaryClick(): BinaryClick {
    return this.depsInstances.binaryClick;
  }


  protected async didInit() {
    const subDriverProps: BinaryClickProps = {
      ...this.props,
      // BinaryClick driver doesn't need a block time because it uses here
      blockTime: 0,
    };

    this.depsInstances.binaryClick = await this.context.getSubDriver(
      'BinaryClick',
      subDriverProps
    );

    // listen only keyUp events
    this.binaryClick.onUp(this.onUp);
  }

  protected initialStatus = async (): Promise<Dictionary> => {
    return { [DEFAULT_DEVICE_STATUS]: false };
  }


  protected actions = {
    turn: async (onOrOff: any): Promise<boolean> => {
      if (this.blockTimeout) return this.getStatus() as boolean;

      const level: boolean = resolveLevel(onOrOff);

      this.blockTimeout = setTimeout(() => delete this.blockTimeout, this.props.blockTime);
      // set local status
      await this.setStatus(level);

      return level;
    },

    toggle: async (): Promise<boolean> => {
      return this.doToggle();
    }
  };


  private onUp = () => {
    this.doToggle()
      .catch(this.log.error);
  }

  private async doToggle(): Promise<boolean> {
    if (this.blockTimeout) return this.getStatus() as boolean;

    const level: boolean = !this.getStatus();

    this.blockTimeout = setTimeout(() => delete this.blockTimeout, this.props.blockTime);
    // set local status
    await this.setStatus(level);

    return level;
  }

}

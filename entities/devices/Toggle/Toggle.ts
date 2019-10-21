import DeviceBase from 'system/base/DeviceBase';
import {resolveLevel, invertIfNeed} from 'system/lib/digitalHelpers';
import {Dictionary} from 'system/interfaces/Types';
import {DEFAULT_DEVICE_STATUS} from 'system/constants';

import {BinaryClick, BinaryClickProps} from '../../drivers/BinaryClick/BinaryClick';
import {BinaryInput, BinaryInputProps} from '../../drivers/BinaryInput/BinaryInput';


interface Props extends BinaryClickProps {
  // in this time driver doesn't receive any data
  blockTime: number;
}


/**
 * State toggles by input pin or calling an action.
 */
export default class Toggle extends DeviceBase<Props> {
  private blockTimeout?: any;


  private get binaryClick(): BinaryInput {
    return this.depsInstances.binaryClick;
  }


  protected didInit = async () => {
    const binaryInputProps: BinaryInputProps = {
      ...this.props,
      edge: 'rising',
      // TODO: use debounce
      // TODO: review
      // BinaryInput driver doesn't need a block time because it uses here
      blockTime: 0,
    };

    this.depsInstances.binaryClick = await this.context.getSubDriver(
      'BinaryInput',
      binaryInputProps
    );

    // listen only keyUp events
    this.binaryClick.onChange(this.onUp);
  }

  protected initialStatus = async (): Promise<Dictionary> => {
    // TODO: review
    return { [DEFAULT_DEVICE_STATUS]: invertIfNeed(false, this.props.invert) };
  }


  protected actions = {
    turn: async (onOrOff: any): Promise<boolean> => {
      if (this.blockTimeout) return this.getStatus() as boolean;

      const level: boolean = resolveLevel(onOrOff);

      this.blockTimeout = setTimeout(() => delete this.blockTimeout, this.props.blockTime);

      await this.setStatus(level);

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
    if (this.blockTimeout) return this.getStatus() as boolean;

    const level: boolean = !this.getStatus();

    this.blockTimeout = setTimeout(() => delete this.blockTimeout, this.props.blockTime);

    await this.setStatus(level);

    return level;
  }

}

import {Data} from '../../../host/baseDevice/DeviceDataManagerBase';
import DeviceBase, {DeviceBaseProps} from '../../../host/baseDevice/DeviceBase';
import {GetDriverDep} from '../../../host/entities/EntityBase';
import {convertToLevel, invertIfNeed} from '../../../host/helpers/helpers';
import {DEFAULT_STATUS} from '../../../host/baseDevice/Status';
import {BinaryClickDriver, BinaryClickDriverProps} from '../../drivers/Binary/BinaryClick.driver';


interface Props extends DeviceBaseProps, BinaryClickDriverProps {
  // in this time driver doesn't receive any data
  blockTime: number;
}


export default class Toggle extends DeviceBase<Props> {
  private blockTimeInProgress: boolean = false;


  private get binaryClick(): BinaryClickDriver {
    return this.depsInstances.binaryClick as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.binaryClick = await getDriverDep('BinaryClick.driver')
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

  protected transformPublishValue = (value: boolean): number => {
    return Number(value);
  }

  protected initialStatus = async (): Promise<Data> => {
    return { [DEFAULT_STATUS]: invertIfNeed(false, this.props.invert) };
  }


  protected actions = {
    turn: async (onOrOff: any): Promise<boolean> => {
      if (this.blockTimeInProgress) return this.getStatus();

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
    if (this.blockTimeInProgress) return this.getStatus();

    this.blockTimeInProgress = true;

    const level: boolean = !await this.getStatus();

    await this.setStatus(level);

    setTimeout(() => this.blockTimeInProgress = false, this.props.blockTime);

    return level;
  }

}

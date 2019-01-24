import {Data} from '../../baseDevice/DeviceDataManagerBase';
import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {BinaryInputDriver, BinaryInputDriverProps} from '../../drivers/Binary/BinaryInput.driver';
import {convertToLevel, invertIfNeed} from '../../helpers/helpers';
import {DEFAULT_STATUS} from '../../baseDevice/Status';


interface Props extends DeviceBaseProps, BinaryInputDriverProps {
  // in this time driver doesn't receive any data
  blockTime: number;
}


export default class Toggle extends DeviceBase<Props> {
  private blockTimeInProgress: boolean = false;


  private get binaryInput(): BinaryInputDriver {
    return this.depsInstances.binaryInput as BinaryInputDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.binaryInput = await getDriverDep('BinaryInput.driver')
      .getInstance({
        ...this.props,
        // BinaryInput driver doesn't need a block time because it is put in place here
        blockTime: 0,
        // TODO: remove
        // listen only logical 1
        edge: 'rising',
      });
  }

  protected didInit = async () => {
    // listen driver's change
    this.binaryInput.addListener(this.onInputChange);

    console.log(333333333, this.props)
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
      return await this.doToggle();
    }
  };


  private onInputChange = async (level: boolean) => {
    // listen only for 1

    // TODO: remove

    if (!level) return;

    console.log(11111111, level)

    await this.doToggle();
  }

  private async doToggle(): Promise<boolean> {
    if (this.blockTimeInProgress) return this.getStatus();

    console.log(2222222)

    this.blockTimeInProgress = true;

    const level: boolean = !await this.getStatus();

    await this.setStatus(level);

    setTimeout(() => this.blockTimeInProgress = false, this.props.blockTime);

    return level;
  }

}

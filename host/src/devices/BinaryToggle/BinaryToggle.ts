import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {BinaryInputDriver, BinaryInputDriverProps} from '../../drivers/Binary/BinaryInput.driver';
import {convertToLevel} from '../../helpers/helpers';


interface Props extends DeviceBaseProps, BinaryInputDriverProps {
  actionDebounce: number;
}


export default class BinaryToggle extends DeviceBase<Props> {
  private blockTimeInProgress: boolean = false;


  private get binaryInput(): BinaryInputDriver {
    return this.depsInstances.binaryInput as BinaryInputDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.binaryInput = await getDriverDep('BinaryInput.driver')
      .getInstance({
        ...this.props,
        // don't use driver's block time
        blockTime: 0,
      });
  }

  protected didInit = async () => {
    // listen driver's change
    this.binaryInput.addListener(this.onInputChange);
  }

  protected transformPublishValue = (value: boolean): number => {
    return Number(value);
  }

  protected validateProps = (props: Props): string | undefined => {
    // TODO: !!!! validate debounce and blockTime
    return;
  }

  protected actions = {
    turn: async (onOrOff: any): Promise<boolean> => {
      if (this.blockTimeInProgress) this.getStatus();

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
    if (!level) return;

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

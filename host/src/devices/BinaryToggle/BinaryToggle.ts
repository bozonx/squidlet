import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {BinaryInputDriver, BinaryInputDriverProps} from '../../drivers/Binary/BinaryInput.driver';


interface Props extends DeviceBaseProps, BinaryInputDriverProps {
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


  private onInputChange = async (level: boolean) => {
    //await this.setStatus(level);
    await this.doToggle();
  }

  private async doToggle() {
    if (this.blockTimeInProgress) return;

    this.blockTimeInProgress = true;

    // just change state
    if (await this.getStatus()) {
      await this.setStatus(false);
    }
    else {
      await this.setStatus(true);
    }

    setTimeout(() => this.blockTimeInProgress = false, this.props.blockTime);
  }

}

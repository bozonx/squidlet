import {Data} from '../../baseDevice/DeviceDataManagerBase';
import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {BinaryInputDriver, BinaryInputDriverProps} from '../../drivers/Binary/BinaryInput.driver';
import {DEFAULT_STATUS} from '../../baseDevice/Status';
import {omit} from '../../helpers/lodashLike';
import {invertIfNeed} from '../../helpers/helpers';


interface Props extends DeviceBaseProps, BinaryInputDriverProps {
  // in this time driver doesn't receive any data
  blockTime: number;
  impulseLength: number;
}


export default class ImpulseSensor extends DeviceBase<Props> {
  private impulseInProgress: boolean = false;
  private blockTimeInProgress: boolean = false;


  private get binaryInput(): BinaryInputDriver {
    return this.depsInstances.binaryInput as BinaryInputDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.binaryInput = await getDriverDep('BinaryInput.driver')
      .getInstance(omit(this.props, 'impulseLength', 'blockTime'));
  }

  protected didInit = async () => {
    // listen driver's change
    this.binaryInput.addListener(this.onInputChange);
  }

  protected transformPublishValue = (value: boolean): number => {
    return Number(value);
  }

  protected validateProps = (props: Props): string | undefined => {
    // TODO: !!!!
    return;
  }

  protected initialStatus = async (): Promise<Data> => {
    return { [DEFAULT_STATUS]: invertIfNeed(false, this.props.invert) };
  }


  private onInputChange = async (level: boolean) => {
    if (this.impulseInProgress || this.blockTimeInProgress) return;
    // receive only level 1
    if (!level) return;

    this.impulseInProgress = true;

    // set impulse with level 1
    await this.setStatus(true);

    // waiting for impulse end
    setTimeout(async () => {
      this.impulseInProgress = false;
      // start dead time - ignore all the signals
      this.blockTimeInProgress = true;

      await this.setStatus(false);

      setTimeout(() => this.blockTimeInProgress = false, this.props.blockTime);
    }, this.props.impulseLength);
  }

}

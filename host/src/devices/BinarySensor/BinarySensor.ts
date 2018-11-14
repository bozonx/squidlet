const _omit = require('lodash/omit');

import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {Data} from '../../baseDevice/DeviceDataManagerBase';
import {DEFAULT_STATUS} from '../../baseDevice/Status';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {BinaryInputDriver, BinaryInputDriverProps} from '../../drivers/Binary/BinaryInput.driver';


interface Props extends DeviceBaseProps, BinaryInputDriverProps {
  // in this time driver doesn't receive any data
  blockTime: number;
}


export default class BinarySensor extends DeviceBase<Props> {
  private blockTimeInProgress: boolean = false;

  private get binaryInput(): BinaryInputDriver {
    return this.depsInstances.binaryInput as BinaryInputDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.binaryInput = await getDriverDep('BinaryInput.driver')
      .getInstance(_omit(this.props, 'blockTime'));
  }

  protected didInit = async () => {
    // listen driver's change
    this.binaryInput.addListener(this.onInputChange);
  }


  protected statusGetter = async (): Promise<Data> => {
    return { [DEFAULT_STATUS]: await this.binaryInput.read() };
  }

  protected transformPublishValue = (value: boolean): number => {
    return Number(value);
  }

  protected validateProps = (props: Props): string | undefined => {
    // TODO: !!!! validate debounce and blockTime
    return;
  }


  private onInputChange = async (level: boolean) => {
    // do nothing if there is block time
    //if (this.blockTimeInProgress) return;
    // TODO: add block time

    await this.setStatus(level);

    // return new Promise<void>((resolve) => {
    //   setTimeout(() => {
    //     this.blockTimeInProgress = false;
    //     resolve();
    //   }, this.props.blockTime);
    // });
  }

}

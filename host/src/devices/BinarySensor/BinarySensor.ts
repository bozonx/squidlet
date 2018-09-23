import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {DigitalInputDriver, DigitalInputDriverProps} from '../../drivers/Digital/DigitalInput.driver';
import {Data} from '../../baseDevice/DeviceDataManagerBase';
import {DEFAULT_STATUS} from '../../baseDevice/Status';
import {GetDriverDep} from '../../app/entities/EntityBase';


type DebounceType = 'debounce' | 'throttle';

interface Props extends DeviceBaseProps, DigitalInputDriverProps {
  debounce: number;
  debounceType: DebounceType;
  blockTime: number;
}


export default class BinarySensor extends DeviceBase<Props> {
  //private debounceInProgress: boolean = false;
  private blockTimeInProgress: boolean = false;

  private get digitalInput(): DigitalInputDriver {
    return this.depsInstances.digitalInput as DigitalInputDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.digitalInput = getDriverDep('DigitalInput.driver')
      .getInstance(this.props);
  }

  protected didInit = async () => {
    this.digitalInput.addListener(this.onInputChange, this.props.debounce);
  }


  protected statusGetter = async (): Promise<Data> => {
    return { [DEFAULT_STATUS]: await this.digitalInput.read() };
  }


  private onInputChange = async (level: boolean) => {
    // do nothing if there is block time
    if (this.blockTimeInProgress) return;

    // start dead time - ignore all the signals
    this.blockTimeInProgress = true;

    try {
      // set it to status
      // TODO: wait for promise ???
      this.setStatus(level);
    }
    catch (err) {
      // TODO: наверное написать в лог об ошибке
      this.blockTimeInProgress = false;

      return;
    }

    setTimeout(() => {
      this.blockTimeInProgress = false;
    }, this.props.blockTime);


    // // do nothing if there is debounce or dead time
    // if (this.debounceInProgress || this.blockTimeInProgress) return;
    //
    // this.debounceInProgress = true;
    //
    // // waiting for debounce
    // setTimeout(() => {
    //   this.debounceInProgress = false;
    //   this.startValueLogic();
    // }, this.props.debounce);
  }

  // private async startValueLogic(): Promise<void> {
  //   // start dead time - ignore all the signals
  //   this.blockTimeInProgress = true;
  //
  //   let currentLevel: boolean = false;
  //   const waitBlockTime = () => setTimeout(() => {
  //     this.blockTimeInProgress = false;
  //   }, this.props.blockTime);
  //
  //   try {
  //     currentLevel = await this.digitalInput.read();
  //   }
  //   catch (err) {
  //     waitBlockTime();
  //
  //     return;
  //   }
  //
  //   // TODO: wait for promise ???
  //   this.setStatus(currentLevel);
  //
  //   waitBlockTime();
  // }


  protected validateProps = (props: Props): string | undefined => {
    // TODO: !!!! validate debounce and blockTime
    return;
  }

}

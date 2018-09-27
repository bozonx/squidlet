import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {DigitalInputDriver, DigitalInputDriverProps} from '../../drivers/Digital/DigitalInput.driver';
import {Data} from '../../baseDevice/DeviceDataManagerBase';
import {DEFAULT_STATUS} from '../../baseDevice/Status';
import {GetDriverDep} from '../../app/entities/EntityBase';
import DebounceType from '../../drivers/Digital/interfaces/DebounceType';


interface Props extends DeviceBaseProps, DigitalInputDriverProps {
  debounce: number;
  debounceType: DebounceType;
  blockTime: number;
}


export default class BinarySensor extends DeviceBase<Props> {
  private throttleInProgress: boolean = false;
  private blockTimeInProgress: boolean = false;

  private get digitalInput(): DigitalInputDriver {
    return this.depsInstances.digitalInput as DigitalInputDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.digitalInput = getDriverDep('DigitalInput.driver')
      .getInstance(this.props);
  }

  protected didInit = async () => {
    // TODO: если throttle то наверное debounce 0 по умолчанию
    this.digitalInput.addListener(this.onInputChange, this.props.debounce);
  }


  protected statusGetter = async (): Promise<Data> => {
    return { [DEFAULT_STATUS]: await this.digitalInput.read() };
  }


  private onInputChange = async (level: boolean) => {
    // do nothing if there is block time
    if (this.blockTimeInProgress) return;

    try {
      if (this.props.debounceType === 'throttle') {
        // throttle logic
        await this.throttle();
      }
      else {
        // debounce logic
        await this.startBlockTime(async () => level);
      }
    }
    catch (err) {
      this.env.log.error(err);
    }
  }

  private async throttle() {
    // do nothing if there is debounce or dead time
    if (this.throttleInProgress) return;

    this.throttleInProgress = true;

    // waiting for debounce
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        this.throttleInProgress = false;
        this.startBlockTime(() => this.digitalInput.read())
          .then(resolve)
          .catch(reject);
      }, this.props.debounce);
    });
  }

  private async startBlockTime(getLevel: () => Promise<boolean>): Promise<void> {
    // start block time - ignore all the signals
    this.blockTimeInProgress = true;

    try {
      const level: boolean = await getLevel();
      // set it to status
      // TODO: wait for promise ???
      this.setStatus(level);
    }
    catch (err) {
      this.blockTimeInProgress = false;

      throw err;
    }

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.blockTimeInProgress = false;
        resolve();
      }, this.props.blockTime);
    });
  }


  protected validateProps = (props: Props): string | undefined => {
    // TODO: !!!! validate debounce and blockTime
    return;
  }

}

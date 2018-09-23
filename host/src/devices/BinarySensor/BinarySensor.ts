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

    if (this.props.debounceType === 'throttle') {
      // throttle logic
      this.throttle();
    }
    else {
      // debounce logic
      await this.startBlockTime(async () => level);
    }
  }

  private throttle() {
    // do nothing if there is debounce or dead time
    if (this.throttleInProgress) return;

    this.throttleInProgress = true;

    // waiting for debounce
    setTimeout(() => {
      this.throttleInProgress = false;
      this.startBlockTime(() => this.digitalInput.read());
    }, this.props.debounce);
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
      // TODO: наверное написать в лог об ошибке
      this.blockTimeInProgress = false;

      return;
    }

    setTimeout(() => {
      this.blockTimeInProgress = false;
    }, this.props.blockTime);
  }


  protected validateProps = (props: Props): string | undefined => {
    // TODO: !!!! validate debounce and blockTime
    return;
  }

}

import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {BinaryLevel} from '../../app/CommonTypes';
import {DigitalInputDriver} from '../../drivers/Digital/DigitalInput.driver';
import {Data} from '../../baseDevice/DeviceDataManagerBase';
import {DEFAULT_STATUS} from '../../baseDevice/Status';
import DriverFactory from '../../app/interfaces/DriverFactory';
import DriverInstance from '../../app/interfaces/DriverInstance';


// TODO: наследовать ещё digital base props

interface Props extends DeviceBaseProps {
  debounce?: number;
  deadTime?: number;
}

interface DepsDrivers {
  'DigitalInput.driver': DriverFactory<DigitalInputDriver>;
}


export default class BinarySensor extends DeviceBase<Props, DepsDrivers> {
  private debounceInProgress: boolean = false;
  private deadTimeInProgress: boolean = false;

  // /**
  //  * Get driver which is dependency of device
  //  */
  // protected get drivers(): DepsDrivers {
  //   return this.driversInstances as any;
  // }

  private get digitalInput(): DigitalInputDriver {
    return this.depsInstances.digitalInput as DigitalInputDriver;
  }

  // TODO: review
  private get debounceTime(): number {
    if (typeof this.props.debounce === 'undefined') {
      // TODO: default value ????
      return 1;
    }

    return this.props.debounce;
  }

  // TODO: review
  private get deadTime(): number {
    if (typeof this.props.deadTime === 'undefined') {
      // TODO: default value ????
      return 1;
    }

    return this.props.deadTime;
  }

  
  protected willInit = async (depsDrivers: DepsDrivers) => {
    this.depsInstances.digitalInput = this.getDep('DigitalInput.driver').getInstance(this.props);
    //this.depsInstances.digitalInput = depsDrivers['DigitalInput.driver'].getInstance(this.props);
  }

  protected didInit = async () => {
    this.digitalInput.onChange(this.onInputChange);
  }

  protected statusGetter = async (): Promise<Data> => {
    return { [DEFAULT_STATUS]: await this.digitalInput.getLevel() };
  }


  private onInputChange = (): void => {
    // do nothing if there is debounce or dead time
    if (this.debounceInProgress || this.deadTimeInProgress) return;

    this.debounceInProgress = true;

    // waiting for debounce
    setTimeout(() => {
      this.debounceInProgress = false;
      this.startValueLogic();
    }, this.debounceTime);
  }

  private async startValueLogic(): Promise<void> {
    // start dead time - ignore all the signals
    this.deadTimeInProgress = true;

    let currentLevel: BinaryLevel = false;
    const waitDeadTime = () => setTimeout(() => {
      this.deadTimeInProgress = false;
    }, this.deadTime);

    try {
      currentLevel = await this.digitalInput.getLevel();
    }
    catch (err) {
      waitDeadTime();

      return;
    }

    // TODO: wait for promise ???
    this.setStatus(currentLevel);

    waitDeadTime();
  }


  validateProps(props: Props) {
    // TODO: !!!!
  }

}

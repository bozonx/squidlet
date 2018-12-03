import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {Data} from '../../baseDevice/DeviceDataManagerBase';
import {DEFAULT_STATUS} from '../../baseDevice/Status';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {ExpanderDriverProps, PCF8574Driver} from '../../drivers/Pcf8574/Pcf8574.driver';
import {Edge, PinMode, WatchHandler} from '../../app/interfaces/dev/Digital';
import Digital from '../../app/interfaces/dev/Digital';


interface Props extends DeviceBaseProps, ExpanderDriverProps {
}


export default class Pcf8574 extends DeviceBase<Props> {
  private get expander(): PCF8574Driver {
    return this.depsInstances.expander as PCF8574Driver;
  }

  // TODO: желательно проинициализировать одним запросом
  // TODO: может по умолчанию статус отключить
  // TODO: ??? навешаться на события
  // TODO: byteToBinArr(this.currentState)

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.expander = await getDriverDep('Pcf8574.driver')
      .getInstance(this.props);
  }

  protected didInit = async () => {
    // listen driver's change
    //this.binaryInput.addListener(this.onInputChange);
  }

  // TODO: use interface of ExpanderBase

  protected actions = {
    setup: (pin: number, pinMode: PinMode, outputInitialValue?: boolean): Promise<void> => {
      return this.expander.setup(pin, pinMode, outputInitialValue);
    },

    getPinMode: (pin: number): Promise<'input' | 'output' | undefined> => {
      return this.expander.getPinMode(pin);
    },

    read: (pin: number): Promise<boolean> => {
      return this.expander.read(pin);
    },

    write: (pin: number, value: boolean): Promise<void> => {
      return this.expander.write(pin, value);
    },

    // TODO: разобраться с listeners

    //addListener
    //removeListener
    //poll

    // async setWatch(pin: number, handler: WatchHandler, debounce?: number, edge?: Edge): Promise<number> {
    //
    // },
    //
    // async clearWatch(id: number): Promise<void> {
    //
    // },
    //
    // async clearAllWatches(): Promise<void> {
    //
    // },

  };

  // protected statusGetter = async (): Promise<Data> => {
  //   return { [DEFAULT_STATUS]: await this.binaryInput.read() };
  // }
  //
  // protected statusSetter = async (partialData: Data) => {
  //   await this.binaryOutput.write(partialData[DEFAULT_STATUS]);
  // }

  // protected transformPublishValue = (binArr: number[]): string => {
  //   return binArr.join('');
  // }
  //
  //
  // private onInputChange = async (binArr: number[]) => {
  //   await this.setStatus(binArr);
  // }

}

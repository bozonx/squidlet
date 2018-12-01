import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {Data} from '../../baseDevice/DeviceDataManagerBase';
import {DEFAULT_STATUS} from '../../baseDevice/Status';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {ExpanderDriverProps, PCF8574Driver} from '../../drivers/Pcf8574/Pcf8574.driver';


interface Props extends DeviceBaseProps, ExpanderDriverProps {
}


export default class Pcf8574 extends DeviceBase<Props> {
  private get expander(): PCF8574Driver {
    return this.depsInstances.expander as PCF8574Driver;
  }

  // TODO: отключить republish
  // TODO: желательно проинициализировать одним запросом
  // TODO: может по умолчанию статус отключить
  // TODO: ??? навешаться на события

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.expander = await getDriverDep('Pcf8574.driver')
      .getInstance(this.props);
  }

  protected didInit = async () => {
    // listen driver's change
    //this.binaryInput.addListener(this.onInputChange);
  }


  // protected statusGetter = async (): Promise<Data> => {
  //   return { [DEFAULT_STATUS]: await this.binaryInput.read() };
  // }
  //
  // protected transformPublishValue = (binArr: number[]): string => {
  //   return binArr.join('');
  // }
  //
  //
  // private onInputChange = async (binArr: number[]) => {
  //   await this.setStatus(binArr);
  // }

}

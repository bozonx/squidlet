import DeviceBase from '../../baseDevice/DeviceBase';
import BinarySensorParams from './BinarySensorParams';


export default class BinarySensor extends DeviceBase {
  protected init = (): void => {
    // TODO: могут передать любой драйвер - нужно его получить
    // TODO: сконфигурировать binary input sensor
  }

  protected transformParams = (params: {[index: string]: any}): BinarySensorParams => {

    // TODO: !!!!

    return {

    };
  }


  protected statusGetter = async (statusName: string): Promise<any> => {
    // TODO: запрашивать из binary input sensor
    // TODO: dead time
  }

  protected statusSetter = async (newValue: any, statusName: string): Promise<void> => {
    // TODO: дергать binary input sensor
  }

}

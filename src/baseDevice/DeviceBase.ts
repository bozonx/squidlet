import Status, {StatusGetter, StatusSetter} from './Status';
import Config, {ConfigGetter, ConfigSetter} from './Config';
import System from '../app/System';
import PublishParams from '../app/interfaces/PublishParams';
import DeviceConf from '../app/interfaces/DeviceConf';


export type Publisher = (subtopic: string, value: any, params?: PublishParams) => Promise<void>;


export default class DeviceBase {
  readonly status: Status;
  readonly config: Config;
  protected readonly system: System;
  protected readonly deviceConf: DeviceConf;

  protected afterInit?: () => void;
  protected destroy?: () => void;
  protected statusGetter?: StatusGetter;
  protected statusSetter?: StatusSetter;
  protected configGetter?: ConfigGetter;
  protected configSetter?: ConfigSetter;


  constructor(system: System, deviceConf: DeviceConf) {
    this.system = system;
    this.deviceConf = deviceConf;

    this.status = new Status(
      this.system,
      this.publish,
      this.deviceConf.props.statusRepublishInterval,
      this.statusGetter,
      this.statusSetter
    );
    this.config = new Config(
      this.system,
      this.publish,
      this.deviceConf.props.configRepublishInterval,
      this.configGetter,
      this.configSetter
    );

    Promise.all([
      this.status.init(),
      this.config.init(),
    ])
      .then(() => {
        if (typeof this.afterInit !== 'undefined') this.afterInit();
      })
      .catch(() => {
        // TODO: что делаем ???
      });
  }

  getStatus: Status['getStatus'] = this.status.getStatus;
  getConfig: Config['getConfig'] = this.config.getConfig;
  setStatus: Status['setStatus'] = this.status.setStatus;
  setConfig: Config['setConfig'] = this.config.setConfig;

  protected publish = async (subtopic: string, value: any, params?: PublishParams): Promise<void> => {
    // TODO: передать deviceConf.deviceId, subtopic, value, params
    // TODO: может делаться на удаленное устройство
  }

  // TODO: как сделать чтобы props имел тип???
  // TODO: валидация конфига + дополнительный метод валидации девайса
  // TODO: destroy

}

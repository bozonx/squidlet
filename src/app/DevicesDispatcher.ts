import * as _ from 'lodash';
import App from './App';
import MessageInterface from "./interfaces/MessageInterface";
import DestinationInterface from "./interfaces/DestinationInterface";


export default class DevicesDispatcher {
  private readonly _app: App;
  private readonly _callActionCategory: string = 'deviceCallAction';
  private readonly _deviceFeedBackCategory: string = 'deviceFeedBack';
  private readonly _statusTopic: string = 'status';
  private readonly _configTopic: string = 'config';

  constructor(app) {
    this._app = app;
    // listen messages to call actions of local device
    this._app.messenger.listenRequests(this._callActionCategory, this._handleCallActionRequests);
  }

  callAction(deviceId: string, actionName: string, params: Array<any>): Promise<any> {

    // TODO: проверить что actionName есть в манифесте

    const to = this._resolveHost(deviceId);
    const topic = `${deviceId}/${actionName}`;

    return this._app.messenger.request(to, this._callActionCategory, topic, params);
  }

  /**
   * Listen for device's status messages.
   */
  listenStatus(deviceId: string, handler: (statusName: string, partialStatus: object) => void) {
    const callback = (message: MessageInterface) => {
      handler(message.payload.statusName, message.payload.partialStatus);
    };

    this._app.messenger.subscribe(this._deviceFeedBackCategory, this._statusTopic, callback)
  }

  listenConfig(deviceId: string, handler: (partialConfig: object) => void) {
    const callback = (message: MessageInterface) => {
      handler(message.payload.partialConfig);
    };

    this._app.messenger.subscribe(this._deviceFeedBackCategory, this._configTopic, callback)
  }

  setConfig(deviceId: string, partialConfig: object) {
    const to = this._resolveHost(deviceId);
    const topic = `${deviceId}/setConfig`;

    return this._app.messenger.request(to, this._callActionCategory, topic, partialConfig);
  }

  /**
   * It runs from local device itself to publish its status changes.
   */
  publishStatus(deviceId: string, statusName: string, partialStatus: object): Promise<void> {

    // TODO: должен путликовать всем желающим - кто подписался

    const to = this._resolveHost('master');
    const payload = {
      statusName,
      partialStatus,
    };

    return this._app.messenger.publish(to, this._deviceFeedBackCategory, this._statusTopic, payload);
  }

  /**
   * It runs from device itself to publish its config changes.
   */
  publishConfig(deviceId: string, partialConfig: object): Promise<void> {

    // TODO: должен публиковать всем желающим - кто подписался

    const to = this._resolveHost('master');
    const payload = {
      partialConfig,
    };

    return this._app.messenger.publish(to, this._deviceFeedBackCategory, this._configTopic, payload);
  }

  /**
   * Listen for actions which have to be called on current host.
   */
  private _handleCallActionRequests = (request: MessageInterface):void => {
    this._callLocalDeviceAction(request)
      .then((result: any) => {
        this._app.messenger.sendRespondMessage(request, result);
      })
      .catch((error) => {
        this._app.messenger.sendRespondMessage(request, null, error);
      });
  };

  private async _callLocalDeviceAction(request: MessageInterface): Promise<any> {
    const [ deviceId, actionName ] = request.topic.split('/');

    if (!_.isArray(request.payload)) {
      throw new Error(`
        Payload of calling action has to be an array.
        Request: ${JSON.stringify(request)}
      `);
    }
    if (!actionName) {
      throw new Error(`
        You have to specify an actionName like this: { topic: deviceId/actionName } .
        Request: ${JSON.stringify(request)}
      `);
    }

    const device = this._app.devices.getDevice(deviceId);
    const result = await device[actionName](...request.payload);

    return result;
  }

  private _resolveHost(deviceId: string): DestinationInterface {

    // TODO: !!!! посмотреть в конфиге на каком хосте находится девайс и вернуть адрес
    // TODO: !!!! резолвить master

    return {
      hostId: '',
      type: '',
      bus: '',
      address: '',
    };
  }

}

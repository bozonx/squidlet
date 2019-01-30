//import Platforms from '../../../../configWorks/interfaces/Platforms';
import LogLevel from './LogLevel';


export interface HostConfigConfig {
  // path to dir where will be placed storage of host
  storageDir: string;
  logLevel: LogLevel;
  // republish status silently every minute if it hasn't been changed
  defaultStatusRepublishIntervalMs: number;
  // republish config silently every 10 minutes if it hasn't been changed
  defaultConfigRepublishIntervalMs: number;
  // main timeout in seconds
  senderTimeout: number;
  // resend timeout in seconds
  senderResendTimeout: number;
  drivers: {
    // debounce of digital input in ms
    //defaultDigitalPinInputDebounce: number;
    // default poll interval for master-slave connections
    //defaultPollInterval: number;
  };
  // custom params
  params: {[index: string]: any};

  network: {
    routedMessageTTL: number;
    requestTimeout: number;
  };
}


export default interface HostConfig {
  // id of host e.g master
  id: string;
  platform: string;
  //platform: Platforms;
  // specific config for each host
  config: HostConfigConfig;

  // // TODO: remove
  // address: Destination;
  //
  // connections: Array<MyAddress>;
  // // addresses of the nearest neighbors hosts
  // neighbors: {[index: string]: Destination};
  // // TODO: наверное сделать просто массивом, а список сервисов - отдельно
  // // routes for coordinators and links - { destHostId: route: [ 'currentHost', 'midHost', 'destHostId' ] }
  // routes: {[index: string]: Array<string>};
  // // TODO: сделать линки и координаторы
  // links: object;
}

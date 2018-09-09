import Platforms from '../../../../master/interfaces/Platforms';


export interface HostConfigConfig {
  // path to dir where will be placed storage of host
  storageDir: string;
  // republish status silently every minute if it hasn't been changed
  defaultStatusRepublishIntervalMs: number;
  // republish config silently every 10 minutes if it hasn't been changed
  defaultConfigRepublishIntervalMs: number;
  // custom params
  params: {[index: string]: any};
}


export default interface HostConfig {
  platform: Platforms;

  // TODO: rename host to props ?

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

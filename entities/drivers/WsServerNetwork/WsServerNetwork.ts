import DriverBase from 'system/base/DriverBase';
//import {mergeDeepObjects} from '../../../system/lib/objects';
import DriverFactoryBase, {WsServer, WebSocketServerDriverProps} from '../WsServer/WsServer';
import WsServerNetworkLogic from './WsServerNetworkLogic';


export interface WebSocketServerRouterPropsDriverProps extends WebSocketServerDriverProps {
}


export class WebSocketServerDuplex extends DriverBase<WebSocketServerRouterPropsDriverProps> {

  // onConnection(cb: (routeParams: RouteParams) => void): number {
  //
  // }
  //
  // removeConnectionListener(handlerId: number) {
  //
  // }
  //
  // /**
  //  * Force closing a connection to all the routes
  //  */
  // closeConnection(connectionId: string, code: number, reason: string) {
  //
  // }

}


export default class Factory extends DriverFactoryBase<WebSocketServerDuplex, WebSocketServerRouterPropsDriverProps> {
  protected SubDriverClass = WebSocketServerDuplex;

  protected instanceId = (props: WebSocketServerRouterPropsDriverProps): string => {
    return `${props.host}:${props.port}`;
  }
}


// export default class WsServerDuplex extends DriverBase {
//   async getInstance(instanceProps: {[index: string]: any} = {}): Promise<WsServerDuplexLogic> {
//     const props: WebSocketServerRouterPropsDriverProps = mergeDeepObjects(instanceProps, this.definition.props) as any;
//     const serverDriver: WebSocketServer = this.env.getDriver<DriverInstance>('WebSocketServer')
//       .getInstance(props);
//     const routerLogic: WsServerDuplexLogic = new WsServerDuplexLogic(serverDriver);
//
//     return routerLogic;
//   }
// }

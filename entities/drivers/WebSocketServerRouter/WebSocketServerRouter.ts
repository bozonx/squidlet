import DriverBase from 'system/baseDrivers/DriverBase';
import {mergeDeep} from '../../../system/helpers/collections';
import {WebSocketServer, WebSocketServerDriverProps} from '../WebSocketServer/WebSocketServer';
import WsServerRouterLogic from './WsServerRouterLogic';
import DriverInstance from 'system/interfaces/DriverInstance';


export interface WebSocketServerRouterPropsDriverProps extends WebSocketServerDriverProps {
}


export default class WebSocketServerRouter extends DriverBase {
  async getInstance(instanceProps: {[index: string]: any} = {}): Promise<WsServerRouterLogic> {
    const props: WebSocketServerRouterPropsDriverProps = mergeDeep(instanceProps, this.definition.props) as any;
    const serverDriver: WebSocketServer = this.env.getDriver<DriverInstance>('WebSocketServer')
      .getInstance(props);
    const routerLogic: WsServerRouterLogic = new WsServerRouterLogic(serverDriver);

    return routerLogic;
  }
}

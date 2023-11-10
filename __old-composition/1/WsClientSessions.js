import WebSocketClientIo, { OnMessageHandler } from '../../../../../squidlet/__old/system/interfaces/io/WsClientIo';
import DriverFactoryBase from '../../../../base/DriverFactoryBase';
import DriverBase from '../../../../base/DriverBase';
import WsClientLogic, { WsClientLogicProps } from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old-composition/drivers/WsClientLogic.js';
import IndexedEvents from '../squidlet-lib/src/IndexedEvents';
/**
 * Simplified websocket driver.
 * If autoReconnect if set it holds connection for ever and reconnects if it lost.
 * By calling getInstance() you will get always a new one. There isn't any sessions.
 */
export class WsClientSessions extends DriverBase {
    get connectedPromise() {
        if (!this.client) {
            throw new Error(`WebSocketClient.connectedPromise: ${this.closedMsg}`);
        }
        return this.client.connectedPromise;
    }
    closeEvents = new IndexedEvents();
    get wsClientIo() {
        return this.context.getIo('WebSocketClient');
    }
    client;
    get closedMsg() {
        return `Connection "${this.props.url}" has been closed`;
    }
    init = async () => {
        this.client = new WsClientLogic(this.wsClientIo, this.props, this.onConnectionClosed, this.log.debug, this.log.info, this.log.error);
        await this.client.init();
    };
    destroy = async () => {
        if (!this.client)
            return;
        await this.client.destroy();
        delete this.client;
    };
    isConnected() {
        if (!this.client)
            return false;
        return this.client.isConnected();
    }
    send(data) {
        if (!this.client)
            throw new Error(`WebSocketClient.send: ${this.closedMsg}`);
        return this.client.send(data);
    }
    onMessage(cb) {
        if (!this.client)
            throw new Error(`WebSocketClient.onMessage: ${this.closedMsg}`);
        return this.client.onMessage(cb);
    }
    onClose(cb) {
        return this.closeEvents.addListener(cb);
    }
    removeMessageListener(handlerId) {
        if (!this.client)
            return;
        this.client.removeMessageListener(handlerId);
    }
    removeCloseListener(handlerIndex) {
        this.closeEvents.removeListener(handlerIndex);
    }
    /**
     * It calls on unexpected closing of connection or on max reconnect tries is exceeded.
     */
    onConnectionClosed = () => {
        delete this.client;
        this.closeEvents.emit();
    };
}
export default class Factory extends DriverFactoryBase {
    SubDriverClass = WsClientSessions;
    instanceId = (props) => props.url;
}

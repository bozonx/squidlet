import DriverFactoryBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/DriverFactoryBase.js';
import DriverBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/DriverBase.js';
import WebSocketServerIo, { ConnectionParams } from '../../../../../squidlet/__old/system/interfaces/io/WsServerIo';
import { WebSocketServerProps } from '../../../../../squidlet/__old/system/interfaces/io/WsServerIo';
import WsServerDriver, { WS_SERVER_EVENTS } from '../../lib/logic/WsServerDriver';
export class WsServerSessions extends DriverBase {
    // it fulfils when server is start listening
    get listeningPromise() {
        if (!this.server) {
            throw new Error(`WebSocketServer.listeningPromise: ${this.closedMsg}`);
        }
        return this.server.listeningPromise;
    }
    get wsServerIo() {
        return this.context.getIo('WebSocketServer');
    }
    server;
    get closedMsg() {
        return `Server "${this.props.host}:${this.props.port}" has been already closed`;
    }
    init = async () => {
        this.server = new WsServerDriver(this.wsServerIo, this.props, this.onServerClosed, this.log.debug, this.log.info, this.log.error);
        await this.server.init();
    };
    // protected appDidInit = async () => {
    //   this.server && await this.server.init();
    // }
    destroy = async () => {
        if (!this.server)
            return;
        await this.server.destroy();
        delete this.server;
    };
    send = (connectionId, data) => {
        if (!this.server)
            throw new Error(`WebSocketServer.send: ${this.closedMsg}`);
        return this.server.send(connectionId, data);
    };
    // TODO: add closeServer ???
    /**
     * Force closing a connection
     */
    async closeConnection(connectionId, code, reason) {
        if (!this.server)
            return;
        await this.server.closeConnection(connectionId, code, reason);
    }
    async destroyConnection(connectionId) {
        if (!this.server)
            return;
        await this.server.destroyConnection(connectionId);
    }
    async setCookie(connectionId, cookie) {
        if (!this.server)
            return;
        await this.server.setCookie(connectionId, cookie);
    }
    onMessage(cb) {
        if (!this.server)
            throw new Error(`WebSocketServer.onMessage: ${this.closedMsg}`);
        return this.server.onMessage(cb);
    }
    onConnection(cb) {
        if (!this.server)
            throw new Error(`WebSocketServer.onConnection: ${this.closedMsg}`);
        return this.server.onConnection(cb);
    }
    /**
     * Ordinary connection close.
     * It won't be called on destroy
     */
    onConnectionClose(cb) {
        if (!this.server)
            throw new Error(`WebSocketServer.onConnectionClose: ${this.closedMsg}`);
        return this.server.onConnectionClose(cb);
    }
    removeListener(handlerIndex) {
        if (!this.server)
            return;
        this.server.removeListener(handlerIndex);
    }
    onServerClosed = () => {
        this.log.error(`WebSocketServer: ${this.closedMsg}, you can't manipulate it any more!`);
    };
}
export default class Factory extends DriverFactoryBase {
    SubDriverClass = WsServerSessions;
    instanceId = (props) => {
        return `${props.host}:${props.port}`;
    };
}

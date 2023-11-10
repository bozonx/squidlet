import WsServerIo, { WsServerProps } from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/io/WsServerIo.js';
import Logger from '../squidlet-lib/src/interfaces/Logger';
import Promised from '../squidlet-lib/src/Promised';
export var WS_SERVER_EVENTS;
(function (WS_SERVER_EVENTS) {
    WS_SERVER_EVENTS[WS_SERVER_EVENTS["incomeMessage"] = 0] = "incomeMessage";
    WS_SERVER_EVENTS[WS_SERVER_EVENTS["closeConnection"] = 1] = "closeConnection";
    WS_SERVER_EVENTS[WS_SERVER_EVENTS["newConnection"] = 2] = "newConnection";
})(WS_SERVER_EVENTS || (WS_SERVER_EVENTS = {}));
export const SETCOOKIE_LABEL = '__SET_COOKIE__';
// TODO: review
const HANDLER_INDEX_POSITION = 1;
// TODO: наверное прикрутить сессию чтобы считать что клиент ещё подключен
export default class WsServerDriverLogic {
    // it fulfils when server is start listening
    get startedPromise() {
        return this._startedPromised.promise;
    }
    events = new IndexedEventEmitter();
    wsServerIo;
    props;
    onClose;
    log;
    serverId = '';
    _startedPromised;
    handlerIndexes = [];
    constructor(wsServerIo, props, 
    // TODO: должен сам перезапускать сервер
    // It rises a handler only if server is closed.
    // It's better to destroy this instance and make new one if need.
    onClose, log) {
        this.wsServerIo = wsServerIo;
        this.props = props;
        this.onClose = onClose;
        this.log = log;
        this._startedPromised = new Promised();
    }
    /**
     * Start server
     */
    async init() {
        // TODO: review
        this.log.info(`... Starting websocket server: ${this.props.host}:${this.props.port}`);
        this.serverId = await this.wsServerIo.newServer(this.props);
        await this.listenServerEvents();
        await this.listenConnectionEvents();
    }
    async destroy() {
        // TODO: review
        if (!this.isInitialized()) {
            return this.logError(`WsServerLogic.destroy: Server hasn't been initialized yet.`);
        }
        this.logDebug(`... destroying websocket server: ${this.props.host}:${this.props.port}`);
        this.events.destroy();
        await this.removeListeners();
        // TODO: use destroyServer - it removes all the events before destroy
        // TODO: не должно поднять события
        await this.wsServerIo.closeServer(this.serverId);
        delete this.serverId;
    }
    isInitialized() {
        return typeof this.serverId !== 'undefined';
    }
    /**
     * Send message to client
     */
    send = (connectionId, data) => {
        this.logDebug(`WsServerLogic.send from ${this.props.host}:${this.props.port} to connection ${connectionId}, data length ${data.length}`);
        return this.wsServerIo.send(this.serverId, connectionId, data);
    };
    async setCookie(connectionId, cookie) {
        const data = `${SETCOOKIE_LABEL}${cookie}`;
        this.logDebug(`WsServerLogic.setCookie from ${this.props.host}:${this.props.port} to connection ${connectionId}, ${data}`);
        return this.wsServerIo.send(this.serverId, connectionId, data);
    }
    /**
     * Force closing a connection.
     * Close event will be risen
     */
    closeConnection(connectionId, code, reason) {
        this.logDebug(`WsServerLogic server ${this.props.host}:${this.props.port} manually closes connection ${connectionId}`);
        // TODO: проверить будет ли поднято событие close ???
        return this.wsServerIo.close(this.serverId, connectionId, code, reason);
    }
    async destroyConnection(connectionId) {
        this.logDebug(`WsServerLogic server ${this.props.host}:${this.props.port} destroys connection ${connectionId}`);
        // TODO: может проще тут отписаться от события и выполнить просто close
        return this.wsServerIo.close(this.serverId, connectionId, WsCloseStatus.closeGoingAway, 'Destroy connection');
        //await this.wsServerIo.destroyConnection(this.serverId, connectionId);
    }
    /**
     * Listen income messages
     */
    onMessage(cb) {
        return this.events.addListener(WS_SERVER_EVENTS.incomeMessage, cb);
    }
    /**
     * It rises when new connection is come.
     */
    onConnection(cb) {
        return this.events.addListener(WS_SERVER_EVENTS.newConnection, cb);
    }
    /**
     * Listen any connection close
     */
    onConnectionClose(cb) {
        return this.events.addListener(WS_SERVER_EVENTS.closeConnection, cb);
    }
    removeListener(handlerIndex) {
        this.events.removeListener(handlerIndex);
    }
    async listenServerEvents() {
        const listeningTimeout = setTimeout(() => {
            this.handleTimeout()
                .catch(this.logError);
        }, SERVER_STARTING_TIMEOUT_SEC * 1000);
        const listeningIndex = await this.wsServerIo.onServerListening(this.serverId, () => {
            clearTimeout(listeningTimeout);
            this.logDebug(`WsServerLogic: server ${this.props.host}:${this.props.port} started listening`);
            this._startedPromised.resolve();
        });
        const connectionIndex = await this.wsServerIo.onConnection(this.serverId, (connectionId, request) => {
            this.logDebug(`WsServerLogic: server ${this.props.host}:${this.props.port} received a new connection ${connectionId}, ${JSON.stringify(request)}`);
            this.events.emit(WS_SERVER_EVENTS.newConnection, connectionId, request);
        });
        const closeIndex = await this.wsServerIo.onServerClose(this.serverId, () => {
            clearTimeout(listeningTimeout);
            this.handleCloseServer()
                .catch(this.logError);
        });
        const errorIndex = await this.wsServerIo.onServerError(this.serverId, (err) => this.logError(String(err)));
        this.handlerIndexes.push([WsServerEvent.listening, listeningIndex]);
        this.handlerIndexes.push([WsServerEvent.newConnection, connectionIndex]);
        this.handlerIndexes.push([WsServerEvent.serverClose, closeIndex]);
        this.handlerIndexes.push([WsServerEvent.serverError, errorIndex]);
    }
    async listenConnectionEvents() {
        const closeIndex = await this.wsServerIo.onClose(this.serverId, (connectionId) => {
            this.logDebug(`WsServerLogic connection ${connectionId} has been closed on server ${this.props.host}:${this.props.port} has been closed`);
            this.events.emit(WS_SERVER_EVENTS.closeConnection, connectionId);
        });
        const messageIndex = await this.wsServerIo.onMessage(this.serverId, (connectionId, data) => {
            this.logDebug(`WsServerLogic income message on server ${this.props.host}:${this.props.port}, connection id ${connectionId}, data length ${data.length}`);
            this.events.emit(WS_SERVER_EVENTS.incomeMessage, connectionId, data);
        });
        const errorIndex = await this.wsServerIo.onError(this.serverId, (connectionId, err) => this.logError(String(err)));
        const unexpectedIndex = await this.wsServerIo.onUnexpectedResponse(this.serverId, (connectionId, response) => {
            this.logError(`Unexpected response has been received on server "${this.serverId}", ` +
                `connection "${connectionId}": ${JSON.stringify(response)}`);
        });
        this.handlerIndexes.push([WsServerEvent.clientClose, closeIndex]);
        this.handlerIndexes.push([WsServerEvent.clientMessage, messageIndex]);
        this.handlerIndexes.push([WsServerEvent.clientError, errorIndex]);
        this.handlerIndexes.push([WsServerEvent.clientUnexpectedResponse, unexpectedIndex]);
    }
    async handleCloseServer() {
        this.logDebug(`WsServerLogic: server ${this.props.host}:${this.props.port} has been closed`);
        await this.removeListeners();
        delete this.serverId;
        this.onClose();
        this.events.destroy();
    }
    async removeListeners() {
        for (let handlerIndex of this.handlerIndexes) {
            await this.wsServerIo.removeListener(this.serverId, handlerIndex[HANDLER_INDEX_POSITION]);
        }
    }
    async handleTimeout() {
        this._startedPromised.reject(new Error(`Server hasn't been started. Timeout has been exceeded`));
        await this.removeListeners();
        await this.wsServerIo.closeServer(this.serverId);
    }
}

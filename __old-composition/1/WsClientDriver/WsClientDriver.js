import IndexedEventEmitter from 'squidlet-lib/src/IndexedEventEmitter';
import { lastItem } from 'squidlet-lib/src/arrays';
import DriverFactoryBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/DriverFactoryBase.js';
import DriverInstanceBase from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/DriverInstanceBase.js';
import WsClientIo, { WsClientEvent, WsClientProps } from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/io/WsClientIo.js';
import { WsCloseStatus } from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/io/WsServerIo.js';
// TODO: use config
const WS_CLIENT_CONNECTION_TIMEOUT_SEC = 60;
export var WS_CLIENT_DRIVER_EVENTS;
(function (WS_CLIENT_DRIVER_EVENTS) {
    WS_CLIENT_DRIVER_EVENTS[WS_CLIENT_DRIVER_EVENTS["incomeMessage"] = 0] = "incomeMessage";
})(WS_CLIENT_DRIVER_EVENTS || (WS_CLIENT_DRIVER_EVENTS = {}));
export class WsClientInstance extends DriverInstanceBase {
    get connectionId() {
        return this._connectionId;
    }
    get wsClientIo() {
        return this.params.driver.wsClientIo;
    }
    events = new IndexedEventEmitter();
    _connectionId;
    $incomeEvent(eventName, ...params) {
        this.events.emit(eventName, ...params);
    }
    async init() {
        this._connectionId = await this.wsClientIo.newConnection(this.props);
        try {
            await this.waitForConnectionOpened();
        }
        catch (e) {
            await this.destroy();
            throw e;
        }
    }
    async $doDestroy() {
        this.events.destroy();
        await this.wsClientIo.closeConnection(this.connectionId, WsCloseStatus.closeGoingAway, `Instance destroy`);
    }
    on(eventName, cb) {
        return this.events.addListener(eventName, cb);
    }
    off(handlerIndex) {
        this.events.removeListener(handlerIndex);
    }
    async sendMessage(connectionId, data) {
        await this.wsClientIo.sendMessage(connectionId, data);
    }
    waitForConnectionOpened() {
        return new Promise((resolve, reject) => {
            let wasInited = false;
            const connectionCloseHandlerIndex = this.events.addListener(WsClientEvent.closed, () => {
                clearTimeout(timeout);
                this.events.removeListener(connectionCloseHandlerIndex);
                this.events.removeListener(openConnectionHandlerIndex);
                if (!wasInited) {
                    reject(`Connection "${this.connectionId}" has been closed at start up time.`);
                }
            });
            const openConnectionHandlerIndex = this.events.addListener(WsClientEvent.opened, () => {
                wasInited = true;
                clearTimeout(timeout);
                this.events.removeListener(connectionCloseHandlerIndex);
                this.events.removeListener(openConnectionHandlerIndex);
                resolve();
            });
            const timeout = setTimeout(() => {
                this.events.removeListener(connectionCloseHandlerIndex);
                this.events.removeListener(openConnectionHandlerIndex);
                reject(`Timeout has been exceeded opening a connection "${this.connectionId}"`);
            }, WS_CLIENT_CONNECTION_TIMEOUT_SEC);
        });
    }
}
export class WsClientDriver extends DriverFactoryBase {
    SubDriverClass = WsClientInstance;
    makeInstanceId = (props) => props.url;
    wsClientIo;
    async init() {
        this.wsClientIo = this.context.getIo('WsClient');
        await this.wsClientIo.on(WsClientEvent.error, (connectionId, err) => {
            this.log.error(err);
        });
        await this.wsClientIo.on(WsClientEvent.opened, (connectionId) => {
            this.passEventToInstance(WsClientEvent.opened, connectionId);
        });
        await this.wsClientIo.on(WsClientEvent.closed, (connectionId) => {
            this.passEventToInstance(WsClientEvent.closed, connectionId);
        });
        await this.wsClientIo.on(WsClientEvent.incomeMessage, (...params) => {
            this.passEventToInstance(WsClientEvent.incomeMessage, ...params);
        });
    }
    passEventToInstance(eventName, ...params) {
        const connectionId = lastItem(params);
        const instanceId = this.resolveInstanceIdByConnectionId(connectionId);
        if (!instanceId) {
            this.log.error(`Can't find instance of connection "${connectionId}"`);
            return;
        }
        this.instances[instanceId].$incomeEvent(eventName, ...params);
    }
    resolveInstanceIdByConnectionId(connectionId) {
        for (const instanceId of Object.keys(this.instances)) {
            if (this.instances[instanceId].connectionId === connectionId) {
                return this.instances[instanceId].instanceId;
            }
        }
        return;
    }
}

import ServiceBase from '../../../../../../squidlet/__old/system/base/ServiceBase';
import Context from '../../../../../../squidlet/__old/system/Context';
import EntityDefinition from '../../../../../../squidlet/__old/system/interfaces/EntityDefinition';
import RemoteCallMessage from '../../../../../../squidlet/__old/system/interfaces/RemoteCallMessage';
import Router from '../../../../../../../../../../../../mnt/disk2/workspace/squidlet/__old-composition/services/Network/useless/Router.js';
import NetworkMessage, { MessageType } from './interfaces/NetworkMessage';
// TODO: review
var NetworkDriver;
(function (NetworkDriver) {
    NetworkDriver[NetworkDriver["serial"] = 0] = "serial";
    NetworkDriver[NetworkDriver["mqtt"] = 1] = "mqtt";
    NetworkDriver[NetworkDriver["wsServer"] = 2] = "wsServer";
    NetworkDriver[NetworkDriver["wsClient"] = 3] = "wsClient";
    NetworkDriver[NetworkDriver["i2cMaster"] = 4] = "i2cMaster";
    NetworkDriver[NetworkDriver["i2cSlave"] = 5] = "i2cSlave";
})(NetworkDriver || (NetworkDriver = {}));
export const NETWORK_PORT = 255;
export default class Network extends ServiceBase {
    router;
    // link between { sessionId: [ hostId, networkDriverNum, busId ] }
    sessionLinks = {};
    constructor(context, definition) {
        super(context, definition);
        this.router = new Router(this.context, this.props);
    }
    init = async () => {
        await this.router.init();
        this.router.onIncomeDestMessage(this.handleIncomeMessage);
        this.context.system.apiManager.onOutcomeRemoteCall(this.handleOutcomeMessages);
        // TODO: слушать что сессия сдохла и удалить связь с hostId
    };
    destroy = async () => {
        this.router.destroy();
    };
    /**
     * Call api method at remote host and return result
     */
    async callApi(toHostId, pathToMethod, args) {
        const sessionId = this.resolveSessionId(toHostId);
        // TODO: как бы избежать двойного преобразования sessionId?
        return this.context.system.apiManager.callRemoteMethod(sessionId, pathToMethod, ...args);
    }
    handleIncomeMessage(message) {
        const sessionId = this.resolveSessionId(message.from);
        this.context.system.apiManager.incomeRemoteCall(sessionId, message.payload)
            .catch(this.log.error);
    }
    handleOutcomeMessages(sessionId, rcMessage) {
        // TODO: может и не найти - обработать ошибку или создать новую сессию???
        const hostId = this.resolveHostId(sessionId);
        this.router.send(hostId, MessageType.remoteCall, rcMessage)
            .catch(this.log.error);
    }
    resolveHostId(sessionId) {
        // TODO: add !!!!
    }
    /**
     * Return existent session id or
     */
    resolveSessionId(remoteHostId) {
        // TODO: принять driverName и busId
        // TODO: port нужно добавлять ????
    }
}

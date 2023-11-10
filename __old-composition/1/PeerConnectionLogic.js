var Timeout = NodeJS.Timeout;
import IndexedEventEmitter from '../../../../squidlet-lib/src/IndexedEventEmitter';
import Promised from '../../../../squidlet-lib/src/Promised';
var EVENTS;
(function (EVENTS) {
    EVENTS[EVENTS["connected"] = 0] = "connected";
    EVENTS[EVENTS["disconnected"] = 1] = "disconnected";
})(EVENTS || (EVENTS = {}));
const NO_PING_PROCESS = -1;
// TODO: после последнего запроса через какое-то время сделать ping
export default class PeerConnectionLogic {
    events = new IndexedEventEmitter();
    connectionPromised = new Promised();
    // if error means host is unreachable
    pingCb;
    isConnectionErrorCb;
    pingTimeout;
    pingCount = 0;
    pingIntervalMs;
    pingDone = NO_PING_PROCESS;
    get promise() {
        return this.connectionPromised.promise;
    }
    constructor(pingCb, isConnectionErrorCb, pingIntervalMs, pingCount) {
        this.pingCb = pingCb;
        this.isConnectionErrorCb = isConnectionErrorCb;
        this.pingIntervalMs = pingIntervalMs;
        this.pingCount = pingCount;
    }
    async send(requestCb) {
        // TODO: что если сейчас уже идет запрос???
        // if host hasn't been connected then wait for connection or connection failed
        // and make a new request
        if (!this.isConnected()) {
            try {
                await this.promise;
            }
            catch (e) {
                // do nothing
            }
        }
        try {
            return await requestCb();
        }
        catch (e) {
            if (!this.isConnectionErrorCb(e)) {
                throw e;
            }
            this.startPing();
            await this.promise;
            // TODO: если считалось что нет соединения то повторный запрос ненужен
            return await requestCb();
        }
    }
    isConnected() {
        return this.pingDone === NO_PING_PROCESS;
    }
    onConnected(cb) {
        return this.events.addListener(EVENTS.connected, cb);
    }
    onDisconnected(cb) {
        return this.events.addListener(EVENTS.disconnected, cb);
    }
    removeListener(handlerIndex) {
        this.events.removeListener(handlerIndex);
    }
    startPing() {
        // don't start another ping process if there is some started.
        if (this.pingTimeout)
            return;
        this.connectionPromised.destroy();
        this.connectionPromised = new Promised();
        this.pingDone = 0;
        this.pingTimeout = setTimeout(this.handlePing, this.pingIntervalMs);
    }
    handlePing = async () => {
        if (this.pingDone >= this.pingCount) {
            this.stopPing();
            this.connectionPromised.reject(new Error(`Connection timeout`));
            return;
        }
        this.pingDone++;
        try {
            await this.pingCb();
        }
        catch (e) {
            // just make another ping
            this.pingTimeout = setTimeout(this.handlePing, this.pingIntervalMs);
            return;
        }
        // if ok then stop ping
        this.stopPing();
        this.connectionPromised.resolve();
    };
    stopPing() {
        this.pingDone = NO_PING_PROCESS;
        clearTimeout(this.pingTimeout);
        delete this.pingTimeout;
    }
}

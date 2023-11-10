import IndexedEventEmitter from 'squidlet-lib/src/IndexedEventEmitter';
export var BRIDGE_MANAGER_EVENTS;
(function (BRIDGE_MANAGER_EVENTS) {
    BRIDGE_MANAGER_EVENTS[BRIDGE_MANAGER_EVENTS["incomeMessage"] = 0] = "incomeMessage";
})(BRIDGE_MANAGER_EVENTS || (BRIDGE_MANAGER_EVENTS = {}));
export class BridgesManager {
    events = new IndexedEventEmitter();
    async init() {
    }
    async destroy() {
        this.events.destroy();
    }
    async send(connectionId, channel, payload) {
        // TODO: add
    }
    on(eventName, cb) {
        return this.events.addListener(BRIDGE_MANAGER_EVENTS.incomeMessage, cb);
    }
    off(handlerIndex) {
        this.events.removeListener(handlerIndex);
    }
}

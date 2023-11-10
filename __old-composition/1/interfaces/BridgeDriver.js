export var BridgeConnectionState;
(function (BridgeConnectionState) {
    // initial state, before starting of connection
    BridgeConnectionState[BridgeConnectionState["initial"] = 0] = "initial";
    BridgeConnectionState[BridgeConnectionState["connected"] = 1] = "connected";
    // tries to connect or wait for the next try
    BridgeConnectionState[BridgeConnectionState["connecting"] = 2] = "connecting";
    // finally closed connection
    BridgeConnectionState[BridgeConnectionState["closed"] = 3] = "closed";
})(BridgeConnectionState || (BridgeConnectionState = {}));
export var BRIDGE_EVENT;
(function (BRIDGE_EVENT) {
    BRIDGE_EVENT[BRIDGE_EVENT["incomeMessage"] = 0] = "incomeMessage";
    BRIDGE_EVENT[BRIDGE_EVENT["connectionStateChanged"] = 1] = "connectionStateChanged";
})(BRIDGE_EVENT || (BRIDGE_EVENT = {}));

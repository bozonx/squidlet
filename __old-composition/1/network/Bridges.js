import { NetworkStatus } from '../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/plugins/networking/interfaces/BridgeDriver.js';
export var NetworkStatus;
(function (NetworkStatus) {
    NetworkStatus[NetworkStatus["ok"] = 0] = "ok";
    // body contains an error string
    NetworkStatus[NetworkStatus["errorMessage"] = 1] = "errorMessage";
})(NetworkStatus || (NetworkStatus = {}));

export var NetworkStatus;
(function (NetworkStatus) {
    NetworkStatus[NetworkStatus["ok"] = 0] = "ok";
    // body contains an error string
    NetworkStatus[NetworkStatus["errorMessage"] = 1] = "errorMessage";
})(NetworkStatus || (NetworkStatus = {}));

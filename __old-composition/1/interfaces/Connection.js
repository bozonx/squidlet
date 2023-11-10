export var ConnectionsEvents;
(function (ConnectionsEvents) {
    ConnectionsEvents[ConnectionsEvents["message"] = 0] = "message";
    ConnectionsEvents[ConnectionsEvents["connected"] = 1] = "connected";
    ConnectionsEvents[ConnectionsEvents["disconnected"] = 2] = "disconnected";
})(ConnectionsEvents || (ConnectionsEvents = {}));
// TODO: может где-то сделать enum ???
export const CONNECTION_SERVICE_TYPE = 'connection';

export type IncomeMessageHandler = (channel: number, payload: Uint8Array) => void;
export declare enum BridgeConnectionState {
    initial = 0,
    connected = 1,
    connecting = 2,
    closed = 3
}
export declare enum BRIDGE_EVENT {
    incomeMessage = 0,
    connectionStateChanged = 1
}
export interface BridgeDriver {
    getConnectionState(): BridgeConnectionState;
    /**
     * Send data to peer and don't wait for response.
     * Channel is from 0 and up to 255
     */
    sendMessage(channel: number, body: Uint8Array): Promise<void>;
    on(eventName: BRIDGE_EVENT.incomeMessage, cb: IncomeMessageHandler): number;
    on(eventName: BRIDGE_EVENT.connectionStateChanged, cb: (state: BridgeConnectionState) => void): number;
    off(handlerIndex: number): void;
}

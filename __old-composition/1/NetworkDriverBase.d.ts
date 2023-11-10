import DriverBase from '../../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/DriverBase.js';
import NetworkDriver, { IncomeRequestHandler, IncomeResponseHandler, NetworkRequest, NetworkResponse } from '../../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/NetworkDriver.js';
declare enum EVENTS {
    request = 0,
    response = 1
}
export default abstract class NetworkDriverBase<Props> extends DriverBase<Props> implements NetworkDriver {
    protected events: any;
    protected abstract write(data: Uint8Array): Promise<void>;
    request(port: number, body: Uint8Array): Promise<NetworkResponse>;
    onRequest(port: number, handler: IncomeRequestHandler): number;
    removeListener(handlerIndex: number): void;
    protected onIncomeResponse(register: number, handler: IncomeResponseHandler): number;
    protected sendRequest(register: number, request: NetworkRequest): Promise<void>;
    protected sendResponse(register: number, response: NetworkResponse): Promise<void>;
    /**
     * Handle income message and deserialize it.
     * @param data
     */
    protected incomeMessage(data: Uint8Array): void;
    protected makeEventName(eventName: EVENTS, register: number): string;
}
export {};

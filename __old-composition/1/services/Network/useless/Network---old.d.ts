import ServiceBase from '../../../../../../squidlet/__old/system/base/ServiceBase';
import Context from '../../../../../../squidlet/__old/system/Context';
import EntityDefinition from '../../../../../../squidlet/__old/system/interfaces/EntityDefinition';
interface NodeProps {
    driver: string;
    busId: string | number;
}
interface NetworkInterface extends NodeProps {
    [index: string]: any;
}
export interface NetworkProps {
    interfaces: NetworkInterface[];
    closestHosts: {
        [index: string]: NodeProps;
    };
    networkMap: {
        [index: string]: any;
    };
}
export declare const NETWORK_PORT = 255;
export default class Network extends ServiceBase<NetworkProps> {
    private readonly router;
    private sessionLinks;
    constructor(context: Context, definition: EntityDefinition);
    init: () => Promise<void>;
    destroy: () => Promise<void>;
    /**
     * Call api method at remote host and return result
     */
    callApi(toHostId: string, pathToMethod: string, args: any[]): Promise<any>;
    private handleIncomeMessage;
    private handleOutcomeMessages;
    private resolveHostId;
    /**
     * Return existent session id or
     */
    private resolveSessionId;
}
export {};

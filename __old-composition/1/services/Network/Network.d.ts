import ServiceBase from '../../../../../squidlet/__old/system/base/ServiceBase';
import { UriHandler } from '../../../../../../../../../../../mnt/disk2/workspace/squidlet/__old-composition/services/Network/NetworkLogic.js';
export interface NetworkProps {
}
export default class Network extends ServiceBase<NetworkProps> {
    private logic;
    init: () => Promise<void>;
    destroy: () => Promise<void>;
    request(toHostId: string, uri: string, payload: Uint8Array, TTL?: number): Promise<Uint8Array>;
    startListenUri(uri: string, handler: UriHandler): void;
    stopListenUri(uri: string): void;
}

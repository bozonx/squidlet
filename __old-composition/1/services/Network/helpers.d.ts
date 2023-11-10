import NetworkMessage from '../../../../../../../../../../../mnt/disk2/workspace/squidlet/__old-composition/services/Network/interfaces/NetworkMessage.js';
/**
 * Encode network message to bytes serial.
 * @param message
 */
export declare function encodeNetworkMessage(message: NetworkMessage): Uint8Array;
/**
 * Decode network message to object.
 * @param data
 */
export declare function decodeNetworkMessage(data: Uint8Array): NetworkMessage;

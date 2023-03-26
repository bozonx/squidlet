import Message from '../../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/network/messenger/interfaces/Message';


export default interface Request extends Message {
  payload?: any;
  // request or response unique id
  requestId: string;
  isRequest: true;
}

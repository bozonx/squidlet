import Message from './Message';


export default interface Request extends Message {
  // hostId of host which emits a message
  from: string;
  // request or response unique id
  requestId: string;
  isResponse: boolean;
  errorMessage?: string,
  errorCode?: number,
}

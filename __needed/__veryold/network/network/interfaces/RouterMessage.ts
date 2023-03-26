export default interface RouterMessage {
  // hostId of host which emits a message
  //from: string;
  // destination hostId
  //to: string;

  // hosts between "from" and "to"
  route: Array<string>;
  // count of routers which message transfer before it will be deleted
  ttl: number;
  payload: any;
}

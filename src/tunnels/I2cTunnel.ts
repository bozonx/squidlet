import MessageInterface from '../app/interfaces/MessageInterface';
import AddressInterface from '../app/interfaces/AddressInterface';


export default class I2cTunnel {
  constructor(connection: AddressInterface) {

  }

  async send(message: MessageInterface): Promise<void> {

  }

  listen(handler: (message: MessageInterface) => void): void {

  }

}

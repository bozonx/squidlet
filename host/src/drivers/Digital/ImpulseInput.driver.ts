import DigitalBaseProps from './interfaces/DigitalBaseProps';


export interface ImpulseInputDriverProps extends DigitalBaseProps {
  // listen for impulse
  impulseLength: number;
}


export class ImpulseInputDriver {
  constructor(props: Props) {

  }

  /**
   * Put this handler to your DigitalInput.driver's listener.
   */
  changeHandler = (value: boolean) => {

  }

  addListener(handler: () => void) {

  }

}

export default class Factory {
  async getInstance(instanceProps?: Props): Promise<ImpulseInputDriver> {
    // TODO: merge props
    return new ImpulseInputDriver();
  }
}

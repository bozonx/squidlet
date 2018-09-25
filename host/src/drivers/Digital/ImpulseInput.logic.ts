interface Props {
  // listen for impulse
  //addListener: () => void;

}


export class ImpulseInputLogic {
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
  async getInstance(instanceProps?: Props): Promise<ImpulseInputLogic> {
    // TODO: merge props
    return new ImpulseInputLogic();
  }
}

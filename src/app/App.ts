import Messenger from './Messenger';


export default class App {
  public readonly messenger: Messenger;

  constructor() {
    this.messenger = new Messenger(this);
  }
}

import App from "../app/App";

export default class RemoteSubscriber {
  private readonly app: App;

  constructor(app: App) {
    this.app = app;
  }
}

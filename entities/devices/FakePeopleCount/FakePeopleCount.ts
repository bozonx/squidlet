// TODO: remove

import DeviceBase from '../../../host/baseDevice/DeviceBase';


interface Props {
}


export default class FakePeopleCount extends DeviceBase<Props> {
  actions = {
    toggle: async (): Promise<number> => {
      if (await this.getStatus() > 0) {
        await this.setStatus(0);
      }
      else {
        await this.setStatus(1);
      }

      return this.getStatus();
    }
  };
}

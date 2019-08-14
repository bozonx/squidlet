// TODO: remove

import DeviceBase from 'system/entities/DeviceBase';
import {JsonTypes} from 'system/interfaces/Types';


interface Props {
}


export default class FakePeopleCount extends DeviceBase<Props> {
  protected actions = {
    toggle: async (): Promise<number> => {
      const status: JsonTypes = this.getStatus();

      if (typeof status === 'number' && status > 0) {
        await this.setStatus(0);
      }
      else {
        await this.setStatus(1);
      }

      return this.getStatus() as number;
    }
  };
}

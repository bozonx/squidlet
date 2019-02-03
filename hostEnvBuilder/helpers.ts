import systemConfig from './configs/systemConfig';

export function sortByIncludeInList(itemsToSearch: string[], listToSearchIn: string[]): [string[], string[]] {
  const included: string[] = [];
  const notIncluded: string[] = [];

  for (let item of itemsToSearch) {
    if (listToSearchIn.indexOf(item) >= 0) {
      included.push(item);
    }
    else {
      notIncluded.push(item);
    }
  }

  return [
    included,
    notIncluded,
  ];
}

/**
 * Make devices plain
 */
export function makeDevicesPlain(preDevices?: {[index: string]: any}): {[index: string]: any} {
  if (!preDevices) return {};

  const result: {[index: string]: any} = {};

  const recursively = (root: string, preDevicesOrRoom: {[index: string]: any}) => {
    if (preDevicesOrRoom.device) {
      // it's device definition
      result[root] = preDevicesOrRoom;

      return;
    }

    // else it's room - go deeper in room
    for (let itemName of Object.keys(preDevicesOrRoom)) {
      const newRoot = (root)
        ? [ root, itemName ].join(systemConfig.hostSysCfg.deviceIdSeparator)
        : itemName;
      recursively(newRoot, preDevicesOrRoom[itemName]);
    }
  };

  recursively('', preDevices);

  return result;
}

// TODO: remove

import DriverFactoryBase from '../../../base/DriverFactoryBase';
import DriverBase from '../../../base/DriverBase';


export default abstract class SourceDriverFactoryBase<
  Instance extends DriverBase = DriverBase,
  Props = {[index: string]: any}
> extends DriverFactoryBase {
  abstract generateUniqId(props: {[index: string]: any}): string;
}

import DriverEnv from './DriverEnv';
import {EntityProps} from '../interfaces/EntityDefinition';
import DriverInstance from '../interfaces/DriverInstance';


export default abstract class DriverFactoryBase {
  protected abstract DriverClass: { new (
      props: EntityProps,
      env: DriverEnv,
      ...params: Array<any>
    ): object };
  protected readonly env: DriverEnv;
  protected readonly props: EntityProps;

  constructor(props: EntityProps, env: DriverEnv) {
    this.props = props;
    this.env = env;
  }

  // TODO: придумать что-то с обобщением
  getInstance(...params: Array<any>) {
    return new this.DriverClass(this.props, this.env, ...params);
  }

}

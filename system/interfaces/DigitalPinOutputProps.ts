import GpioPinBaseProps from './GpioPinBaseProps';


export default interface DigitalPinOutputProps extends GpioPinBaseProps {
  openDrain?: boolean;
}

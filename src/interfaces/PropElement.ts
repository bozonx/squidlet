import {JsonTypes, PropTypes} from './Types'


export default interface PropElement {
  type: PropTypes
  default?: JsonTypes
  required?: boolean
}

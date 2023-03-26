import {JsonTypes, PropTypes} from '../../../../squidlet-lib/src/interfaces/Types'


export default interface PropElement {
  type: PropTypes
  default?: JsonTypes
  required?: boolean
}

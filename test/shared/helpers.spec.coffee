helpers = require('../../shared/helpers')


describe 'shared.helpers', ->
  it 'collectPropsDefaults', ->
    props = {
      stringProp: {
        type: 'string'
        default: 'value'
      }
      numberProp: {
        type: 'number'
        default: 5
      }
      noProp: {
        type: 'string'
      }
    }

    assert.deepEqual(helpers.collectPropsDefaults(props), {
      stringProp: 'value'
      numberProp: 5
    })

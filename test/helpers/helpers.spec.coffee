helpers = require('../../src/helpers/helpers')


describe 'helpers.helpers', ->
  it 'Uint8ArrayToString and StringToUint8Array', ->
    str = 'my строка'
    encoded = helpers.StringToUint8Array(str)

    assert.deepEqual(encoded, new Uint8Array([ 109, 121, 32, 209, 129, 209, 130, 209, 128, 208, 190, 208, 186, 208, 176 ]))
    assert.equal(helpers.Uint8ArrayToString(encoded), str)

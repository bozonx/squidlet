types = require('../../../host/helpers/typesHelpers');


describe.only 'helpers.typesHelpers', ->
  it "parseType", ->
    assert.deepEqual(types.parseType('number'), {
      types: ['number']
      constants: []
    })
    assert.deepEqual(types.parseType('1'), {
      types: []
      constants: [1]
    })
    assert.deepEqual(types.parseType('string | string[] | number | number[] | boolean | boolean[]'), {
      types: ['string', 'string[]', 'number', 'number[]', 'boolean', 'boolean[]']
      constants: []
    })
    assert.deepEqual(types.parseType('string | 1 | true | false | null | undefined | "str"'), {
      types: ['string']
      constants: [ 1, true, false, null, undefined, 'str' ]
    })
    assert.throws(() => types.parseType('stringer'))

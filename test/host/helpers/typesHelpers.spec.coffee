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
    assert.deepEqual(types.parseType(types.basicTypes.join('|')), {
      types: types.basicTypes
      constants: []
    })
    assert.deepEqual(types.parseType('string | 1 | true | false | null | undefined | "str"'), {
      types: ['string']
      constants: [ 1, true, false, null, undefined, 'str' ]
    })
    assert.throws(() => types.parseType('stringer'))

  it "isValueOfType", ->
    assert.isUndefined(types.isValueOfType('string', 'str'));
    assert.isUndefined(types.isValueOfType('number', 5));
    assert.isUndefined(types.isValueOfType('string | number', 5));
    assert.isUndefined(types.isValueOfType('string | 5', 5));
    assert.isUndefined(types.isValueOfType('number | "str"', 'str'));
    assert.isString(types.isValueOfType('string', 5));
    assert.isString(types.isValueOfType('number', 'str'));
    assert.isString(types.isValueOfType('string | number', false));
    assert.isString(types.isValueOfType('string | 5', 6));
    assert.isString(types.isValueOfType('number | "str"', 'strrr'));
    assert.isString(types.isValueOfType('number | "str"', undefined));

  it "validateParam", ->
    schema = {
      param: {
        type: 'number'
      }
    }
    assert.isUndefined(types.validateParam(schema, 'param', 5));
    assert.isString(types.validateParam(schema, 'param', false));

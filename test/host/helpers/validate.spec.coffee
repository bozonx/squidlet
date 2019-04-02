validate = require('../../../host/helpers/validate');


describe.only 'helpers.validate', ->
  it "isValueOfType", ->
    assert.isUndefined(validate.isValueOfType('string', 'str'));
    assert.isUndefined(validate.isValueOfType('number', 5));
    assert.isUndefined(validate.isValueOfType('string | number', 5));
    assert.isUndefined(validate.isValueOfType('string | 5', 5));
    assert.isUndefined(validate.isValueOfType('number | "str"', 'str'));
    assert.isString(validate.isValueOfType('string', 5));
    assert.isString(validate.isValueOfType('number', 'str'));
    assert.isString(validate.isValueOfType('string | number', false));
    assert.isString(validate.isValueOfType('string | 5', 6));
    assert.isString(validate.isValueOfType('number | "str"', 'strrr'));
    assert.isString(validate.isValueOfType('number | "str"', undefined));

  it "validateParam", ->
    schema = {
      param: {
        type: 'number'
      }
    }
    assert.isUndefined(validate.validateParam(schema, 'param', 5));
    assert.isString(validate.validateParam(schema, 'param', false));

  it "validateProps", ->

validate = require('../../../system/lib/validate');


describe 'system.lib.validate', ->
  it "isValueOfType", ->
    # success
    assert.isUndefined(validate.isValueOfType('string', 'str'));
    assert.isUndefined(validate.isValueOfType('number', 5));
    assert.isUndefined(validate.isValueOfType('boolean', false));
    assert.isUndefined(validate.isValueOfType('object', {}));
    assert.isUndefined(validate.isValueOfType('string | number', 5));
    assert.isUndefined(validate.isValueOfType('string | 5', 5));
    assert.isUndefined(validate.isValueOfType('number | "str"', 'str'));
    #fail
    assert.isString(validate.isValueOfType('string', 5));
    assert.isString(validate.isValueOfType('number', 'str'));
    assert.isString(validate.isValueOfType('boolean', undefined));
    assert.isString(validate.isValueOfType('object', 'str'));
    assert.isString(validate.isValueOfType('string | number', false));
    assert.isString(validate.isValueOfType('string | 5', 6));
    assert.isString(validate.isValueOfType('number | "str"', 'strrr'));
    assert.isString(validate.isValueOfType('number | "str"', undefined));

  it "isValueOfType - arrays", ->
    # success
    assert.isUndefined(validate.isValueOfType('string[]', ['str']));
    assert.isUndefined(validate.isValueOfType('number[]', [5]));
    assert.isUndefined(validate.isValueOfType('boolean[]', [false]));
    assert.isUndefined(validate.isValueOfType('object[]', [{a:1}]));
    # fail
    assert.isString(validate.isValueOfType('string[]', [5]));
    assert.isString(validate.isValueOfType('number[]', ['str']));
    assert.isString(validate.isValueOfType('boolean[]', [undefined]));
    assert.isString(validate.isValueOfType('object[]', ['str']));

  it "validateParam", ->
    schema = {
      param: {
        type: 'number'
      }
    }
    assert.isUndefined(validate.validateParam(schema, 'param', 5));
    assert.isString(validate.validateParam(schema, 'param', false));

  it "validateProps", ->
    props = {
      param: 5
    }
    schema = {
      param: {
        type: 'number'
      }
    }

    assert.isUndefined(validate.validateProps(props, schema));
    assert.isString(validate.validateProps({param: 'str'}, schema));
    assert.isString(validate.validateProps({oddParam: 'str'}, schema));

  it "validateRequiredProps", ->
    props = {
      param: 5
    }
    schema = {
      param: {
        type: 'number'
        required: true
      }
    }

    assert.isUndefined(validate.validateRequiredProps(props, schema));
    assert.isUndefined(validate.validateRequiredProps(props, {
      param: {
        type: 'number'
      }
    }));
    assert.isString(validate.validateRequiredProps({}, schema));

  it "whiteList", ->
    assert.isUndefined(validate.whiteList({a: 1, b: 2}, ['a', 'b', 'c'], 'param'));
    assert.isString(validate.whiteList({a: 1, b: 2}, ['a'], 'param'));

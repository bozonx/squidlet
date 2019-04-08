validate = require('../../hostEnvBuilder/hostConfig/validateRules').default


describe 'envBuilder.validateRules', ->
  beforeEach ->
    @manifest = {
      #baseDir: 'str'
      name: 'str'
      main: './main.ts'
    }

  it 'props schema', ->
    # required type
    assert.isString(validate({param: {}}, 'param'))
    # unknown type
    assert.isString(validate({param: { type: 'unknown' }}, 'param'))
    assert.isString(validate({param: { type: 'str'}}, 'param'))
    # required param
    assert.isString(validate({param: {
      type: 'number'
      required: 5
    }}, 'param'))
    # white list
    assert.isString(validate({param: {
      type: 'number'
      odd: 'str'
    }}, 'param'))

  it 'props default', ->
    # default has to be the same type as a type param
    assert.isUndefined(validate({
      param: {
        type: 'number'
        default: 5
      }
    }, 'param'))
    assert.isString(validate({
      param: {
        type: 'number'
        default: 'str'
      }
    }, 'param'))
    # one of compound type
    assert.isUndefined(validate({
      param: {
        type: 'number | string'
        default: 5
      }
    }, 'param'))
    assert.isUndefined(validate({
      param: {
        type: 'number | 5'
        default: 5
      }
    }, 'param'))
    assert.isString(validate({
      param: {
        type: 'number | string'
        default: true
      }
    }, 'param'))
    # boolean constant type
    assert.isUndefined(validate({
      param: {
        type: 'true'
        default: true
      }
    }, 'param'))
    # null constant type
    assert.isUndefined(validate({
      param: {
        type: 'null | string'
        default: null
      }
    }, 'param'))
    assert.isUndefined(validate({
      param: {
        type: 'undefined | string'
        default: undefined
      }
    }, 'param'))
    # string constant type
    assert.isUndefined(validate({
      param: {
        type: '"const"'
        default: 'const'
      }
    }, 'param'))

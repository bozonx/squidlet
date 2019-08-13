hashSum = require('../../../system/lib/hash-sum').default


describe.only 'system.helpers.hash-sum', ->
  it 'sum', ->
    str = 'asdfgh123456qwerylgjfn fidf eiefijef efi 34539987 kjgndfkj dfgojfgl'
    assert.equal(hashSum(str), hashSum(str))
    assert.isFalse(hashSum(str) == hashSum('other str'))
    assert.equal(hashSum(str).length, 8)

module.exports = {
  convertBufferToUint8Array: function (data) {
    var uIntArr = new Uint8Array(data.length);

    for (let i = 0; i < data.length; i++) {
      uIntArr[i] = data.readInt8(i);
    }

    return uIntArr;
  },
};

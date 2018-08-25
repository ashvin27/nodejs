let config    = require(__base + '/config'),
aesjs       = require('aes-js'),
algorithm     = config.keys.aes.algorithm,
key           = config.keys.aes.key;


module.exports = (params) => {
  return {
    decryptStr: (encStr, callback) => {
        try {

            let encryptedBytes    = aesjs.utils.hex.toBytes(encStr);
            let aesCtr            = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
            let decryptedBytes    = aesCtr.decrypt(encryptedBytes);
            let decryptedText     = aesjs.utils.utf8.fromBytes(decryptedBytes);
            console.log(decryptedText);

            callback(null, decryptedText);
        }
        catch(err){
            console.log(err);
            callback(err, false);
        }
    },
    encryptStr: (str, callback) => {
        try {

            let textBytes       = aesjs.utils.utf8.toBytes(str);
            let aesCtr          = new aesjs.ModeOfOperation.ctr(key,
              new aesjs.Counter(5));
            let encryptedBytes  = aesCtr.encrypt(textBytes);
            let encryptedHex    = aesjs.utils.hex.fromBytes(encryptedBytes);

            console.log(encryptedHex);

            callback(null, encryptedHex);
        }
        catch(err){
            callback(err, false);
        }
    }
  }
};

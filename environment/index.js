let config = require(__base + 'config'),
oneAuth = require(__base + 'components/one-auth/')({}),
commandLineArgs = require('command-line-args'),
aes = require(__base + 'components/core/helper/enc-dec')({});

const optionDefinitions = [
  { name: 'ci', type: String },
  { name: 'cs', type: String }
];

const options = commandLineArgs(optionDefinitions);

let setEnvironment = (callback) => {
  aes.decryptStr(options.ci, (ciErr, ciRes) => {
    if(ciRes) {
      console.log(ciRes);
      aes.decryptStr(options.cs, (csErr, csRes) => {
        if(csRes) {
          let params = {
            client_id: ciRes,
            client_secret: csRes
          };
          oneAuth.getToken(params, (gtErr, gtRes) => {
            if(gtRes) {
              callback(null, gtRes);
            } else {
              console.log('calling setEnvrionment in recursion.');
              setEnvironment(callback);
            }
          })
        }
      });
    }
  });
};

if(typeof options.ci!=='undefined' && typeof options.cs!=='undefined') {
  setEnvironment((seErr, seRes) => {
    if(seRes) {
      //process.env.access_token = seRes.access_token;
      process.env.access_token = '70cee6f97ba95c9c051a550f5e3ae1644d221cf44acee7acb698cf9de4ebfd80';
    }
  });
} else {
    console.log('Argument not supplied. You need to supply proper argument while starting the service.');
    process.exit(1);
}

let config  = require(__base + 'config'),
winston     = require('winston'),
logPath     = __base + config.inpremise.server.logs.path.accesslog,
moment      = require('moment'),
os          = require('os'),
process     = require('process');

module.exports = {
  log: () => {
    return applyLogger(winston);
  },
  format: (l, d) => {
    return logFormat(l, d);
  }
};

let applyLogger = (winston) => {
  return winston.createLogger({
      transports: [
          new winston.transports.File({
              level: 'info',
              filename: logPath,
              handleExceptions: true,
              json: false,
              maxsize: 5242880, //5MB
              maxFiles: 5,
              colorize: true
          }),
          new winston.transports.Console({
              level: 'debug',
              handleExceptions: true,
              json: false,
              colorize: true
          })
      ],
      exitOnError: false
  });
};

let logFormat = (l, d) => {
  return {
    level: l || 'info',
    date: moment().format('MMM DD'),
    timestamp: moment().format('HH:mm:ss'),
    hostname: os.hostname(),
    severity: l || 'info',
    'facility[proc_id]': `dv-services-inpremise[${process.pid}]`,
    message_id: 0,
    log_data: d || {}
  };
};

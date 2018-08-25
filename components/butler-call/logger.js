let winston = {};
let logPath = {};
let onFileLogger = {};
module.exports = function (params) {
  winston = params.winston;
  logPath = params.logPath;

  return applyLogger(winston);
};

let applyLogger = (winston) => {
  return winston.createLogger({
      transports: [
          new winston.transports.File({
              level: 'info',
              filename: logPath,
              handleExceptions: true,
              json: true,
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
}

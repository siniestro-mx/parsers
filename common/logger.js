const config = require('../../config.js');
const winston = require('winston');
const couchdb_transport = require('./winston_couchdb_transport.js');

// define the custom settings for each transport (file, console)
var options = {
  file: {
    level: 'info',
    filename: config.file_transport_name,
    handleExceptions: true,
    json: true,
    maxsize: 5242880,
    colorize: false
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: true,
    colorize: true
  },
  couchdb: {
    level: 'warn',
    db: config.couchdb.name,
    host: config.couchdb.host,
    port: config.couchdb.port,
    auth: {
      username: config.couchdb.username,
      password: config.couchdb.password
    },
    secure: false
  }
};

// instantiate a new Winston Logger with the settings defined above
const logger = winston.createLogger({
  transports: [
    new winston.transports.File(options.file),
    new winston.transports.Console(options.console),
    new couchdb_transport(options.couchdb)
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: config.winston_exceptions_filename })
  ],
  exitOnError: false, // do not exit on handled exceptions
});

module.exports = logger;

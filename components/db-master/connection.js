/* **** DATABASE CONNECTION **** */

/* Component for Database Connectivity
*  is for providing a Database Object to, then Controller
*  assign it to any module it wants.
*/

let config  = require(__base + '/config'),
db          = require('knex')({
    client: 'mysql',
    connection: {
      host: config.sql.host,
      user: config.sql.user,
      password: config.sql.password,
      database: config.sql.database,
      debug: config.sql.debugmode
    },
    pool: {
        min: config.sql.pool.min,
        max: config.sql.pool.max
    }
});

module.exports = db;

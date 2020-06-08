const formator = require('./createCCjson');
const ccTemplate = require('./templatecc');
const mariadb = require('mariadb');

module.exports = async function generator(owvisDB) {
  const actions = await loadFunctions(owvisDB);
  return formator(actions, ccTemplate);
};

/**
 * @param  {Object} owvisDB connection object for the OWVIS MariaDB
 */
async function loadFunctions(owvisDB) {
  const pool = mariadb.createPool({
    host: owvisDB.host,
    user: owvisDB.user,
    password: owvisDB.password,
    database: owvisDB.database,
    connectionLimit: 5,
  });

  const conn = await pool.getConnection();
  const actions = await conn.query('SELECT * from functions');
  conn.end();
  pool.end();
  return actions;
}

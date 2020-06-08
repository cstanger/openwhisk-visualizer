const mergeMetric = require('./../shared/mergeMetric');
const mariadb = require('mariadb');
const queries = require('./query');

module.exports = async function metricCalculator(params) {
  let { ccJSON, owvisDB } = params;
  const pool = mariadb.createPool({
    host: owvisDB.host,
    user: owvisDB.user,
    password: owvisDB.password,
    database: owvisDB.database,
    connectionLimit: 5,
  });
  const conn = await pool.getConnection();

  try {
    // Query
    for (let i = 0; i < queries.length; i++) {
      const result = await conn.query(queries[i]);
      result.forEach((actionResult) => {
        const { qualifiedName, ...metrics } = actionResult;
        ccJSON = mergeMetric(ccJSON, qualifiedName, metrics);
      });
    }

    return { actions: params.actions, ccJSON };
  } finally {
    conn.end();
    pool.end();
  }
};

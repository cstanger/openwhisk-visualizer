const mariadb = require('mariadb');

module.exports = async function edgeCalculator(params) {
  const { ccJSON, owvisDB } = params;
  const pool = mariadb.createPool({
    host: owvisDB.host,
    user: owvisDB.user,
    password: owvisDB.password,
    database: owvisDB.database,
    connectionLimit: 5,
  });
  let conn = {};
  try {
    conn = await pool.getConnection();
    const activation = await conn.query(
      // eslint-disable-next-line no-multi-str
      `SELECT 
          a.qualifiedName, 
          i.invocedqualifiedName, 
          SUM(i.amount) as amount
        FROM 
          (SELECT 
            i.activationID, 
            IfNULL(b.qualifiedName,  i.invocedqualifiedName) as invocedqualifiedName, 
            amount
          FROM edges as i 
          LEFT JOIN activations AS b ON b.activationID = i.invocedqualifiedName) as i 
        JOIN activations AS a ON a.activationId = i.activationId
        GROUP BY a.qualifiedName, i.invocedqualifiedName;`,
    );
    activation.forEach((invo) => {
      ccJSON.edges.push({
        fromNodeName:
          '/OpenWhisk' +
          (invo.qualifiedName.slice(0, 1) !== '/' ? '/' : '') +
          invo.qualifiedName,
        toNodeName:
          '/OpenWhisk' +
          (invo.invocedqualifiedName.slice(0, 1) !== '/' ? '/' : '') +
          invo.invocedqualifiedName,
        attributes: {
          activations: invo.amount,
        },
      });
    });
    return { actions: params.actions, ccJSON };
  } finally {
    conn && conn.end();
    pool.end();
  }
};

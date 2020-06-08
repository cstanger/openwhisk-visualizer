/* eslint-disable no-multi-str */
const mariadb = require('mariadb');

module.exports = async function dbInsert(actions, owvisDB) {
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
    await asyncFunction(conn, actions);
  } finally {
    conn.end && conn.end();
    pool.end();
  }
};
/**
 * @param  {d} conn
 * @param  {d} actions
 */
async function asyncFunction(conn, actions) {
  console.log(actions);
  const values = [];
  try {
    actions.forEach((fn) => {
      values.push([
        fn.namespace + '/' + fn.name,
        fn.name,
        fn.namespace.split('/')[1] || '',
        fn.namespace.split('/')[0],
        fn.version,
        fn.annotations.find((x) => x.key === 'kind')
          ? fn.annotations.find((x) => x.key === 'kind').value
          : fn.exec.kind || '',
        fn.limits.timeout,
        fn.limits.memory,
        fn.limits.logs,
        fn.publish,
        fn.annotations.find((x) => x.key === 'description')
          ? fn.annotations.find((x) => x.key === 'description').value
          : '',
        fn.annotations.find((x) => x.key === 'exec')
          ? fn.annotations.find((x) => x.key === 'exec').value
          : '',
      ]);
    });
    const sql =
      'INSERT INTO functions (qualifiedName, name, package, namespace, version, functionType, timeoutLimit, memoryLimit, logLimit, publish, description, execEnv) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) \
        ON DUPLICATE KEY UPDATE \
        name = VALUES(name), \
        package = VALUES(package), \
        namespace = VALUES(namespace), \
        version = VALUES(version), \
        functionType = VALUES(functionType), \
        timeoutLimit = VALUES(timeoutLimit), \
        memoryLimit = VALUES(memoryLimit), \
        logLimit = VALUES(logLimit), \
        publish = VALUES(publish), \
        description = VALUES(description),\
        execEnv = VALUES(execEnv);';
    await conn.batch(sql, values);
  } catch (err) {
    switch (err.code) {
      case 'ER_NO_SUCH_TABLE':
        console.log('Create new Function Table');
        await conn.query(
          'CREATE TABLE functions (' +
            "qualifiedName varchar(60) NOT NULL DEFAULT ''," +
            'name varchar(30) NOT NULL,' +
            'package varchar(30) NOT NULL,' +
            'namespace varchar(30) NOT NULL,' +
            "version varchar(10) DEFAULT ''," +
            "functionType varchar(10) DEFAULT ''," +
            'timeoutLimit int(11) DEFAULT NULL,' +
            'memoryLimit int(11) DEFAULT NULL,' +
            'logLimit int(11) DEFAULT NULL,' +
            'publish tinyint(1) DEFAULT NULL,' +
            'description text DEFAULT NULL,' +
            'lastFetch text DEFAULT NULL,' +
            'execEnv varchar(10) DEFAULT NULL,' +
            'PRIMARY KEY (qualifiedName))',
        );
        await asyncFunction(conn, actions);
        break;
      default:
        throw err;
    }
  }
  return true;
}

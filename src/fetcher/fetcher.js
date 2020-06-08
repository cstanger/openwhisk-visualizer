const mariadb = require('mariadb');
const cliProgress = require('cli-progress');
const fetchAPIInvocations = require('./owFetcher/fetchAPI');
const fetchDBInvocations = require('./owDBFetcher/fetchDB');

const p = new cliProgress.SingleBar(
  {
    format:
      'Fetch Metrics [{bar}] {percentage}% | {value}/{total} | {function}',
  },
  cliProgress.Presets.shades_classic,
);

module.exports = async function activationFetcher(params) {
  const pool = mariadb.createPool({
    host: params.owvisDB.host,
    user: params.owvisDB.user,
    password: params.owvisDB.password,
    database: params.owvisDB.database,
    connectionLimit: 5,
  });
  let actions = [];
  let conn = {};
  try {
    conn = await pool.getConnection();

    // Get all Functions
    actions = await loadFunctions(conn);
    p.start(actions.length, 0);

    if (global.asAdmin) {
      for (let i = 0; i < actions.length; i++) {
        p.update(i, { function: actions[i].qualifiedName });
        const activations = await fetchDBInvocations(params.owAPI, actions[i]);
        activations.length &&
          (await handleInvocations(actions[i], activations, conn));
      }
    } else {
      for (let i = 0; i < actions.length; i++) {
        p.update(i, { function: actions[i].qualifiedName });
        const activations = await fetchAPIInvocations(params.owAPI, actions[i]);
        activations.length &&
          (await handleInvocations(actions[i], activations, conn));
      }
    }
    p.update(actions.length, { function: '' });
  } finally {
    conn.end();
    pool.end();
    p.stop();
  }
};

/**
 * @param  {Pool} conn MariaDB connection Pool
 */
async function loadFunctions(conn) {
  const sql = 'SELECT qualifiedName, name, package, lastFetch from functions';
  const actions = await conn.query(sql);
  return actions;
}

/**
 * @param  {d} action
 * @param  {d} activations
 *  @param  {d} conn
 */
async function handleInvocations(action, activations, conn) {
  if (activations.length) {
    await insertActivation(
      conn,
      action.qualifiedName,
      activations,
      activations[0].end,
    );
    console.log(action.qualifiedName, ': Invokation add ', activations.length);
    global.totalActivations = global.totalActivations + activations.length;
  }
}

/**
 * @param  {Pool} conn MariaDB connection Pool
 * @param  {Object} action OpenWhisk Action Object
 * @param  {Array} activations Array of action Invocations
 * @param  {Number} fetchDate last fetch Timestamp
 */
async function insertActivation(conn, action, activations, fetchDate) {
  const values = [];
  const edges = [];
  try {
    activations.forEach((act) => {
      // format activations
      values.push([
        act.activationId,
        action,
        act.duration,
        act.coldstart || 0,
        act.inputHash || '',
        act.outputHash || '',
        act.memory || '',
        act.cpuUser || '',
        act.start,
        act.end,
        act.initTime || 0,
        act.waitTime || 0,
        act.response.size || 0,
        act.response.success || 0,
        act.response.statusCode || null,
        act.kind,
        act.edges.join(';') || null,
      ]);

      // count per function activation
      const counts = {};
      act.edges.forEach((fun) => (counts[fun] = 1 + (counts[fun] || 0)));
      Object.entries(counts).forEach((inv) => {
        edges.push([act.activationId].concat(inv).concat(act.kind));
      });
    });

    // Beginn Transaaction
    await conn.beginTransaction();
    const sql =
      'INSERT IGNORE INTO activations (activationId, qualifiedName, duration, coldstart, inputHash, outputHash, memory, cpuUser, start, end, initTime, waitTime, responseSize, success, status, kind, invoke) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';

    await conn.batch(sql, values);

    const sql2 = 'Update functions Set lastFetch=? where qualifiedName=?';
    await conn.query(sql2, [fetchDate, action]);

    if (edges.length) {
      const sql3 =
        'INSERT IGNORE INTO edges (activationId, invocedqualifiedName, amount, kind) VALUES (?,?,?,?)';
      await conn.batch(sql3, edges);
    }
    const results = conn.commit();

    return results;
  } catch (err) {
    await conn.rollback();
    switch (err.code) {
      case 'ER_NO_SUCH_TABLE':
        console.log('Create new Activation Table');
        await conn.query(
          'CREATE TABLE IF NOT EXISTS activations (' +
            "activationId varchar(60) NOT NULL DEFAULT ''," +
            'qualifiedName varchar(60) NOT NULL,' +
            'duration int(11),' +
            'coldstart tinyint(1),' +
            'inputHash varchar(60),' +
            'outputHash varchar(60),' +
            'memory varchar(60),' +
            'cpuUser varchar(60),' +
            'start bigint(50),' +
            'end bigint(50),' +
            'initTime int(50),' +
            'waitTime int(50),' +
            'responseSize int(50),' +
            'success tinyint(1),' +
            'status varchar(60),' +
            'kind varchar(60),' +
            'invoke varchar(300),' +
            'PRIMARY KEY (activationId));',
        );
        await conn.query(
          'CREATE TABLE IF NOT EXISTS edges (' +
            'id int(11) unsigned NOT NULL AUTO_INCREMENT,' +
            'activationId varchar(60),' +
            'invocedqualifiedName varchar(60),' +
            'kind varchar(60),' +
            'amount int(11),' +
            'PRIMARY KEY (id));',
        );
        await insertActivation(conn, action, activations, fetchDate);
        break;
      default:
        throw err;
    }
  }
  return true;
}

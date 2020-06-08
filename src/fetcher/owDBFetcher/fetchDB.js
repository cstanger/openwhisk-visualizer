// create design doc for performance query
const actsPrep = require('../actsPrep');

const nano2 = require('nano')(
  'http://whisk_admin:some_passw0rd@' +
    global.owDB.dbhost +
    ':5984/test_activations',
);

// inject CouchDB Index for performance improvement
if (global.asAdmin) {
  const indexDef = {
    index: { fields: ['name', 'end'] },
    name: 'owvisIndex',
    ddoc: 'owvis',
  };
  nano2
    .createIndex(indexDef)
    .then((result) => {})
    .catch((e) => console.log(e));
}

module.exports = async function actionRequest(owDB, action) {
  const query = {
    selector: {
      name: { $eq: action.name },
      end: { $gt: Number(action.lastFetch) },
    },
    use_index: ['owvis', 'owvisIndex'],
    execution_stats: true,
    limit: 100000,
    sort: [{ end: 'desc' }],
  };

  const body2 = await nano2.find(query);

  if (body2.docs.length) {
    const acts = await actsPrep(body2.docs);
    return acts;
  } else {
    return [];
  }
};

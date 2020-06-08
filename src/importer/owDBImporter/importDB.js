const dbInsert = require('../dbInsert');

const nano = require('nano')(
  'http://whisk_admin:some_passw0rd@' +
    global.owDB.dbhost +
    ':5984/test_whisks',
);

module.exports = async function fetchDB(params) {
  const q = {
    selector: {
      entityType: { $eq: 'action' },
    },
    limit: 200,
  };
  const response = await nano.find(q);
  await dbInsert(response.docs, params.owvisDB);
  return true;
};

const openwhisk = require('openwhisk');
const dbInsert = require('../dbInsert');

module.exports = async function owAPIimporter(param) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    const ow = openwhisk({
      apihost: param.owAPI.apihost,
      api_key: param.owAPI.api_key,
      ignore_certs: process.env.asAdmin ? true : false,
    });

    const actions = await ow.actions
      .list({ limit: 200 })
      .catch((e) => reject(e));
    const dbreturn = await dbInsert(actions, param.owvisDB).catch((e) =>
      reject(e),
    );
    resolve(dbreturn);
  });
};

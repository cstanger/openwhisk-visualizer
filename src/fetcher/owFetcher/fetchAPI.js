const actsPrep = require('../actsPrep');
const openwhisk = require('openwhisk');

/**
 * @param  {Object} owAPI OpenWhisk connection config
 * @param  {Object} action OpenWhisk Action Object
 */
module.exports = async function fetchInvocations(owAPI, action) {
  const ow = openwhisk({
    apihost: owAPI.apihost.concat(':443'),
    api_key: owAPI.api_key,
    ignore_certs: process.env.asAdmin ? true : false,
  });

  const MAX_ACTS = 20000; // max last activations
  let result = 99999999; // placeholder
  let acts = [];
  let skip = 0;

  while (!(result.length === 0 || acts.length >= MAX_ACTS)) {
    result = await ow.activations.list({
      limit: 200,
      name: [action.package, action.name].join('/'),
      docs: true,
      skip: skip,
      since: action.lastFetch || 0, // since: in new Date().getTime() - Only include entities later than this timestamp (measured in milliseconds since Thu, 01 Jan 1970)
    });
    acts = acts.concat(result);
    skip = skip + 200;
  }
  // Prepare each act (coldstart, Extract Metrices from Activation Logs (stdout))
  acts = await actsPrep(acts);
  return acts;
};

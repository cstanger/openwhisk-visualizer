const cron = require('node-cron');
const figlet = require('figlet');

// get from environmentVariable
global.croneTime = process.env.CRONJOB || undefined;

global.owvisDB = {
  host: process.env.OWVIS_DB_HOST || 'localhost',
  user: process.env.OWVIS_DB_USER || 'root',
  password: process.env.OWVIS_DB_PW || '1234',
  database: process.env.OWVIS_DB_NAME || 'owvis',
};

global.owAPI = {
  apihost: process.env.OPENWHWISK_API_HOST || undefined,
  api_key: process.env.OPENWHWISK_API_KEY || undefined,
};

global.owDB = {
  dbhost: process.env.COUCHDB_HOST || undefined,
  dbpw: process.env.COUCHDB_PW || undefined,
};

global.prometheusHost = process.env.PROMETHEUS_HOST || undefined;

global.benchmark = process.env.BENCHMARK || false;
global.totalActivations = 0

/**
 * Validate Configurations
 */
function validateConfig() {
  console.log(
    figlet.textSync('OWVIS', {
      font: 'Doh',
      horizontalLayout: 'default',
      verticalLayout: 'default',
    }),
  );
  if (global.croneTime && !cron.validate(global.croneTime)) {
    throw new Error('Please provide valid CronJob format');
  }
  if (!global.owAPI.apihost) {
    throw new Error('The OpenWhisk HOST address is mandatory');
  }
  if (!global.owAPI.api_key) {
    throw new Error('An OpenWhisk API KEY is mandatory');
  }
  if (global.owDB.dbhost && global.owDB.dbpw) {
    global.asAdmin = true;
    console.log('Executing within OpenWhisk Provider privileges');
  }
}

module.exports = validateConfig;

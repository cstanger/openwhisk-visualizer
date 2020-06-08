/* eslint-disable no-throw-literal */
/* eslint-disable require-jsdoc */

// import modules

const validateConfig = require('./shared/envVars');
const fileExporter = require('./shared/fileExporter');
const scrapePrometheus = require('./fetchPrometheus/scrapePrometheus');
const activationImporter = require('./importer/importer');
const activationFetcher = require('./fetcher/fetcher');
const generator = require('./generator/generator');
const edgeCalculator = require('./calculateEdges/calculateEdges');
const metricCalculator = require('./calculator/calculator');
const timeBenchmark = require('./shared/timeBenchmark');
const initWorkflow = require('./shared/jobHandler');

async function importer() {
  return await activationImporter({
    owAPI: global.owAPI,
    owvisDB: global.owvisDB,
    owDB: global.owDB,
  }).catch((e) => {
    throw { message: e, fn: 'Importer' };
  });
}

async function fetcher() {
  return await activationFetcher({
    owAPI: global.owAPI,
    owvisDB: global.owvisDB,
    owDB: global.owDB,
  }).catch((e) => {
    throw { message: e, fn: 'Fetcher' };
  });
}

async function calculator(params) {
  return await metricCalculator({ ...params, owvisDB: global.owvisDB }).catch(
    (e) => {
      throw { message: e, fn: 'calculator' };
    },
  );
}

async function edges(params) {
  return await edgeCalculator({ ...params, owvisDB: global.owvisDB }).catch(
    (e) => {
      throw { message: e, fn: 'Edge' };
    },
  );
}

async function prometheus(params) {
  if (global.prometheusHost) {
    return await scrapePrometheus({
      ...params,
      prometheusHost: global.prometheusHost,
    }).catch((e) => {
      throw { message: e, fn: 'prometheus scrape' };
    });
  } else {
    return params;
  }
}

/**
 * initiate one owvis workflow cycle
 */
async function workflowJob() {
  const start = new Date();
  let params = {};
  try {
    await importer();
    await fetcher();
    params = await generator(global.owvisDB);
    params = await edges(params);
    params = await calculator(params);
    params = await prometheus(params);
    await fileExporter(params);
  } finally {
    const end = new Date();
    console.log('Duration', (end - start) / 1000, 'sec');
    global.benchmark &&
      timeBenchmark((end - start) / 1000, global.totalActivations);
    global.totalActivations = 0;
  }
}

validateConfig();
initWorkflow(global.croneTime, workflowJob);

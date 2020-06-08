const mergeMetric = require('../shared/mergeMetric');
const cliProgress = require('cli-progress');
const http = require('http');
const querystring = require('querystring');

const p = new cliProgress.SingleBar(
  {
    format: 'Prometheus fetch [{bar}] {percentage}% | {value}/{total} | {fn}',
  },
  cliProgress.Presets.shades_classic,
);

module.exports = async function scrapePrometheus(param) {
  try {
    let { prometheusHost, ccJSON } = param;

    const metricsNames = (
      process.env.metrics ||
      'openwhisk_action_activations_total;openwhisk_action_coldStarts_total;openwhisk_action_duration_seconds_bucket;openwhisk_action_duration_seconds_count;openwhisk_action_duration_seconds_sum;openwhisk_action_initTime_seconds_bucket;openwhisk_action_initTime_seconds_count;openwhisk_action_initTime_seconds_sum;openwhisk_action_memory;openwhisk_action_response_size_bytes_bucket;openwhisk_action_response_size_bytes_count;openwhisk_action_response_size_bytes_sum;openwhisk_action_status;openwhisk_action_waitTime_seconds_bucket;openwhisk_action_waitTime_seconds_count;openwhisk_action_waitTime_seconds_sum'
    ).split(';');

    p.start(metricsNames.length, 0);

    const metrics = [];
    let i = 0;

    for (const m of metricsNames) {
      p.update(i++, { fn: m });
      metrics[m] = await fetchMetrics(prometheusHost, m);

      metrics[m].data.result.forEach((e) => {
        ccJSON = mergeMetric(
          ccJSON,
          e.metric.namespace.replace('.', '') + '/' + e.metric.action,
          {
            [m]: parseInt(e.value[1]),
          },
        );
      });
    }

    p.update(metricsNames.length, { fn: '' });
    p.stop();
    return { actions: param.actions, ccJSON };
  } catch (error) {
    p.stop();
    console.log('ERROR:', 'not able reach Prometheues', error);
    return { actions: param.actions, ccJSON: param.ccJSON };
  }
};

/**
 * @param  {string} prometheusHost Prometheus host address
 * @param  {string} metric name of a Prometheus metric
 * @return {JSON}
 */
function fetchMetrics(prometheusHost, metric) {
  return new Promise((resolve, reject) => {
    const query = {
      query: metric,
    };
    const request = {
      host: prometheusHost,
      port: 9090,
      path: '/api/v1/query?' + querystring.stringify(query),

      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    http
      .get(request, (resp) => {
        let data = '';

        resp.on('data', (chunk) => {
          data += chunk;
        });

        resp.on('end', () => {
          const metrics = JSON.parse(data);
          resolve(metrics);
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

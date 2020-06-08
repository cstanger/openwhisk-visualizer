// stdout METRIC Helpers
const findFromStdout = require('../shared/stdoutSearch');

const getMetric = (logs, metric, metricName) => {
  metricName = metricName || metric;
  const matches = findFromStdout(logs, 'OWVIS_METRIC', metric);

  return matches.length
    ? {
        [metricName]: matches[0].substr(39).split(' ')[2],
      }
    : undefined;
};

const getEdges = (act) => {
  let edge = [];
  if (act.kind === 'sequence' && act.response.success) {
    edge = act.logs;
  } else {
    const matches = findFromStdout(act.logs, 'FUNCTION_INVOKE');
    matches.forEach((i) => {
      edge.push(i.substr(39).split(' ')[1]);
    });
  }
  return edge;
};

module.exports = async function prepActs(acts) {
  for (const act of acts) {
    const initTime = act.annotations.find((x) => x.key === 'initTime');
    Object.assign(act, { initTime: initTime ? initTime.value : null });
    Object.assign(act, { coldstart: initTime ? 1 : 0 }); // coldstart 1; warmstart 0
    const waitTime = act.annotations.find((x) => x.key === 'waitTime');
    Object.assign(act, { waitTime: waitTime ? waitTime.value : null });
    const kind = act.annotations.find((x) => x.key === 'kind');
    Object.assign(act, { kind: kind ? kind.value : null });
    Object.assign(act, getMetric(act.logs, 'CPUTIME_SYSTEM', 'cpuSystem'));
    Object.assign(act, getMetric(act.logs, 'CPUTIME_USER', 'cpuUser'));
    Object.assign(act, getMetric(act.logs, 'MEMORY', 'memory'));
    Object.assign(act, getMetric(act.logs, 'INPUTHASH', 'inputHash'));
    Object.assign(act, getMetric(act.logs, 'OUTPUTHASH', 'outputHash'));
    Object.assign(act, { edges: getEdges(act) });
  }

  return acts;
};

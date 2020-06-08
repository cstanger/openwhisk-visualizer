var traverse = require('traverse');
/**
 * merge a metric to a OW Action within a given cc.JSON structure
 * @param  {ccJSON} ccJSON
 * @param  {string[]} qualifiledActionName
 * @param  {{metricName: value}} metrices
 * @return {ccJSON} new ccJSON with added metric
 */

const mergeMetric = function (ccJSON, qualifiledActionName, metrices) {
  traverse(ccJSON).forEach(function (node) {
    if (
      this.key == 'qualifiledName' &&
      this.parent.node.type == 'File' &&
      this.parent.node.hasOwnProperty('attributes')
    ) {
      // if(metrices.responseSize_varcoff=='null'){
      //   console.log(metrices)
      // }
      metrices = Object.entries(metrices).reduce(
        (a, [k, v]) => (v == null ? a : { ...a, [k]: v }),
        {},
      );
      if (node === qualifiledActionName) {
        this.parent.node.attributes = {
          ...this.parent.node.attributes,
          ...metrices,
        };
      } else {
        //create empty metrices

        Object.keys(metrices).forEach((key) => {
          if (!this.parent.node.attributes.hasOwnProperty(key)) {
            this.parent.node.attributes = {
              ...this.parent.node.attributes,
              [key]: 0,
            };
          }
        });
      }
    }
  });
  return ccJSON;
};

module.exports = mergeMetric;

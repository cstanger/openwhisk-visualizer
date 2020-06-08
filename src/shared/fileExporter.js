const fs = require('fs');

module.exports = async function fileExporter(param) {
  await fs.writeFileSync(
    'output/ow.cc.json',
    JSON.stringify(param.ccJSON),
    'utf8'
  );
  console.log('CCJSON written. done.');
};

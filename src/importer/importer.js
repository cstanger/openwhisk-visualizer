const owDBImporter = require('./owDBImporter/importDB');
const owAPIImporter = require('./owImporter/importAPI');
module.exports = async function activationImporter(params) {
  if (global.asAdmin === true) {
    await owDBImporter({
      owDB: params.owDB,
      owvisDB: params.owvisDB,
    }).catch((e) => {
      throw e;
    });
  } else {
    await owAPIImporter({
      owAPI: params.owAPI,
      owvisDB: params.owvisDB,
    }).catch((e) => {
      throw e;
    });
  }
};

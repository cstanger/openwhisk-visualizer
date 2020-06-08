const http = require('http');

module.exports = function actionRequest(owDB, lastFetch) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      selector: {
        start: {
          $gte: 1,
        },
      },
      skip: 0,
    });

    const request = {
      host: owDB.dbhost,
      port: 5984,
      method: 'POST',
      path: '/test_activations/_find',
      headers: {
        Authorization: 'Basic ' + owDB.dbpw,
        'Content-Length': Buffer.byteLength(postData),
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(request, (resp) => {
      let data = '';

      resp.on('data', (chunk) => {
        data += chunk;
      });
      resp.on('end', async () => {
        resolve(JSON.parse(data).docs);
      });
    });

    req.on('error', (e) => {
      reject(e);
    });
    req.write(postData);
    req.end();
  });
};

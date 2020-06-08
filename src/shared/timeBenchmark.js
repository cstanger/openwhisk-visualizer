const fs = require('fs');
const mariadb = require('mariadb');

module.exports = async function fileExporter(duration, number) {
  await fs.appendFileSync(
    'output/benchmark.txt',
    `Bench;${number};${duration}\n`,
    'utf8'
  );
  // deleteActivations()
};




//This can be used to create benchmarks for the execution durtion
// const items =[0,1,2,3,5,10,50,100,200,500,1000,1200,1500, 1800,2000, 2500, 3000, 3500, 5000]

// async function  deleteActivations(){

//     const owvisDB = global.owvisDB
//     const pool = mariadb.createPool({
//         host: owvisDB.host,
//         user: owvisDB.user,
//         password: owvisDB.password,
//         database: owvisDB.database,
//         connectionLimit: 5,
//       });
//       let conn = {};
//       try {
//         conn = await pool.getConnection();

//         const sql1 = "Delete from activations where qualifiedName like 'guest/DemoFunctions/randomOutput' order by  end desc limit ?;";

//         const sql2 = "Update functions Set lastFetch=(select end from activations where qualifiedName like 'guest/DemoFunctions/randomOutput' order by end desc limit 1 ) where qualifiedName='guest/DemoFunctions/randomOutput';";

//         await conn.query(sql1, [items[Math.floor(Math.random() * items.length)]]);
//         await conn.query(sql2);


//       } finally {
//         conn.end && conn.end();
//         pool.end();
//       }
// }
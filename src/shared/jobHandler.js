const cron = require('node-cron');

module.exports = function initWorkflow(croneTime, workflowJob) {
  if (croneTime) {
    let i = 0;
    const job = cron.schedule(croneTime, async () => {
      console.log('######################');
      console.log('Running Job @ ', new Date());
      job.stop();

      await workflowJob().catch((err) => {
        console.log('An Error occured at ', err.fn);
        console.log(err.message);
        console.log('Retry', i++);
      });
      if (i < 3) {
        job.start();
      } else {
        console.log('To many failures - Stop');
        process.stdin.resume();
      }
    });
  } else {
    console.log('Running owvis @', new Date());
    workflowJob().catch((err) => {
      console.log('An Error occured at ', err.fn);
      console.log(err.message);
    });
  }
};

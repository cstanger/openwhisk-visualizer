const queries = [
  // Generell (toal, cold, success, error )
  `SELECT qualifiedName, 
      count(qualifiedName) as activations_total, 
      sum(success) as activations_success,
      (count(qualifiedName)-sum(success)) as activations_error,
      (sum(success)/count(qualifiedName))*100 as activations_successRate
    FROM activations GROUP By qualifiedName;`,
  // costs,
  `SELECT activations.qualifiedName, 
      duration*count(activations.qualifiedName) as costs_total_without_memory,
      duration*count(activations.qualifiedName)*memoryLimit as costs_total
    FROM activations
    Join functions on activations.qualifiedName = functions.qualifiedName GROUP By activations.qualifiedName;`,
  // AVG and VarCoff: Duration
  `SELECT qualifiedName, 
      AVG(duration) as duration_avg,
      STDDEV(duration) / AVG(duration) as duration_std,
      AVG(initTime) as initTime_avg,
      STDDEV(initTime) / AVG(initTime) as initTime_std,
      AVG(waitTime) as waitTime_avg,
      STDDEV(waitTime) / AVG(waitTime) as waitTime_std,
      AVG(responseSize) as responseSize_avg,
      STDDEV(responseSize) / AVG(responseSize) as responseSize_std
    FROM activations GROUP By qualifiedName;`,

  // AVG and VarCoff: Duration COLDSTART
  `SELECT qualifiedName, 
        count(qualifiedName) as activations_coldstart, 
        AVG(duration) as duration_avg_coldstart,
        STDDEV(duration) / AVG(duration) as duration_std_coldstart,
        AVG(waitTime) as waitTime_avg_coldstart,
        STDDEV(waitTime) / AVG(waitTime) as waitTime_std_coldstart
      FROM activations 
      Where coldstart = 1
      GROUP By qualifiedName;`,

  // AVG and VarCoff: Duration WARMSTART
  `SELECT qualifiedName, 
        count(qualifiedName) as activations_warmstart, 
        AVG(duration) as duration_avg_warmstart,
        STDDEV(duration) / AVG(duration) as duration_std_warmstart,
        AVG(waitTime) as waitTime_avg_warmstart,
        STDDEV(waitTime) / AVG(waitTime) as waitTime_std_warmstart
      FROM activations 
      Where coldstart = 0
      GROUP By qualifiedName;`,

  // Input output Varianze
  `SELECT qualifiedName, 
      count(DISTINCT inputHash) as inputHash_var, 
      count(DISTINCT outputHash) as outputHash_var 
    FROM activations  
    Where inputHash not like '' and outputHash not like ''   
    GROUP by qualifiedName;`,

  // Input output Relation
  `Select counter.qualifiedName, 
        SUM(IF(outvar = 1, 1, 0))/ count(inputHash)*100 as 'deterministic',
        duration_avg*SUM(IF(outvar = 1, 1, 0))/ count(inputHash) AS 'caching_potential_in_duration'
        FROM(  Select qualifiedName, inputHash, count(*) as inputTry, count(DISTINCT outputHash) as outvar  
                FROM activations 
                Where inputHash not like '' and outputHash not like ''
                group by  qualifiedName, inputHash) as counter 
        JOIN (SELECT qualifiedName, 
            AVG(duration) as duration_avg
             FROM activations 
             WHERE inputHash not like '' and coldstart = 0
             GROUP By qualifiedName) as duration
        ON duration.qualifiedName = counter.qualifiedName
        Where inputTry >1
        group by qualifiedName;`,

  // // TEST
  // `Select DISTINCT qualifiedName, PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY duration) OVER (PARTITION BY qualifiedName) as duration_90percentile FROM activations;`,

  // Function Oversizing
  `select activations.qualifiedName as qualifiedName,  
        ROUND((f.memoryLimit-avg(memory))/f.memoryLimit*100,2) as memory_oversized_perc, 
        ROUND(f.memoryLimit-avg(memory),0) as  memory_oversized_avg, 
        ROUND(avg((f.memoryLimit-memory)*duration),0) as costs_oversized_avg 
        from activations 
        JOIN functions as f ON activations.qualifiedName = f.qualifiedName
        where  memory >0 group by activations.qualifiedName;`,

  // // Function warmer
  `select t.qualifiedName, ROUND(avg(t.delta)/1000/60,0) as coldstart_timelag,  coldstart_ratio
        from (select qualifiedName, start, start-lag(start,1) over (PARTITION BY qualifiedName ORDER by start) as delta from activations where coldstart=1 and success=1 order by start DESC) as t
        JOIN (SELECT qualifiedName, 
                    sum(coldstart)/count(qualifiedName)*100 as coldstart_ratio
                    FROM activations 
                    GROUP By qualifiedName) as s
                ON s.qualifiedName = t.qualifiedName
        group by qualifiedName;`,
  // `select qualifiedName, sum(initTime) as total_initTime, sum(coldstart)/count(qualifiedName)*100 as coldstatratio from activations group by qualifiedName;`,
  `select t.qualifiedName, ROUND(avg(t.delta)/1000/60,0) as coldstart_timelag2,  coldstart_ratio2
  from (select * from (select qualifiedName,coldstart, start, start-lag(start,1) over (PARTITION BY qualifiedName ORDER by start) as delta from activations where success=1 order by qualifiedName, start DESC) as t where coldstart=1) as t
  JOIN (SELECT qualifiedName, 
              sum(coldstart)/count(qualifiedName)*100 as coldstart_ratio2
              FROM activations 
              GROUP By qualifiedName) as s
          ON s.qualifiedName = t.qualifiedName
  group by qualifiedName;`,
];

module.exports = queries;

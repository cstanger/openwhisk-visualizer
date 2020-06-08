//stdout Helpers
module.exports = findFromStdout = (logs, indicator, include) => {
  const matches = logs.filter(
    line =>
      line.length > 38 &&
      line.substr(39, indicator.length) === indicator &&
      (include ? line.substr(39).includes(include) : true)
  );
  return matches;
};

//   "2020-02-27T14:38:30.874462527Z stdout: METRIC guest.benchmark/primeNumberNoCaching1.aeee2835928f40d5ae2835928f10d54e.coldstart 0 1582814310"
//   "2020-02-28T08:24:31.860663086Z stdout: FUNCTION_INVOKE testfunctions/hello [object Object]"

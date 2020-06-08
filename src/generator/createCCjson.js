/**
 * Construct ccJSON nodes for visualization in Code Charta
 * @param  {OpenWhiskActions[]} actions
 * @param  {ccJSON Template} ccJSON
 * @return {ccJSON}
 */

const formator = function (actions, ccJSONTemplate) {
  const actionsList = [];
  const ccJSON = JSON.parse(JSON.stringify(ccJSONTemplate));
  const input = ccJSON.nodes[0].children;
  // get data and transform
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    const newAction = {
      name: action.name,
      functionName: action.name.concat(getFileExtention(action.execEnv)),
      qualifiledName: action.qualifiedName,
      type: 'File',
      id: i,
      attributes: {
        setting_timeout: action.timeoutLimit,
        setting_logs: action.logLimit,
        memory_limit: action.memoryLimit,
      },
      link: '',
      description: action.description || 'No description available',
    };

    actionsList.push(action.qualifiedName);

    let owNamespace = input.find(
      (namespace) =>
        namespace.name == action.namespace && namespace.type == 'Folder',
    );
    if (!owNamespace) {
      owNamespace = {
        name: action.namespace,
        type: 'Folder',
        attributes: {},
        children: [
          {
            name: action.package,
            type: 'Folder',
            attributes: {},
            children: [newAction],
          },
        ],
      };
      input.push(owNamespace);
      continue;
    }

    if (action.package !== '') {
      let owPackage = owNamespace.children.find(
        (owPackage) =>
          owPackage.name == action.package && owPackage.type == 'Folder',
      );
      if (!owPackage) {
        owPackage = {
          name: action.package,
          type: 'Folder',
          attributes: {},
          children: [newAction],
        };
        owNamespace.children.push(owPackage);
      } else {
        owPackage.children.push(newAction);
      }
    } else {
      owNamespace.children.push(newAction);
    }
  }

  console.log(actionsList.length, 'Actions found.');
  return { ccJSON, actions: actionsList };
};

/**
 * @param  {string} execEnv function runtime
 * @return {string} file type extension
 */
function getFileExtention(execEnv) {
  if (execEnv.includes('node')) {
    return '.js';
  }
  if (execEnv.includes('python')) {
    return '.py';
  }
  return '';
}

module.exports = formator;

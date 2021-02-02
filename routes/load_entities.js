const fs = require('fs');
const path = require('path');

const dbFilePath = '../public/resources/json/entity_types.json';
var rawData = fs.readFileSync(path.resolve(__dirname, dbFilePath));
var config = JSON.parse(rawData);

exports.loadDefaultEntities = function() {
  let entities = {};
  
  for (id in config.entity_types) {
    let entityType = config.entity_types[id];

    for (let i = 0; i < entityType.length; i++) {
      entities[entityType.type + '_' + i] = {
        id: entityType.type + '_' + i,
        index: i,
        type: entityType.type,
        x: config.default_vars.x,
        y: config.default_vars.y,
        gridSpacing: entityType.gridSpacing,
        hasReverse: entityType.hasReverse,
        canStack: entityType.canStack,
        location: config.default_vars.location,
        permission: entityType.permission,
        owner: config.default_vars.owner,
        stateChange: false
      }
    }
  }
  
  return entities;
};
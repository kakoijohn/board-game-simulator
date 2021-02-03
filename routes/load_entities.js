const fs = require('fs');
const path = require('path');

const dbFilePath = '../public/resources/json/entity_types.json';
var rawData = fs.readFileSync(path.resolve(__dirname, dbFilePath));
var config = JSON.parse(rawData);

exports.loadDefaultEntities = function() {
  let entities = {};
  
  for (let index in config.default_entities) {
    let id = config.default_entities[index];
    let entityType = config.entity_types[id];

    for (let i = 0; i < entityType.length; i++) {
      entities[entityType.type + '_' + i] = {
        id: entityType.type + '_' + i,
        index: i,
        type: entityType.type,
        x: config.default_entity_vars.x,
        y: config.default_entity_vars.y,
        gridSpacing: entityType.gridSpacing,
        hasReverse: entityType.hasReverse,
        canStack: entityType.canStack,
        homeLocation: entityType.home,
        location: config.default_entity_vars.location,
        permission: entityType.permission,
        owner: config.default_entity_vars.owner,
        stateChange: false
      }
    }
  }
  
  return entities;
};
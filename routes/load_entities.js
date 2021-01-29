const fs = require('fs');
const path = require('path');

const dbFilePath = 'entity_types.json';
var rawData = fs.readFileSync(path.resolve(__dirname, dbFilePath));
var jsonEntities = JSON.parse(rawData);

exports.loadDefaultEntities = function() {
  let entities = {};
  
  for (id in jsonEntities.entity_types) {
    let entityType = jsonEntities.entity_types[id];
    let ct = 0;
    
    entities[entityType.type + '_' + ct] = {
      id: entityType.type + '_' + ct,
      index: ct,
      type: entityType.type,
      x: 0,
      y: 0,
      gridSpacing: entityType.gridSpacing,
      hasReverse: entityType.hasReverse,
      canStack: entityType.canStack,
      onTable: false,
      requireAdmin: entityType.requireAdmin,
      isGlobalObject: entityType.isGlobalObject,
      stateChange: false
    }
    
    ct++;
  }
  
  return entities;
};
const fs = require('fs');
const path = require('path');

const dbFilePath = '../public/resources/json/entity_types.json';
var rawData = fs.readFileSync(path.resolve(__dirname, dbFilePath));
var config = JSON.parse(rawData);

exports.loadDefaultGlobalEntities = function() {
  let entities = {};
  
  for (let index in config.default_global_entities) {
    let id = config.default_global_entities[index];
    let entityType = config.entity_types[id];
    let elements = config.entity_types[id].elements;
    
    loadEntities(entities, id, entityType, elements);
  }
  
  return entities;
};

function loadEntities(entities, id, entityType, elements) {
  for (let i = 0; i < entityType.length * elements; i++) {
    for (let j = 0; j < elements; j++) {
      entities[entityType.type + '_' + i + '_' + j] = loadEntity(entityType, i, j);
    }
  }
}

function loadEntity(entityType, i, j) {
  let entity = {
    id: entityType.type + '_' + i + '_' + j,
    index: i,
    position: (i * j) + j, // position of entity in the stack (if it can stack)
    element: j,
    type: entityType.type,
    x: config.default_entity_vars.x,
    y: config.default_entity_vars.y,
    gridSpacing: entityType.gridSpacing,
    hasReverse: entityType.hasReverse,
    canStack: entityType.canStack,
    homeLoc: entityType.homeLoc,
    location: entityType.homeLoc, // spawn the entity at its home by default
    permission: entityType.permission,
    owner: config.default_entity_vars.owner,
    stateChange: true
  }
  
  return entity;
}

exports.getChangedEntities = function(entities) {
  let changedEntities = {};
  for (let id in entities) {
    if (entities[id].stateChange) {
      changedEntities[id] = simplifyEntity(entities[id]);
      entities[id].stateChange = false;
    }
  }
  
  return changedEntities;
};

exports.getAllSimpEntities = function(entities) {
  let cleanEntities = {};
  for (let id in entities) {
    cleanEntities[id] = simplifyEntity(entities[id]);
  }
  
  return cleanEntities;
};

function simplifyEntity(entity) {
  return {
    id: entity.id,
    index: entity.index,
    element: entity.element,
    type: entity.type,
    x: entity.x,
    y: entity.y,
    location: entity.location,
    owner: entity.owner,
  };
};

exports.getTableLoc = function() {
  return 1; //TODO load this from the config file, not hard coded
};

exports.getTopEntityInStack = function(entities, type) {
  let length = config.entity_types[type].length;
  let elements = config.entity_types[type].elements;
  let topIndex = {
    val: length,
    i: 0,
    j: 0
  }
  
  for (let i = 0; i < length; i++) {
    for (let j = 0; j < elements; j++) {
      let entity = entities[type + '_' + i + '_' + j];
      
      if (entity.location == entity.homeLoc || entity.location == 0) {
        if (entity.position < topIndex.val) {
          topIndex.val = entity.position;
          topIndex.i = i;
          topIndex.j = j;
        }
      }
    }
  }
  
  if (topIndex.val == length)
    return -1;
  else
    return type + '_' + topIndex.i + '_' + topIndex.j;
};
const fs = require('fs');
const path = require('path');

const dbFilePath = '../public/resources/json/entity_types.json';
var rawData = fs.readFileSync(path.resolve(__dirname, dbFilePath));
var config = JSON.parse(rawData);

exports.appendDefaultGlobalEntities = function(entities) {
  for (let index in config.default_global_entities) {
    let owner = config.default_entity_vars.owner;
    let id = config.default_global_entities[index];
    let entityType = config.entity_types[id];
    let multiplier = config.entity_types[id].multiplier;
    
    appendEntities(entities, owner, entityType, multiplier);
  }
};

exports.appendDefaultPlayerEntities = function(entities, playerID) {
  for (let index in config.default_player_entities) {
    let id = config.default_player_entities[index];
    let entityType = config.entity_types[id];
    let multiplier = config.entity_types[id].multiplier;
    
    appendEntities(entities, playerID, entityType, multiplier);
  }
}

function appendEntities(entities, owner, entityType, multiplier) {
  let type = entityType.type;
  
  if (config.metadata.entities[type] == undefined) {
    config.metadata.entities[type] = {
      currCount: 0,
      currJ: 0
    }
  }
  
  let ct = config.metadata.entities[type].currCount + 1;
  let jStart = config.metadata.entities[type].currJ;
  
  for (let i = 0; i < entityType.length; i++) {
    for (let j = jStart; j < (multiplier + jStart); j++, ct++) {
      entities[type + '_' + i + '_' + j] = loadEntity(owner, entityType, i, j, ct);
    }
  }
  
  config.metadata.entities[type].currCount = ct;
  config.metadata.entities[type].currJ += multiplier;
}

function loadEntity(owner, entityType, i, j, ct) {
  let entity = {
    id: entityType.type + '_' + i + '_' + j,
    index: i,
    position: ct, // position of entity in the stack (if it can stack)
    multiplier: j,
    type: entityType.type,
    x: config.default_entity_vars.x,
    y: config.default_entity_vars.y,
    rotation: config.default_entity_vars.rotation,
    location: entityType.homeLoc, // spawn the entity at its home by default
    owner: owner,
    stateChange: true
  }
  
  return entity;
}

exports.getChangedEntities = function(entities) {
  let changedEntities = {};
  for (let id in entities) {
    if (entities[id].stateChange) {
      changedEntities[id] = entities[id];
      entities[id].stateChange = false;
    }
  }
  
  return changedEntities;
};

exports.getTableLoc = function() {
  return 1; //TODO load this from the config file, not hard coded
};

exports.getTopEntityInStack = function(entities, type) {
  let length = config.entity_types[type].length;
  let multiplier = config.entity_types[type].multiplier;
  let topIndex = {
    val: length,
    i: 0,
    j: 0
  }
  
  for (let i = 0; i < length; i++) {
    for (let j = 0; j < multiplier; j++) {
      let entity = entities[type + '_' + i + '_' + j];
      
      if (entity.location == config.entity_types[type].homeLoc || entity.location == 0) {
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

exports.shuffleStack = function(entities, type, iterations) {
  let jLength = config.metadata.entities[type].currJ;
  let iLength = config.entity_types[type].length;
  
  for (let ct = 0; ct < iterations; ct++) {
    let randJ1 = Math.floor(Math.random() * jLength);
    let randJ2 = Math.floor(Math.random() * jLength);
    
    let randI1 = Math.floor(Math.random() * iLength);
    let randI2 = Math.floor(Math.random() * iLength);
    
    let id1 = type + '_' + randI1 + '_' + randJ1;
    let id2 = type + '_' + randI2 + '_' + randJ2;
    
    // swap
    let tmpPos = entities[id1].position;
    entities[id1].position = entities[id1].position;
    entities[id2].position = tmpPos;
  }
};

exports.getPermissionLvl = function(type) {
  return config.entity_types[type].permission;
}

exports.canRotate = function(type) {
  return config.entity_types[type].canRotate;
}

exports.getRotStep = function(type) {
  return config.entity_types[type].rotStep;
}

exports.getHomeLoc = function(type) {
  return config.entity_types[type].homeLoc;
}
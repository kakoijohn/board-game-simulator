let config;
// load the entity_types config file into json
$(document).ready(function() {
  $.getJSON("resources/json/entity_types.json", function(json) {
    // console.log(json);
    config = json;
  });
});

function loadEntities(entities) {
  for (let id in entities) {
    let entity = entities[id];
    
    console.log('spawning entity');
    spawnNewEntity(entity);
  }
}

function spawnNewEntity(entity) {
  spawnEntityOnTable(entity, false);
  spawnEntityAtHome(entity, true);
}

function spawnEntityOnTable(entity, isVisible) {
  let index = entity.index;
  let loc = config.locations[1].name;
  let htmlID = loc + '_' + entity.id;
  let filePath = config.entity_types[entity.type].path;
  let fileName = config.entity_types[entity.type].files[index];
  let width  = config.entity_types[entity.type].width;
  let height = config.entity_types[entity.type].height;
  
  $('#table').append('<div class=\"entity\" id=\"' + htmlID +  '\"></div>');
  $('#' + htmlID).css('background-image', 'url(' + filePath + fileName + ')');
  $('#' + htmlID).css('width',  width);
  $('#' + htmlID).css('height', height);
  $('#' + htmlID).css('left', entity.x + 'px');
  $('#' + htmlID).css('top',  entity.y + 'px');
  
  if (!isVisible)
    $('#' + htmlID).css('display', 'none');
}

function spawnEntityAtHome(entity, isVisible) {
  let index = entity.index;
  let homeLocIndex = config.entity_types[entity.type].homeLoc;
  let homeLoc = config.locations[homeLocIndex].name;
  let htmlID = homeLoc + '_' + entity.id;
  let filePath = config.entity_types[entity.type].path;
  let fileName = config.entity_types[entity.type].files[index];
  
  $('#' + homeLoc).append('<div class=\"item\" id=\"' + htmlID +  '\">'
                          + '<div class=\"num_box\"></div></div>');
  
  $('#' + htmlID).css('background-image', 'url(' + filePath + fileName + ')');
  
  if (!isVisible)
    $('#' + htmlID).css('display', 'none');
}

// swap the entity from the table to the hand
function updateEntityLocation(entity) {
  let location = entity.location;
  
  let homeLocIndex = config.entity_types[entity.type].homeLoc;
  let homeLoc = config.locations[homeLocIndex].name;
  
  if (location == 'table') {
    // if the location is the table, move it to home
    entityToTable(entity, homeLoc);
  } else {
    // if the location is home, move it to the table
    entityToHome(entity, homeLoc);
  }
}

function entityToTable(entity, homeLoc) {
  $('#' + 'table_' + entity.id).css('display', '');
  $('#' + homeLoc + '_' + entity.id).css('display', 'none');
}

function entityToHome(entity, homeLoc) {
  $('#' + 'table_' + entity.id).css('display', 'none');
  $('#' + homeLoc + '_' + entity.id).css('display', '');
}

function entityIsHome(entity) {
  let location = entity.location;
  
  let homeLocIndex = config.entity_types[entity.type].homeLoc;
  let homeLoc = config.locations[homeLocIndex].name;
  
  return (location == homeLoc);
}

function despawnAllEntities() {
  $('.entity').remove();
  $('.item').remove();
}

function getGridSpacing(entityType) {
  return config.entity_types[entityType].gridSpacing;
}
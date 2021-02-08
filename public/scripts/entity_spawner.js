let config;
let tableLoc = -1;
// load the entity_types config file into json
$(document).ready(function() {
  $.getJSON("resources/json/entity_types.json", function(json) {
    // console.log(json);
    config = json;
    
    for (let i = 0; i < config.locations.length; i++) {
      if (config.locations[i].refName == 'table') {
        tableLoc = i;
        break;
      }
    }
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
  let entityOnTable = (entity.location == tableLoc);
  spawnEntityOnTable(entity, entityOnTable);
  spawnEntityAtHome(entity, !entityOnTable);
}

function spawnEntityOnTable(entity, isVisible) {
  let index = entity.index;
  let loc = tableLoc;
  let locName = config.locations[loc].refName;
  let htmlID = loc + '_' + entity.id;
  let filePath = config.entity_types[entity.type].path;
  let fileName = config.entity_types[entity.type].files[index];
  let width  = config.entity_types[entity.type].width;
  let height = config.entity_types[entity.type].height;
  
  $('#' + locName).append('<div class=\"entity\" id=\"' + htmlID +  '\"></div>');
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
  let homeLoc = config.entity_types[entity.type].homeLoc;
  let homeLocName = config.locations[homeLoc].refName;
  let htmlID = homeLoc + '_' + entity.id;
  let filePath = config.entity_types[entity.type].path;
  let fileName = config.entity_types[entity.type].files[index];
  
  $('#' + homeLocName).append('<div class=\"item\" id=\"' + htmlID +  '\">'
                          + '<div class=\"num_box\"></div></div>');
  
  $('#' + htmlID).css('background-image', 'url(' + filePath + fileName + ')');
  
  if (!isVisible)
    $('#' + htmlID).css('display', 'none');
}

// swap the entity from the table to the hand
function updateEntityLocation(entity) {
  let location = entity.location;
  let homeLoc = config.entity_types[entity.type].homeLoc;
  if (location == tableLoc) {
    // if the location is the table, move it to home
    entityToTable(entity, homeLoc);
  } else {
    // if the location is home, move it to the table
    entityToHome(entity, homeLoc);
  }
}

function entityToTable(entity, homeLoc) {
  $('#' + tableLoc + '_' + entity.id).css('display', '');
  $('#' + homeLoc  + '_' + entity.id).css('display', 'none');
}

function entityToHome(entity, homeLoc) {
  $('#' + tableLoc + '_' + entity.id).css('display', 'none');
  $('#' + homeLoc  + '_' + entity.id).css('display', '');
}

function entityIsHome(entity) {
  let location = entity.location;
  let homeLoc = config.entity_types[entity.type].homeLoc;
  
  return (location == homeLoc || location == 0);
}

function despawnAllEntities() {
  $('.entity').remove();
  $('.item').remove();
}

function getGridSpacing(entityType) {
  return config.entity_types[entityType].gridSpacing;
}
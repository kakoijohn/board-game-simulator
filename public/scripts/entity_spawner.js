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
  spawnEntityOnTable(entity, true);
  spawnEntityInInventory(entity, true);
}

function spawnEntityOnTable(entity, isVisible) {
  let index = entity.index;
  let loc = config.locations[1].name;
  let filePath = config.entity_types[entity.type].path;
  let fileName = config.entity_types[entity.type].files[index];
  let width  = config.entity_types[entity.type].width;
  let height = config.entity_types[entity.type].height;
  
  $('#table').append('<div class=\"entity\" id=\"' + loc + '_' + entity.id +  '\"></div>');
  $('#' + loc + '_' + entity.id).css('background-image', 'url(' + filePath + fileName + ')');
  $('#' + loc + '_' + entity.id).css('width',  width);
  $('#' + loc + '_' + entity.id).css('height', height);
  $('#' + loc + '_' + entity.id).css('left', entity.x + 'px');
  $('#' + loc + '_' + entity.id).css('top',  entity.y + 'px');
  
  if (!isVisible)
    $('#table_' + entity.id).css('display', 'none');
}

function spawnEntityInInventory(entity, isVisible) {
  $('#inventory').append(
    '<div class=\"item\" id=\"inventory_' + entity.id +  '\">' +
    '<div class=\"num_box\"></div></div>');
  
  let index = entity.index;
  let filePath = config.entity_types[entity.type].path;
  let fileName = config.entity_types[entity.type].files[index];
  
  $('#inventory_' + entity.id).css('background-image', 'url(' + filePath + fileName + ')');
  
  if (!isVisible)
    $('#inventory_' + entity.id).css('display', 'none');
}

// swap the entity from the table to the hand
function swapEntityLocation(entity) {
  
}

function spawnEntityInHand(entity) {
  $('#inventory').append(
    '<div class=\"item\" id=\"hand_' + entity.id +  '\">' +
    '<div class=\"num_box\"></div></div>');
  
  let index = entity.index;
  let filePath = config.entity_types[entity.type].path;
  let fileName = config.entity_types[entity.type].files[index];
  
  $('#hand_' + entity.id).css('background-image', 'url(' + filePath + fileName + ')');
  
  if (!isVisible)
    $('#hand_' + entity.id).css('display', 'none');
}

function despawnAllEntities() {
  $('.entity').remove();
  $('.item').remove();
}

function getGridSpacing(entityType) {
  return config.entity_types[entityType].gridSpacing;
}
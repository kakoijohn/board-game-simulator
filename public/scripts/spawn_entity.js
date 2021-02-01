let config;
$.getJSON("resources/json/entity_types.json", function(json) {
  console.log(json);
  config = json;
});

function spawnNewEntity(entity) {
  spawnEntityOnTable(entity, false);
  spawnEntityInInventory(entity, true);
}

function spawnEntityOnTable(entity, isVisible) {
  $('#table').append('<div class=\"entity\" id=\"table_' + entity.id +  '\"></div>');
  
  let index = entity.index;
  let filePath = config.entity_types[entity.type].path;
  let fileName = config.entity_types[entity.type].files[index];
  
  $('#' + entity.id).css('background', 'url(' + filePath + fileName + ')');
  
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
  
  $('#' + entity.id).css('background', 'url(' + filePath + fileName + ')');
  
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
  
  $('#' + entity.id).css('background', 'url(' + filePath + fileName + ')');
  
  if (!isVisible)
    $('#hand_' + entity.id).css('display', 'none');
}
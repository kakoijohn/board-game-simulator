let entityType;
$.getJSON("resources/json/entity_types.json", function(json) {
  console.log(json);
  entityType = json;
});

function spawnEntityOnTable(entity, isVisible) {
  $('#table').append('<div class=\"entity\" id=\"' + entity.id +  '\"></div>');
  
  let index = entity.index;
  let filePath = entityType[entity.type].path;
  let fileName = entityType[entity.type].files[index];
  
  $('#' + entity.id).css('background', 'url(' + filePath + fileName + ')');
}

function spawnEntityInInventory(entity, isVisible) {
  
}

// swap the entity from the table to the hand
function swapEntityLocation(entity) {
  
}

function spawnEntityInHand(entity) {
  
}
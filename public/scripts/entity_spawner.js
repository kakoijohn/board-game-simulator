let config;
let tableLoc = 1;
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
    
    if (!entityExistsOnTable(entity)) {
      // if this is a new entity to us, spawn it
      spawnNewEntity(entity);
    }
  }
}

function spawnNewEntity(entity) {
  spawnEntityOnTable(entity);
  spawnEntityAtHome(entity);
}

function spawnEntityOnTable(entity) {
  let index = entity.index;
  let locName = config.locations[tableLoc].refName;
  let homeLoc = config.entity_types[entity.type].homeLoc;
  let htmlID = tableLoc + '_' + entity.id;
  let filePath = config.entity_types[entity.type].path;
  let fileName = config.entity_types[entity.type].files[index];
  let width  = config.entity_types[entity.type].width;
  let height = config.entity_types[entity.type].height;
  
  $('#' + locName).append('<div class=\"entity\" id=\"' + htmlID +  '\"></div>');
  applyBGImage(htmlID, (filePath + fileName), entity.type);
  $('#' + htmlID).css('width',  width);
  $('#' + htmlID).css('height', height);
  $('#' + htmlID).css('left', entity.x + 'px');
  $('#' + htmlID).css('top',  entity.y + 'px');
  
  if (entity.location != tableLoc)
    $('#' + htmlID).css('display', 'none');
}

function spawnEntityAtHome(entity) {
  if (!canManipulateEntity(entity)) {
    // if we are not allowed to manipulate this entity,
    // don't spawn a placeholder at home
    return;
  }
  
  let index = entity.index;
  let homeLoc = config.entity_types[entity.type].homeLoc;
  let homeLocName = config.locations[homeLoc].refName;
  let htmlID = '';
  
  let file = '';
  let reversePath = config.entity_types[entity.type].reverse;
  if (reversePath != undefined && reversePath != '') {
    // if the entity has a reverse side, make the background image
    // the reverse while it is at home.
    file = reversePath;
  } else {
    // else make the background image the same as when its on the table
    let filePath = config.entity_types[entity.type].path;
    let fileName = config.entity_types[entity.type].files[index];
    
    file = filePath + fileName;
  }
  
  let canStack = config.entity_types[entity.type].canStack;
  if (canStack) {
    htmlID = homeLoc + '_' + entity.type + '_s'; // s for stack
    
    if ($('#' + htmlID).length == 0) {
      // if we are the first in the stack
      $('#' + homeLocName).append('<div class=\"item\" id=\"' + htmlID +  '\">'
      + '<div class=\"num_box\"><span>0</span></div></div>');
      
      applyBGImage(htmlID, file, entity.type);
      
      $('#' + htmlID).css('display', 'none');
    }
    
    if (entity.location == homeLoc) {
      // if our item is at home currently, add one to the stack count
      let currStackTot = parseInt($('#' + htmlID + ' .num_box span').text());
      $('#' + htmlID + ' .num_box span').text(currStackTot + 1);
      
      $('#' + htmlID).css('display', '');
    }
  } else {
    // if the entity cannot be stacked
    htmlID = homeLoc + '_' + entity.id;
    
    $('#' + homeLocName).append('<div class=\"item\" id=\"' + htmlID +  '\">'
                            + '<div class=\"num_box\"></div></div>');
    
    applyBGImage(htmlID, file, entity.type);
    
    if (entity.location == tableLoc)
      $('#' + htmlID).css('display', 'none');
  }
  
}

function applyBGImage(htmlID, file, type) {
  let editable = config.entity_types[type].editable;
  
  if (editable) {
    // if the image itself has any player-specific configurable parameters
    
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function () {
    if (rawFile.readyState === 4) {
      if (rawFile.status === 200 || rawFile.status == 0) {
        var allText = rawFile.responseText;
          alert(allText);
        }
      }
    }
  } else {
    // if not, just apply the file as a css background-image
    $('#' + htmlID).css('background-image', 'url(' + file + ')');
  }
}

function moveEntity(entity) {
  $('#' + tableLoc + '_' + entity.id).css('left', entity.x + 'px');
  $('#' + tableLoc + '_' + entity.id).css('top', entity.y + 'px');
}

// swap the entity from the table to the hand
function updateEntityLocation(entity) {
  let location = entity.location;
  let homeLoc = config.entity_types[entity.type].homeLoc;
  if (location == tableLoc) {
    // if the location is the table, move it to home
    entityToTable(entity, homeLoc);
    if (config.entity_types[entity.type].canStack) {
      // if the entity is a stack, subtract one from the stack
      updateEntityStack(-1, entity.type, homeLoc);
    }
  } else {
    // if the location is home, move it to the table
    entityToHome(entity, homeLoc);
    if (config.entity_types[entity.type].canStack) {
      // if the entity is a stack, add one to the stack
      updateEntityStack(1, entity.type, homeLoc);
    }
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

function updateEntityStack(delta, entityType, homeLoc) {
  let htmlID = homeLoc + '_' + entityType + '_s';
  
  let currStackTot = parseInt($('#' + htmlID + ' .num_box span').text());
  
  if (currStackTot + delta <= 0) {
    $('#' + htmlID).css('display', 'none');
  } else {
    $('#' + htmlID).css('display', '');
  }
  
  $('#' + htmlID + ' .num_box span').text(currStackTot + delta);
}

function entityIsHome(entity) {
  let location = entity.location;
  let homeLoc = config.entity_types[entity.type].homeLoc;
  
  return (location == homeLoc);
}

function entityIsOverHome(entity, source) {
  let homeLoc = config.entity_types[entity.type].homeLoc;
  
  return (homeLoc == source);
}

function despawnAllEntities() {
  $('.entity').remove();
  $('.item').remove();
}

function getGridSpacing(entityType) {
  return config.entity_types[entityType].gridSpacing;
}

function canManipulateEntity(entity) {
  let permission = config.entity_types[entity.type].permission;
  
  switch (permission) {
    case 0:
      return true;
    case 1:
    case 2:
      if (entity.owner == playerInfo.id) {
        return true;
      } else {
        return false;
      }
  }
}

function entityExistsOnTable(entity) {
  if ($('#' + tableLoc + '_' + entity.id).length == 0) {
    return false;
  } else {
    return true;
  }
}
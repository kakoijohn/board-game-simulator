let config;
let rawFileCache = {};
let tableLoc = 1;

const activeZIndex = 999;
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
    } else {
      updateEntity(entity);
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
  let file = getEntityImageFile(entity.type, index, false);
  let width = config.entity_types[entity.type].width;
  let height = config.entity_types[entity.type].height;

  $('#' + locName).append('<div class=\"entity\" id=\"' + htmlID + '\"></div>');
  applyBGImage(htmlID, file, entity.type, entity.owner);
  $('#' + htmlID).css('width', width);
  $('#' + htmlID).css('height', height);
  $('#' + htmlID).css('left', entity.x + 'px');
  $('#' + htmlID).css('top', entity.y + 'px');

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

  let file = getEntityImageFile(entity.type, index, true);

  let canStack = config.entity_types[entity.type].canStack;
  if (canStack) {
    htmlID = homeLoc + '_' + entity.type + '_s'; // s for stack

    if ($('#' + htmlID).length == 0) {
      // if we are the first in the stack
      $('#' + homeLocName).append('<div class=\"item\" id=\"' + htmlID + '\">' +
        '<div class=\"num_box\"><span>0</span></div></div>');

      applyBGImage(htmlID, file, entity.type, entity.owner);

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

    $('#' + homeLocName).append('<div class=\"item\" id=\"' + htmlID + '\">' +
      '<div class=\"num_box\"></div></div>');

    applyBGImage(htmlID, file, entity.type, entity.owner);

    if (entity.location == tableLoc)
      $('#' + htmlID).css('display', 'none');
  }

}

function updateEntity(entity) {
  let canStack = config.entity_types[entity.type].canStack;
  let homeLoc = config.entity_types[entity.type].homeLoc;
  
  let homeHtmlID = '';
  if (canStack) {
    homeHtmlID = homeLoc + '_' + entity.type + '_s'; // s for stack
  } else {
    homeHtmlID = homeLoc + '_' + entity.id;
  }
  
  let tableHtmlID = tableLoc + '_' + entity.id;
  
  let homeFile  = getEntityImageFile(entity.type, entity.index, true);
  let tableFile = getEntityImageFile(entity.type, entity.index, false);
  
  applyBGImage(homeHtmlID,  homeFile,  entity.type, entity.owner);
  applyBGImage(tableHtmlID, tableFile, entity.type, entity.owner);
}

function applyBGImage(htmlID, file, type, owner) {
  let editable = config.entity_types[type].editable;

  if (editable) {
    // if the image itself has any player-specific configurable parameters
    // async request to load the file into memory
    if (rawFileCache[file] == undefined) {
      let rawFile = new XMLHttpRequest();
      rawFile.open("GET", file, true);
      rawFile.onload = function(e) {
        rawFileCache[file] = rawFile.responseText;
        applyCustomImage(htmlID, owner, type, file);
      }
      rawFile.send(null);
    } else {
      applyCustomImage(htmlID, owner, type, file);
    }
  } else {
    // if not, just apply the file as a css background-image
    $('#' + htmlID).css('background-image', 'url(' + file + ')');
  }
}

function applyCustomImage(htmlID, owner, type, file) {
  let fileText = rawFileCache[file];
  
  let editVars = config.entity_types[type].editVars;

  let fillCol = '';
  let entText = '';
  
  if (owner == '') {
    fillCol = editVars.defFill;
    entText = editVars.defText;
  } else {
    fillCol = getPlayerColor(owner);
    entText = getPlayerInitials(owner);
  }

  fileText = fileText.replaceAll(editVars.fill, fillCol);
  fileText = fileText.replaceAll(editVars.text, entText);

  $('#' + htmlID).html(fileText);
}

function moveEntity(entity) {
  $('#' + tableLoc + '_' + entity.id).css('left', entity.x + 'px');
  $('#' + tableLoc + '_' + entity.id).css('top', entity.y + 'px');

  $('#' + tableLoc + '_' + entity.id).css(
    'transform',
    'rotate(' + entity.rotation + 'deg)'
  );
  
  updateEntityZIndex(tableLoc, entity);
}

// swap the entity from the table to the hand
function updateEntityLocation(entity) {
  let location = entity.location;
  let homeLoc = config.entity_types[entity.type].homeLoc;
  if (location == tableLoc) {
    // if the location is the table, move it to home
    entityToTable(entity, homeLoc);
    updateEntityZIndex(tableLoc, entity);
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
  $('#' + homeLoc + '_' + entity.id).css('display', 'none');
}

function entityToHome(entity, homeLoc) {
  $('#' + tableLoc + '_' + entity.id).css('display', 'none');
  $('#' + homeLoc + '_' + entity.id).css('display', '');
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

// TODO: make this more robust and actually bring things to front
function updateEntityZIndex(location, entity) {
  let htmlID = location + '_' + entity.id;
  //
  // let numEntities = $('.entity').length;
  // currZct;
  // $( "li" ).each(function( index ) {
  //   console.log( index + ": " + $( this ).text() );
  // });
  
  $('#' + htmlID).css('z-index', activeZIndex);
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

function despawnPlayerEntities(entities, playerID) {
  let homeLoc = config.entity_types[entity.type].homeLoc;
  
  for (let id in entities) {
    let entity = entities[id];
    
    if (entity.owner == playerID) {
      $('#' + tableLoc + '_' + entity.id).remove();
      $('#' + homeLoc + '_' + entity.id).remove();
    }
  }
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

function getEntityImageFile(type, index, isHome) {
  let reversePath = config.entity_types[type].reverse;
  if (reversePath != undefined && reversePath != '' && isHome) {
    // if the entity has a reverse side, make the background image
    // the reverse while it is at home.
    return reversePath;
  } else {
    // else make the background image the same as when its on the table
    let filePath = config.entity_types[type].path;
    let fileName = config.entity_types[type].files[index];

    return filePath + fileName;
  }
}

function getTableLoc() {
  return config.locations[tableLoc].refName;
}
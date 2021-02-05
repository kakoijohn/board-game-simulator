let entitiesCache = {};

// target entity that the user is currently trying to manipulate
var targEnt = {
  id: '',
  htmlID: '',
  location: '', // location id
  type: '',
  index: 0,
  x: 0,
  y: 0,
  offsetX: 0,
  offsetY: 0,
  active: false,
  gridSpacing: 0,
  isOverInventory: false,
};

const tableZIndex = 1;
const activeZIndex = 999;
const inventoryZIndex = 1001;

/*
listen for the state of the table from server
*/
socket.on('load new entities', function(entities) {
  entitiesCache = entities;
  // before we load the new entities, despawn the current ones
  despawnAllEntities();
  
  loadEntities(entities);
});

socket.on('entity state', function(entities) {
  for (let id in entities) {
    let entity = entities[id];
    let loc = entity.location;
    
    if (loc == 1) {
      // if the location is on the table
      if (targEnt.id != id || !targetChip.active) {
        $('#' + loc + '_' + id).css('left', entity.x + 'px');
    		$('#' + loc + '_' + id).css('top', entity.y + 'px');
      }
    }
    
    entitiesCache[id] = entity; // set the cached entity to the new value
  }
});

// if we recieve confirmation that we picked up the entity
socket.on('pickup entity confirm', function() {
  targEnt.active = true;
  targEnt.gridSpacing = getGridSpacing(targEnt.type);
  $('#' + targEnt.htmlID).css('z-index', activeZIndex);
});

/*
Entity events on page
*/
$(document).on('mousedown', '.entity', function(evt) {
	if (evt.which == 1) {
		//left click event
    targEnt.htmlID = $(evt.target).attr('id');
    let idParts = targEnt.htmlID.split('_');
    targEnt.id = idParts[1] + '_' + idParts[2];
    targEnt.location = idParts[0];
    targEnt.type = idParts[1];
    targEnt.index = parseInt(idParts[2]);
    
		targEnt.offsetX = (evt.pageX - $(evt.target).offset().left) / zoomScale;
		targEnt.offsetY = (evt.pageY - $(evt.target).offset().top) / zoomScale;
    
    socket.emit('pickup entity', {username: playerInfo.username, entityID: targEnt.id});
	}
});

$(window).mousemove(function (evt) {
  if (targEnt.active) {
    let scrollLeft = $('#table_container').scrollLeft();
    let scrollTop  = $('#table_container').scrollTop();
    
    let tableMouseX = (scrollLeft + evt.pageX) / (defaultWidth  * zoomScale) * defaultWidth;
    let tableMouseY = (scrollTop  + evt.pageY) / (defaultHeight * zoomScale) * defaultWidth;
    
		targEnt.x = tableMouseX - targEnt.offsetX; //TODO offset
		targEnt.y = tableMouseY - targEnt.offsetY;
    
    if (targEnt.gridSpacing > 0 && !targEnt.isOverInventory) {
      targEnt.x = Math.round(targEnt.x / targEnt.gridSpacing) * targEnt.gridSpacing;
      targEnt.y = Math.round(targEnt.y / targEnt.gridSpacing) * targEnt.gridSpacing;
    }

		//move the card locally on our screen before sending the data to the server.
		$('#' + targEnt.htmlID).css('left', targEnt.x + 'px');
		$('#' + targEnt.htmlID).css('top', targEnt.y + 'px');
		//next send the card state to the server.
		socket.emit('move entity', {
      username: playerInfo.username,
      entityID: targEnt.id,
      x: targEnt.x,
      y: targEnt.y
    });

	}
});

$(window).mouseup(function(evt) {
  if (targEnt.active) {
    if (targEnt.isOverInventory) {
      socket.emit('entity to inventory', {
        username: playerInfo.id,
        entityID: targEnt.id
      });
    }
    targEnt.active = false;
  }
});
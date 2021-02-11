let entitiesCache = {};

// target entity that the user is currently trying to manipulate
var targEnt = {
  id: '',
  location: -1, // location number
  type: -1, // type of entity number
  index: 0, // index of that entity type
  elements: 0,
  x: 0,
  y: 0,
  offsetX: 0,
  offsetY: 0,
  active: false,
  gridSpacing: 0,
  isOverHome: false,
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
    
    if (targEnt.id != id || !targEnt.active) {
      if (entitiesCache[id] != undefined) {
        if (entitiesCache[id].location != loc) {
          updateEntityLocation(entity);
        }
      }
      if (!entityIsHome(entity)) {
        // if the location is on the table
        moveEntity(entity);
      }
    }
    
    entitiesCache[id] = entity; // set the cached entity to the new value
  }
});

// if we recieve confirmation that we picked up the entity
socket.on('pickup entity confirm', function() {
  activateEntity('');
});

socket.on('pickup stack confirm', function(entityID) {
  activateEntity(entityID);
});

function activateEntity(entityID) {
  targEnt.active = true;
  targEnt.gridSpacing = getGridSpacing(targEnt.type);
  if (entityID != '')
    targEnt.id = entityID;
  
  let htmlID = targEnt.location + '_' + targEnt.id;
  $('#' + htmlID).css('z-index', activeZIndex);
  
  if (entityIsHome(targEnt)) {
    targEnt.location = 1;
    updateEntityLocation(targEnt);
  }
}

/*
Entity events on page
*/
$(document).on('mousedown', '.entity', function(evt) {
	if (evt.which == 1) {
		setTargetEntity(evt);
    
    socket.emit('pickup entity', {username: playerInfo.username, entityID: targEnt.id});
	}
});

$(document).on('mousedown', '.item', function(evt) {
  if (evt.which == 1) {
    setTargetEntity(evt);
    
    if (targEnt.index == 's') {
      socket.emit('pickup top entity on stack', {
        username: playerInfo.username,
        entityType: targEnt.type
      });
    } else {
      socket.emit('pickup entity', {username: playerInfo.username, entityID: targEnt.id});
    }
    
  }
});

function setTargetEntity(evt) {
  let htmlID = $(evt.target).attr('id');
  let idParts = htmlID.split('_');
  
  targEnt.id = idParts[1] + '_' + idParts[2] + '_' + idParts[3];
  targEnt.location = idParts[0];
  targEnt.type = idParts[1];
  targEnt.index = idParts[2];
  targEnt.elements = idParts[3];

  targEnt.offsetX = (evt.pageX - $(evt.target).offset().left) / zoomScale;
  targEnt.offsetY = (evt.pageY - $(evt.target).offset().top) / zoomScale;
}

$(window).mousemove(function (evt) {
  if (targEnt.active) {
    let scrollLeft = $('#table_container').scrollLeft();
    let scrollTop  = $('#table_container').scrollTop();
    
    let tableMouseX = (scrollLeft + evt.pageX) / (defaultWidth  * zoomScale) * defaultWidth;
    let tableMouseY = (scrollTop  + evt.pageY) / (defaultHeight * zoomScale) * defaultWidth;
    
		targEnt.x = tableMouseX - targEnt.offsetX; //TODO offset
		targEnt.y = tableMouseY - targEnt.offsetY;
    
    if (targEnt.gridSpacing > 0 && !targEnt.isOverHome) {
      targEnt.x = Math.round(targEnt.x / targEnt.gridSpacing) * targEnt.gridSpacing;
      targEnt.y = Math.round(targEnt.y / targEnt.gridSpacing) * targEnt.gridSpacing;
    }

    let htmlID = targEnt.location + '_' + targEnt.id;

		//move the card locally on our screen before sending the data to the server.
		$('#' + htmlID).css('left', targEnt.x + 'px');
		$('#' + htmlID).css('top', targEnt.y + 'px');
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
    if (targEnt.isOverHome) {
      socket.emit('entity to home', {
        username: playerInfo.id,
        entityID: targEnt.id
      });
      
      deactivateHome();
    }
    targEnt.active = false;
  }
});
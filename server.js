// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

// var entities = require("./routes/load_entities");
var consoleCmds = require("./routes/console_commands");

var PORT = process.env.PORT || 5000;
app.set('port', PORT);
app.use('/static', express.static(__dirname + '/static'));
app.use(express.static('public'));

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

// Starts the server.
server.listen(PORT, function() {
  console.log('Starting server on port ' + PORT);
  
  console.log('generating default entities');
  generateDefaultEntities();
});

var players = {};
var entities = {};

let playerStateChange = false;
let entityStateChange = false;

var currentWallpaper = 0; // 0 for default wallpaper

const nametagStartX = 11;
const nametagStartY = 114;

io.on('connection', function(socket) {

  socket.on('new player', function(user) {
  	var username = user.username;
  	var color = user.color;

  	if (username == null || username == "" || username == "house" || username == "table")
  		username = socket.id;

  	if (color == null || color == "")
  		color = 'rgb(' + (Math.floor(Math.random() * 256)) + ','
                     + (Math.floor(Math.random() * 256)) + ','
                     + (Math.floor(Math.random() * 256)) + ')';

  	var id = username.replace(/[^a-zA-Z0-9]/g, '_');

  	if (players[id] == undefined) {
  		//create a new player if that username doesn't exist
  		players[id] = {
  			id: id,
  			username: username,
  			pointerX: 0,
  			pointerY: 0,
  			nametagX: nametagStartX,
  			nametagY: nametagStartY,
        isAdmin: false,
        
  			color: color,
  		};
  	}

  	players[id].color = color;

  	//callback to client that we have put them into the system.
    socket.emit('new player confirmation', {username, id, color, currentWallpaper});

    //tell all clients we have a new player and send a list of all the current players.
    io.sockets.emit('new player notification', players);

    console.log("Added new player with username: " + id);
    
    playerStateChange = true;
    entityStateChange = true;
  });

  socket.on('broadcast player state', function(playerInfo) {
  	if (players[playerInfo.id] != null) {
	  	players[playerInfo.id].pointerX = playerInfo.pointerX;
	  	players[playerInfo.id].pointerY = playerInfo.pointerY;

      playerStateChange = true;
  	}
  });
  
  socket.on('pickup entity', function(info) {
    if (entities[info.entityID] != undefined && players[info.username] != undefined) {
      if (userEntityPermission(info.username, info.entityID)) {
        socket.emit('pickup entity confirm', {
          gridSpacing: entities[info.entityID].gridSpacing,
          isGlobalObject: entities[info.entityID].isGlobalObject
        });
      }
    }
  });
  
  socket.on('move entity', function(info) {
    if (entities[info.entityID] != undefined && players[info.username] != undefined) {
      if (userEntityPermission(info.username, info.entityID)) {
        entities[info.entityID].x = info.x;
        entities[info.entityID].y = info.y;
        entities[info.entityID].stateChange = true;
        
        entityStateChange = true;
      }
    }
    
  });
  
  socket.on('entity to inventory', function(info) {
    if (entities[info.entityID] != undefined && players[info.username] != undefined) {
      if (userEntityPermission(info.username, info.entityID)) {
        entities[info.entityID].onTable = false;
        entities[info.entityID].stateChange = true;
        
        entityStateChange = true;
      }
    }
  });

  socket.on('new draw line', function(data) {
  	io.sockets.emit('new draw line', data);
  });

  socket.on('clear draw area', function() {
  	io.sockets.emit('clear draw area');
  });

  // console commands
  socket.on('console command', function(cmdInfo) {
    var response = consoleCmds.consolecmd(cmdInfo.command, 'client', cmdInfo.id, players);
    socket.emit('console response', response);
  });
});

function userEntityPermission(username, entityID) {
  if (entities[entityID].requireAdmin) {
    if (players[username].isAdmin) {
      return true;
    } else {
      return false;
    }
  } else {
    return true;
  }
}

//emit the state of the deck every 24ms if something changed.
setInterval(function() {
  if (playerStateChange) {
    io.sockets.emit('player state', players);
    playerStateChange = false;
  }
  if (entityStateChange) {
    let changedEntities = getChangedEntities();
    io.sockets.emit('entity state', changedEntities);
    entityStateChange = false;
  }
}, 1000 / 24);

//emit the state every 5 seconds regardless of change.
setInterval(function() {
  let cleanEntities = getAllEntities();
  io.sockets.emit('entity state', cleanEntities);
}, 5000);

function getChangedEntities() {
  let changedEntities = {};
  for (var id in entities) {
    if (entities[id].stateChange) {
      changedEntities[id] = simplifyEntity(entities[id]);
      entities[id].stateChange = false;
    }
  }
  
  return changedEntities;
}

function getAllEntities() {
  let cleanEntities = {};
  for (var id in entities) {
    cleanEntities[id] = simplifyEntity(entities[id]);
  }
  
  return cleanEntities;
}

function simplifyEntity(entity) {
  let simpleEntity = {
    id: entity.id,
    type: entity.type,
    x: entity.x,
    y: entity.y,
    canStack: entity.canStack,
    onTable: entity.onTable,
    isGlobalObject: entity.isGlobalObject
  };
}

function generateDefaultEntities() {
  entities['test_block'] = {
    id: 'test_block',
    type: 'tile',
    x: 0,
    y: 0,
    gridSpacing: 100,
    canStack: true,
    onTable: true, //on the table or in the inventory
    requireAdmin: false,
    isGlobalObject: true,
    stateChange: false
  };
  entities['test_meeple'] = {
    id: 'test_meeple',
    type: 'meeple',
    x: 0,
    y: 0,
    gridSpacing: 0,
    canStack: false,
    onTable: true,
    requireAdmin: false,
    isGlobalObject: false,
    stateChange: false
  };
}
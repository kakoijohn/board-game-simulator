// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

var entHand = require("./routes/entity_handler"); // entity handler
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
  entHand.appendDefaultGlobalEntities(entities);
  console.log('shuffling tiles 400 times');
  entHand.shuffleStack(entities, '0', 400);
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
    
    let userArr = username.split(' ');
    let initials = userArr[0].charAt(0).toUpperCase();
    if (userArr.length > 1)
      initials += userArr[userArr.length - 1].charAt(0).toUpperCase();
    else if (userArr[0].length > 1)
      initials += userArr[0].charAt(1).toUpperCase();

  	if (players[id] == undefined) {
  		//create a new player if that username doesn't exist
  		players[id] = {
  			id: id,
  			username: username,
        initials: initials,
  			pointerX: 0,
  			pointerY: 0,
  			nametagX: nametagStartX,
  			nametagY: nametagStartY,
        isAdmin: false,
        
  			color: color,
        points: 0
  		};
      
      console.log("Adding new player with username: " + id);
      console.log("Adding new set of default player entities.");
      entHand.appendDefaultPlayerEntities(entities, id);
  	} else {
      console.log("Existing player reconnected with username: " + id);
      
      players[id].color = color;
      players[id].username = username;
      players[id].initials = initials;
    }
    
  	//callback to client that we have put them into the system.
    socket.emit('new player confirmation', players[id]);
    //callback to the client with the state of all the entities on the board

    //tell all clients we have a new player and send a list of all the current players.
    io.sockets.emit('new player notification', players);
    io.sockets.emit('append new entities', entities);
    
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
    if (entities[info.entityID] != undefined && players[info.playerID] != undefined) {
      if (userEntityPermission(info.playerID, info.entityID)) {
        entities[info.entityID].location = entHand.getTableLoc();
        entities[info.entityID].stateChange = true;
        entityStateChange = true;
        
        socket.emit('pickup entity confirm');
      }
    }
  });
  
  socket.on('rotate entity', function(info) {
    if (entities[info.entityID] != undefined && players[info.playerID] != undefined) {
      if (userEntityPermission(info.playerID, info.entityID)) {
        let type = entities[info.entityID].type;
        
        if (entHand.canRotate(type)) {
          entities[info.entityID].rotation += entHand.getRotStep(type);
          entities[info.entityID].stateChange = true;
          entityStateChange = true;
        }
      }
    }
  });
  
  socket.on('pickup top entity on stack', function(info) {
    if (players[info.playerID] != undefined) {
      let entityID = entHand.getTopEntityInStack(entities, info.entityType);
      
      if (entityID != -1 && userEntityPermission(info.playerID, entityID)) {
        entities[entityID].location = entHand.getTableLoc();
        entities[entityID].stateChange = true;
        entityStateChange = true;
        
        socket.emit('pickup stack confirm', entityID);
      }
    }
  });
  
  socket.on('move entity', function(info) {
    if (entities[info.entityID] != undefined && players[info.playerID] != undefined) {
      if (userEntityPermission(info.playerID, info.entityID)) {
        entities[info.entityID].x = info.x;
        entities[info.entityID].y = info.y;
        entities[info.entityID].stateChange = true;
        entityStateChange = true;
      }
    }
  });
  
  socket.on('entity to home', function(info) {
    if (entities[info.entityID] != undefined && players[info.playerID] != undefined) {
      if (userEntityPermission(info.playerID, info.entityID)) {
        let type = entities[info.entityID].type;
        entities[info.entityID].location = entHand.getHomeLoc(type);
        entities[info.entityID].stateChange = true;
        entityStateChange = true;
      }
    }
  });
  
  socket.on('update player points', function(info) {
    if (players[info.sourceID] != undefined && players[info.playerID] != undefined) {
      if (players[info.sourceID].isAdmin) {
        players[info.playerID].points += info.delta;
        playerStateChange = true;
      }
    }
  });

  socket.on('new draw line', function(data) {
  	io.sockets.emit('new draw line', data);
  });

  socket.on('clear draw area', function() {
  	io.sockets.emit('clear draw area');
  });

  // console commands sent from client
  socket.on('console command', function(cmdInfo) {
    let data = consoleCmds.consolecmd(cmdInfo.command, 'client', cmdInfo.id, players);
    socket.emit('console response', data.response);
    console.log(data.response);
    consoleCallback(data.callback);
  });
});

function userEntityPermission(playerID, entityID) {
  switch (entHand.getPermissionLvl(entities[entityID].type)) {
    case 0:
      // no permission restrictions
      return true;
    case 1:
      // admin required
      if (players[playerID].isAdmin) {
        return true;
      } else {
        return false;
      }
    case 2:
      // belongs to player
      if (entities[entityID].owner == playerID || players[playerID].isAdmin) {
        return true;
      } else {
        return false;
      }
    default:
      // any other case, dont allow
      return false;
  }
}

//emit the state of the deck every 24ms if something changed.
setInterval(function() {
  if (playerStateChange) {
    io.sockets.emit('player state', players);
    playerStateChange = false;
  }
  if (entityStateChange) {
    let changedEntities = entHand.getChangedEntities(entities);
    io.sockets.emit('entity state', changedEntities);
    entityStateChange = false;
  }
}, 1000 / 24);

//emit the state every 10 seconds regardless of change.
setInterval(function() {
  io.sockets.emit('entity state', entities);
}, 10000);


/**
Console Commands
**/
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function (text) {
  let data = consoleCmds.consolecmd(text, 'server', '');
  console.log(data.response);
  consoleCallback(data.callback);
});

function consoleCallback(callback) {
  let func = callback.func;
  let args = callback.args;
  
  if (func == 'new game') {
    entHand.resetAllEntities(entities);
    entHand.shuffleStack(entities, '0', 400);
    entityStateChange = true;
  } else if (func == 'socket remove user') {
    io.sockets.emit('remove user', args.playerID);
    io.sockets.emit('remove player entities', arge.playerID);
    delete players[args.playerID];
  } else if (func == 'socket reset server') {
    io.sockets.emit('reload page');
    players = null;
  } else if (func == 'set admin') {
    if (args.setAdmin) {
      players[args.playerID].isAdmin = true;
    } else {
      players[args.playerID].isAdmin = false;
    }
  }
}
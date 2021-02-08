// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

var entityHandler = require("./routes/entity_handler");
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
  entities = entityHandler.loadDefaultEntities();
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
    //callback to the client with the state of all the entities on the board
    let simpEntities = entityHandler.getAllSimpEntities(entities);
    socket.emit('load new entities', simpEntities);

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
        entities[info.entityID].location = entityHandler.getTableLoc();
        entities[info.entityID].stateChange = true;
        entityStateChange = true;
        
        socket.emit('pickup entity confirm');
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
  
  socket.on('entity to home', function(info) {
    if (entities[info.entityID] != undefined && players[info.username] != undefined) {
      if (userEntityPermission(info.username, info.entityID)) {
        entities[info.entityID].location = entities[info.entityID].homeLoc;
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

  // console commands sent from client
  socket.on('console command', function(cmdInfo) {
    let data = consoleCmds.consolecmd(cmdInfo.command, 'client', cmdInfo.id, players);
    socket.emit('console response', data.response);
    console.log(data.response);
    consoleCallback(data.callback);
  });
});

function userEntityPermission(username, entityID) {
  if (entities[entityID].permission > 0) {
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
    let changedEntities = entityHandler.getChangedEntities(entities);
    io.sockets.emit('entity state', changedEntities);
    entityStateChange = false;
  }
}, 1000 / 24);

//emit the state every 10 seconds regardless of change.
setInterval(function() {
  let simpEntities = entityHandler.getAllSimpEntities(entities);
  io.sockets.emit('entity state', simpEntities);
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
  
  if (func == 'socket remove user') {
    io.sockets.emit('remove user', args.playerID);
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
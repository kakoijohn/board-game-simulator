// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

process.stdin.resume();
process.stdin.setEncoding('utf8');

var PORT = process.env.PORT || 5000;
app.set('port', PORT);
app.use('/static', express.static(__dirname + '/static'));
app.use(express.static('public'));

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
  
  console.log('generating default entities');
  generateDefaultEntities();
});

// Starts the server.
server.listen(PORT, function() {
  console.log('Starting server on port ' + PORT);
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
      if (userHasPermissionToMove(info.username, info.entityID)) {
        socket.emit('pickup entity confirm', entities[info.entityID].gridSpacing);
      }
    }
  });
  
  socket.on('move entity', function(info) {
    if (entities[info.entityID] != undefined && players[info.username] != undefined) {
      if (userHasPermissionToMove(info.username, info.entityID)) {
        entities[info.entityID].x = info.x;
        entities[info.entityID].y = info.y;
      }
    }
    
    entityStateChange = true;
  });

  socket.on('new draw line', function(data) {
  	io.sockets.emit('new draw line', data);
  });

  socket.on('clear draw area', function() {
  	io.sockets.emit('clear draw area');
  });

  // console commands
  socket.on('console command', function(cmdInfo) {
    var response = consolecmd(cmdInfo.command, 'client', cmdInfo.id);
    socket.emit('console response', response);
  });
});

function userHasPermissionToMove(username, entityID) {
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
    io.sockets.emit('entity state', entities);
    entityStateChange = false;
  }
}, 1000 / 24);

//emit the state every ten seconds regardless of change.
setInterval(function() {
  // io.sockets.emit('deck state', deck);
  // io.sockets.emit('chips state', chips);
  // io.sockets.emit('player state', players);
  // io.sockets.emit('player vehicle state', playerVehicles);
}, 5000);

function generateDefaultEntities() {
  entities['test_block'] = {
    active: false,
    id: 'test_block',
    x: 0,
    y: 0,
    gridSpacing: 100,
    requireAdmin: false
  }
}

const serverPassword = 'hackermikecarns';

process.stdin.on('data', function (text) {
  consolecmd(text, 'server', '');
});

function consolecmd(text, source, id) {
  var command = text.trim().replace('\n', '').split(' ');
  var response = '';

  if (source == 'server' || (source == 'client' && players[id].isAdmin == true)) {
    if (command[0] == 'listusers') {
      for (var id in players) {
        let player = players[id];
        let opStatus = false;
        if (adminList[id] != undefined)
          opStatus = true;
        response += 'id: ' + id + ', display name: ' + player.username + ', color: ' + player.color + ', is admin: ' + opStatus + '\n';
      }
    } else if (command[0] == 'removeuser' && command[1] != undefined) {
      var playerID = command[1];
      if (players[playerID] != undefined) {
        delete players[playerID];
        io.sockets.emit('remove user', playerID);
        playerStateChange = true;
        response = "Removing user: " + playerID;
      } else {
        response = "Error: Invalid payout command. playerID not found.";
      }
    } else if (command[0] == 'resetserver') {
      io.sockets.emit('reload page');
      players = null;
      response = "Cleared all players from server and sent out refresh call to all clients.";
    } else if (command[0] == 'op' && command[1] != undefined) {
      // op command when the player initiating is already an admin, doesnt require password
      var playerID = command[1];
  
      if (players[playerID] != undefined) {
        players[playerID].isAdmin = true;
        response = "Gave console command permissions to: " + playerID;
      } else if (players[playerID] == undefined) {
        response = "Error: Invalid OP command. playerID not found.";
      }
    } else if (command[0] == 'deop' && command[1] != undefined) {
      // op command when the player initiating is already an admin, doesnt require password
      var playerID = command[1];
  
      if (players[playerID] != undefined) {
        players[playerID].isAdmin = false;
        response = "Removed console command permissions from: " + playerID;
      } else if (players[playerID] == undefined) {
        response = "Error: Invalid OP command. playerID is not an OP.";
      }
    } else if (command[0] == 'help') {
      response = "List of Commands:" + '\n' +
      "listusers" + '\n' +
      "-- lists all the players currently on the server." + '\n' +
      "removeuser [playerID]" + '\n' +
      "-- removes the specified user from the server." + '\n' +
      "resetserver" + '\n' +
      "-- removes all users and resets the server to the original state." + '\n' +
      "op [playerID]" + '\n' +
      "-- gives admin persmissions to the specified user to initiate console commands.";
      "deop [playerID]" + '\n' +
      "-- removes admin persmissions from the specified user.";
    } else {
      response = "Error: Invalid command. Type \"help\" for a list of commands.";
    }
  } else {
    // the user giving the console command does not have admin privileges
    if (command[0] == 'op' && command[1] != undefined && command[2] != undefined) {
      var playerID = command[1];
      var password = command[2];
  
      if (players[playerID] != undefined && password == serverPassword) {
        players[playerID].isAdmin = true;
        response = "Gave console command permissions to: " + playerID + '\n' +
                   "Type \"help\" for a new list of available commands.";
      } else if (players[playerID] == undefined) {
        response = "Error: Invalid OP command. playerID not found.";
      } else if (password != serverPassword) {
        response = "Error: Invalid OP command. Incorrect password.";
      }
    } else if (command[0] == 'listusers') {
      for (var id in players) {
        let player = players[id];
        let opStatus = false;
        if (adminList[id] != undefined)
          opStatus = true;
        response += 'id: ' + id + ', display name: ' + player.username + ', color: ' + player.color + ', is admin: ' + opStatus + '\n';
      }
    } else if (command[0] == 'help') {
      response = "List of Commands:" + '\n' +
      "listusers" + '\n' +
      "-- lists all the players currently on the server." + '\n' +
      "op [playerID] [password]" + '\n' +
      "-- gives admin persmissions to the specified user to initiate console commands.";
    } else {
      response = "Error: Invalid command OR you do not have permission to use console commands." + '\n' +
                 "Type \"help\" for a list of available commands.";
    }
  }

  console.log(response);
  return response;
}

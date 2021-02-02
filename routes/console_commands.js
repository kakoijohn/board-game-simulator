const serverPassword = 'hackermikecarns';

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function (text) {
  consolecmd(text, 'server', '');
});

exports.consolecmd = function(text, source, id, players) {
  return consolecmd(text, source, id, players);
};

function consolecmd(text, source, id, players) {
  var command = text.trim().replace('\n', '').split(' ');
  var response = '';

  if (source == 'server' || (source == 'client' && players[id].isAdmin == true)) {
    if (command[0] == 'listusers') {
      for (var id in players) {
        let player = players[id];
        let opStatus = false;
        if (adminList[id] != undefined)
          opStatus = true;
        response += 'id: ' + id + ', display name: ' + player.username + ', color:'
                    + player.color + ', is admin: ' + opStatus + '\n';
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
        response += 'id: ' + id + ', display name: ' + player.username +
                    ', color: ' + player.color + ', is admin: ' + opStatus + '\n';
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
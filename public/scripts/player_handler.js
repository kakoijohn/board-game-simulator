/**

Set up our player variables and send the data to the server.

**/

var playerInfo = {
	username: 'null',
	id: 'null',
	pointerX: 0,
	pointerY: 0,
	color: 'null',
	stateChanged: false
}

let playersCache = {};

//setup the user on the server
var newPlayerCall;

function newPlayerSubmit() {
  var username = $('#dname').val();
  var color = pickr.getColor().toHEXA().toString();

  //let the server know we have a new player every 5 seconds until we receive a response.
  socket.emit('new player', {username, color});
  newPlayerCall = setInterval(function() {
    socket.emit('new player', {username, color});
  }, 5000);

  //hide the form once we have submitted the info to the server
  $('.display_name_form').css('display', 'none');
}

socket.on('new player confirmation', function(player) {
	playerInfo = player;

	$('#pointer_icon').css('box-shadow', '0px 0px 0px 0.2vw ' + playerInfo.color);
	cursorMode =  'pointer';

	clearInterval(newPlayerCall);
  socketWasConnected = true;

	//hide the loading bar once we have submitted the info to the server
	$('.loading_area').css('display', 'none');
  
  //set the current wallpaper
  // $('.table').addClass('table__bg_' + newPlayer.currentWallpaper);
	
	updateAdminControls(playerInfo.isAdmin);
});

socket.on('new player notification', function(players) {
  playersCache = players;
	
	let tableLoc = getTableLoc();
  
	for (var id in players) {
		var player = players[id];

		if ($('#' + player.id).length == 0) {
			//we don't have a player by that id yet, create them on our game board.
			$('#' + tableLoc).append("<div class=\"player player_anim\" id=\"" + player.id +
                       "\"><div class=\"nametag\">" + player.username + "</div></div>");
											 
		  $('#player_list').append("<li id=\"" + player.id + "_list" + "\">" +
															 "<div class=\"name\"></div>|<div class=\"points\"></div></li>");
		}
		
		$('#' + player.id).css('background-color', player.color);
		
		$('#' + player.id + '_list .name').text(player.username);
		$('#' + player.id + '_list .name').css('background-color', player.color);
		updatePlayerPoints(player.id, player.points);
		$('#' + player.id + '_list .points').css('background-color', player.color);
		// $('#' + player.id + "_floating_nametag .player_cash").css('border-color', player.color);
		
		//toggle animation off for our cursor.
		if (id == playerInfo.id) {
			$('#' + player.id).toggleClass('player_anim', false);
		}
	}
	
	updateAdminControls(playerInfo.isAdmin);
});

socket.on('remove user', function(playerID) {
	$('#' + playerID).remove();
	$('#' + playerID + '_list').remove();
	// $('#' + username + '_floating_nametag').remove();
});

socket.on('player state', function(players) {
	for (var id in players) {
		var player = players[id];
		
		if (id != playerInfo.id) {
			// if not us we update everyone else's cursor on our screen
			$('#' + player.id).css('left', player.pointerX);
			$('#' + player.id).css('top', player.pointerY);
		} else {

		}
		
		if (player.points != playersCache[id].points) {
			updatePlayerPoints(player.id, player.points);
		}
	}
	
	playersCache = players;
});

socket.on('update admins', function(players) {
	for (let id in players) {
		if (players[id].isAdmin)
			updateAdminControls(true);
		
		if (id == playerInfo.id)
			playerInfo = players[id];
	}
});

$(window).mousemove(function (evt) {
	let scaledCoords = convertWindowCoordToScale(evt.pageX, evt.pageY);
	
	playerInfo.pointerX = scaledCoords.x;
	playerInfo.pointerY = scaledCoords.y;

	$('#' + playerInfo.id).css('left', playerInfo.pointerX);
	$('#' + playerInfo.id).css('top', playerInfo.pointerY);

	playerInfo.stateChanged = true;
});

function getPlayerColor(id) {
  return playersCache[id].color;
}

function getPlayerInitials(id) {
  return playersCache[id].initials;
}

function updatePlayerPoints(playerID, points) {
	$('#' + playerID + '_list .points').text(points);
}

function updateAdminControls(isAdmin) {
	if (isAdmin) {
		// if we are given admin status
		$('.pts-plus-minus').toggleClass('pts-plus-minus--hidden', false);
	} else {
		// if we are no longer admin
		$('.pts-plus-minus').toggleClass('pts-plus-minus--hidden', true);
	}
}
var playerInfo = {
	username: 'null',
	id: 'null',
	pointerX: 0,
	pointerY: 0,
	color: 'null',
	stateChanged: false
}

let playersCache = {};

socket.on('new player confirmation', function(newPlayer) {
	playerInfo.username = newPlayer.username;
	playerInfo.id = newPlayer.id;
	playerInfo.color = newPlayer.color;

	$('#pointer_icon').css('box-shadow', '0px 0px 0px 0.2vw ' + playerInfo.color);
	cursorMode =  'pointer';

	clearInterval(newPlayerCall);
  socketWasConnected = true;

	//hide the loading bar once we have submitted the info to the server
	$('.loading_area').css('display', 'none');
  
  //set the current wallpaper
  // $('.table').addClass('table__bg_' + newPlayer.currentWallpaper);
});

socket.on('new player notification', function(players) {
  playersCache = players;
  
	for (var id in players) {
		var player = players[id];

		if ($('#' + player.id).length == 0) {
			//we don't have a player by that id yet, create them on our game board.
			$('body').append("<div class=\"player player_anim\" id=\"" + player.id +
                       "\"><div class=\"nametag\">" + player.username + "</div></div>");

			$('.table').append("<div class=\"floating_nametag\" id=\"" + player.id + "_floating_nametag\">"
                          + player.username + "<div class=\"player_cash\"></div></div>");
      
			$('#' + player.id + "_floating_nametag").css('left', player.nametagX + '%');
			$('#' + player.id + "_floating_nametag").css('top', player.nametagY + '%');
		}

		//toggle animation off for our cursor.
		if (id == playerInfo.id)
			$('#' + player.id).toggleClass('player_anim', false);

		$('#' + player.id).css('background-color', player.color);
		// $('#' + player.id + "_floating_nametag .player_cash").css('border-color', player.color);
	}
});

socket.on('remove user', function(username) {
	if ($('#' + username).length != 0) {
		$('#' + username).remove();
		// $('#' + username + '_floating_nametag').remove();
	}
});

function getPlayerColor(id) {
  return playersCache[id].color;
}

function getPlayerInitials(id) {
  return playersCache[id].initials;
}
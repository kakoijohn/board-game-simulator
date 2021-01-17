/**

Setup sockets and event listeners

**/

var socket = io();
var socketWasConnected = false;

socket.on('message', function(data) {
  console.log(data);
});

socket.on('connect', function() {
  if (socketWasConnected) {
    $('.player').each(function(index) {
      $(this).remove();
    });
    $('.floating_nametag').each(function(index) {
      $(this).remove();
    });
    $('.tank').each(function(index) {
      $(this).remove();
    });
    $('.cannonball').each(function(index) {
      $(this).remove();
    });

    var username = $('#dname').val();
  	var color = $('#dcolor').val();

  	//let the server know we have a new player every 5 seconds until we receive a response.
  	socket.emit('new player', {username, color});
  	newPlayerCall = setInterval(function() {
  		socket.emit('new player', {username, color});
  	}, 5000);

    console.log("Re-established connection to server.");
    $('.disconnected_screen').css('display', 'none');
  }
});

socket.on('disconnect', function() {
  console.log("Disconnected from server... Waiting for reconnect...");
  $('.disconnected_screen').css('display', 'block');
});

//disable right click default function
if (document.addEventListener) {
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
  }, false);
} else {
  document.attachEvent('oncontextmenu', function() {
    window.event.returnValue = false;
  });
}

function touchHandler(event) {
    var touch = event.changedTouches[0];

    var simulatedEvent = document.createEvent("MouseEvent");
        simulatedEvent.initMouseEvent({
        touchstart: "mousedown",
        touchmove: "mousemove",
        touchend: "mouseup"
    }[event.type], true, true, window, 1,
        touch.screenX, touch.screenY,
        touch.clientX, touch.clientY, false,
        false, false, false, 0, null);

    touch.target.dispatchEvent(simulatedEvent);
}

function initTouchHandler() {
    document.addEventListener("touchstart", touchHandler, true);
    document.addEventListener("touchmove", touchHandler, true);
    document.addEventListener("touchend", touchHandler, true);
    document.addEventListener("touchcancel", touchHandler, true);
}

window.addEventListener('keydown', function(e) {
  if(e.keyCode == 32 && e.target == document.body) {
    e.preventDefault();
  }
  if(e.keyCode == 37 && e.target == document.body) {
    e.preventDefault();
  }
  if(e.keyCode == 38 && e.target == document.body) {
    e.preventDefault();
  }
  if(e.keyCode == 39 && e.target == document.body) {
    e.preventDefault();
  }
  if(e.keyCode == 40 && e.target == document.body) {
    e.preventDefault();
  }
});

var randomStartingColor = 'rgb(' + (Math.floor(Math.random() * 256)) + ','
               + (Math.floor(Math.random() * 256)) + ','
               + (Math.floor(Math.random() * 256)) + ')';

//color picker for choosing the color at the beginning
const pickr = Pickr.create({
    el: '.color_picker',
    theme: 'nano',
    default: randomStartingColor,
    position: 'top-middle',

    components: {
        // Main components
        preview: true,
        opacity: false,
        hue: true,
        // Input / output Options
        interaction: {
            hex: true,
            rgba: true,
            hsla: false,
            hsva: false,
            cmyk: false,
            input: true,
            clear: false,
            save: false
        }
    }
});

pickr.on('save', function() {
  //also called when applycolor() is invoked
  $('.pcr-button').css('background-color', pickr.getColor().toHEXA().toString());
});

pickr.on('hide', function() {
  pickr.applyColor();
});

pickr.on('changestop', function() {
  pickr.applyColor();
});

pickr.on('init', function() {
  $('.pcr-button').css('background-color', pickr.getColor().toHEXA().toString());
});

/**

Construct the table and the draw area

**/

var tableWidth;
var tableHeight;

//set up our drawing canvas
var canvas = document.getElementById('drawing_area');
var ctx = canvas.getContext('2d');

var inMemCanvas = document.createElement('canvas');
var inMemCtx = inMemCanvas.getContext('2d');

$(document).ready(function() {
	initTouchHandler();

	tableWidth = $('.table').width();
	tableHeight = $('.table').height();

	canvas.width = tableWidth;
	canvas.height = tableHeight;
});

$( window ).resize(function() {
	tableWidth = $('.table').width();
	tableHeight = $('.table').height();

	inMemCanvas.width = tableWidth;
	inMemCanvas.height = tableHeight;
	inMemCtx.drawImage(canvas, 0, 0, tableWidth, tableHeight);

	canvas.width = tableWidth;
	canvas.height = tableHeight;

	ctx.drawImage(inMemCanvas, 0, 0);
});

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

$(document).on('click', '.name_submit_btn', function(evt) {
  newPlayerSubmit();
});

$('#dname').keypress(function(event) {
    if (event.keyCode == 13 || event.which == 13)
        newPlayerSubmit();
});
$('#dcolor').keypress(function(event) {
    if (event.keyCode == 13 || event.which == 13)
        newPlayerSubmit();
});

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

socket.on('new player notification', function(info) {
	for (var id in info.players) {
		var player = info.players[id];

		if ($('#' + player.id).length == 0) {
			//we don't have a player by that id yet, create them on our game board.
			$('body').append("<div class=\"player player_anim\" id=\"" + player.id +
                       "\"><div class=\"nametag\">" + player.username + "</div></div>");

			$('.table').append("<div class=\"floating_nametag\" id=\"" + player.id + "_floating_nametag\">" + player.username +
									 "<div class=\"player_cash\"></div></div>");
      //
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

socket.on('reload page', function() {
	location.reload();
});

/**

Game Vars

**/

var drawing;
var cursorMode;

/**

Player Mouse Events

**/


$(document).on('mousedown', '.floating_nametag', function(evt) {
	if (evt.which == 1) {
		//left click event
		draggingNametag = true;
		draggingChip = false;
    draggingDealerChip = false;
		draggingCard = false;
		drawing = false;
    draggingTank = false;

		targetNametag.released = false;

		offsetX = evt.pageX - $(evt.target).offset().left;
		offsetY = evt.pageY - $(evt.target).offset().top;

		var targetNametagID = $(evt.target).attr('id');
		if (targetNametagID == undefined)
			targetNametagID = $(evt.target).parent().attr('id');

		targetNametag.nametagID = targetNametagID;
	}
});

$(document).on('mousedown', '#drawing_area', function(evt) {
	if (evt.which == 1 && (cursorMode == 'pencil' || cursorMode == 'eraser')) {
		drawing = true;
		draggingCard = false;
		draggingChip = false;
		draggingNametag = false;
    draggingTank = false;

		prevDrawPointX = evt.pageX / canvas.width;
		prevDrawPointY = evt.pageY / canvas.height;
	}
});

$(document).on('touchstart', '#drawing_area', function(evt) {
	if (evt.touches.length > 1)
		drawing = false;
});

$(window).mousemove(function (evt) {
	//move player cursor indicator
	playerInfo.pointerX = evt.pageX / tableWidth;
	playerInfo.pointerY = evt.pageY / tableHeight;

	$('#' + playerInfo.id).css('left', evt.pageX);
	$('#' + playerInfo.id).css('top', evt.pageY);

	playerInfo.stateChanged = true;
});

$(window).mouseup(function(evt) {
	if (drawing) {
		var data = {fromX: prevDrawPointX, fromY: prevDrawPointY,
			toX: evt.pageX / canvas.width, toY: evt.pageY / canvas.height,
			playerID: playerInfo.id, color: playerInfo.color, mode: cursorMode}

		//draw on our own cavas first
		drawOnCanvas(data);
		//next send that info over to the server.
		socket.emit('new draw line', data);

		drawing = false;
	}
});

/**

Player Button Events

**/

$(document).on('click', '#pointer_icon', function(evt) {
	$('#pointer_icon').css('box-shadow', '0px 0px 0px 0.2vw ' + playerInfo.color);
	$('#pencil_icon').css('box-shadow', '');
	$('#eraser_icon').css('box-shadow', '');

	cursorMode = 'pointer';
	$('#drawing_area').css('cursor', 'default');
	$('.table').css('touch-action', 'auto');
	$('.clear_scroll_bar').css('display', 'none');
});
$(document).on('click', '#pencil_icon', function(evt) {
	$('#pencil_icon').css('box-shadow', '0px 0px 0px 0.2vw ' + playerInfo.color);
	$('#pointer_icon').css('box-shadow', '');
	$('#eraser_icon').css('box-shadow', '');

	cursorMode = 'pencil';
	$('#drawing_area').css('cursor', 'url(\'/resources/icons/pencil.png\'), crosshair');
	$('.table').css('touch-action', 'none');
	$('.clear_scroll_bar').css('display', 'block');
});
$(document).on('click', '#eraser_icon', function(evt) {
	$('#eraser_icon').css('box-shadow', '0px 0px 0px 0.2vw ' + playerInfo.color);
	$('#pointer_icon').css('box-shadow', '');
	$('#pencil_icon').css('box-shadow', '');

	cursorMode = 'eraser';
	$('#drawing_area').css('cursor', 'url(\'/resources/icons/eraser.png\'), cell');
	$('.table').css('touch-action', 'none');
	$('.clear_scroll_bar').css('display', 'block');
});
$(document).on('dblclick', '#eraser_icon', function(evt) {
	socket.emit('clear draw area');
});

$(document).on('click', '#question_icon', function(evt) {
  $('.info_text_container').toggleClass('info_text_container__active', true);
});
$(document).on('click', '.info_text_exit', function(evt) {
  $('.info_text_container').toggleClass('info_text_container__active', false);
});

$(document).on('click', '#terminal_icon', function(evt) {
  $('.terminal_container').toggleClass('terminal_container__active', true);
  $('#console_input').focus();
});
$(document).on('click', '.terminal_exit', function(evt) {
  $('.terminal_container').toggleClass('terminal_container__active', false);
});
$(document).on('click', '#wallpaper_icon', function(evt) {
  socket.emit('cycle wallpaper');
});



/**

send our player state to the server

**/

//emit the player position 24 times per second
setInterval(function() {
	//only emit the player state if we have received an id from the server.
	if (playerInfo.username != 'null') {
    // only send info to the server if the state has actually changed
		if (playerInfo.stateChanged) {
			socket.emit('broadcast player state', playerInfo);
			playerInfo.stateChanged = false;
		}
    
	}
}, 1000 / 24);

/**

Listen for the sever for states of the deck, chips, and other players.

**/

//listen for the state of the table from server
socket.on('state', function(param) {

});

//if we recieve confirmation from the server that we can move the chip, set the state to dragging.
socket.on('pickup confirmation', function(targetPickupChip) {
	if (targetPickupChip.id == targetChip.id)
		draggingChipConfirm = true;
});

//listen for reset chip call from server
socket.on('reset chip', function(chipIndex) {
	//animate the cards returning to the deck
	$('#' + chipIndex).toggleClass('card_return_to_deck_anim', true);
	setTimeout(function() {
		$('#' + chipIndex).toggleClass('card_return_to_deck_anim', false);
	}, 1000);
});


/**

canvas line drawing events

**/

function drawOnCanvas(data) {
	ctx.beginPath();

	if (data.mode == 'pencil') {
		ctx.globalCompositeOperation = 'source-over';
		ctx.strokeStyle = data.color;
		ctx.lineWidth = 3;
	} else if (data.mode == 'eraser') {
		ctx.globalCompositeOperation = 'destination-out';
		ctx.lineWidth = 20;
	}

	ctx.moveTo(data.fromX * canvas.width, data.fromY * canvas.height);
	ctx.lineTo(data.toX * canvas.width, data.toY * canvas.height);
	ctx.lineJoin = ctx.lineCap = 'round';
	ctx.stroke();
	ctx.closePath();
}

var craterSprite = new Image();
craterSprite.src = '/resources/images/sprites/crater.png';

function drawExplosionOnCanvas(data) {
  ctx.drawImage(craterSprite, (data.x / 100) * canvas.width, (data.y / 100) * canvas.height,
                              (2.5 / 100) * canvas.width, (5 / 100) * canvas.height);
}

socket.on('new draw line', function(data) {
	//if not us we draw the line from the other user.
	if (data.playerID != playerInfo.username)
		drawOnCanvas(data);
});

socket.on('draw new explosion', function(data) {
  drawExplosionOnCanvas(data);
});

socket.on('clear draw area', function() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
});

socket.on('load new wallpaper', function(wallpaper) {
  // remove the old wallpaper
  $('.table').removeClass('poker_table__bg_' + wallpaper.previous);
  
  // add the new wallpaper
  $('.table').addClass('poker_table__bg_' + wallpaper.current);
});

/**

Client Side server commands

*/
var consoleInputMem = [];
var memIndex = 0;

$('#console_input').keydown(function(event) {
  if ((event.keyCode == 13 || event.which == 13) && $('#console_input').val() != '') {
    let inputText = $('#console_input').val();
    
    scmd(inputText);
    
    // append the input into memory
    consoleInputMem.push(inputText);
    memIndex = consoleInputMem.length - 1;
    // clear the value of the input area
    $('#console_input').val('');
  } else if (event.keyCode == 38 || event.which == 38) {
    // up arrow pressed
    if (memIndex >= 0) {
      $('#console_input').val(consoleInputMem[memIndex]);
      memIndex--;
    }
  } else if (event.keyCode == 40 || event.which == 40) {
    // down arrow pressed
    if (memIndex < consoleInputMem.length) {
      $('#console_input').val(consoleInputMem[memIndex]);
      memIndex++;
    }
  }
});

function scmd(command) {
	socket.emit('console command', {command: command, id: playerInfo.id});
}

socket.on('console response', function(response) {
	console.log(response);
  
  $('.terminal_console').append('<div class="output_line">' + response.replace(/\n/g, '<br>') + '</div><br>');
  
  var element = document.getElementById("terminal_console");
  element.scrollTop = element.scrollHeight;
});
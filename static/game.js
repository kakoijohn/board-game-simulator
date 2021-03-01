/**

Setup sockets and event listeners

**/

var socket = io();
let socketWasConnected = false;

socket.on('message', function(data) {
  console.log(data);
});

socket.on('connect', function() {
  if (socketWasConnected) {
    despawnAllEntities();

    newPlayerSubmit();

    console.log("Re-established connection to server.");
    $('.disconnected_screen').css('display', 'none');
  }
});

socket.on('disconnect', function() {
  console.log("Disconnected from server... Waiting for reconnect...");
  $('.disconnected_screen').css('display', 'block');
});

socket.on('reload page', function() {
	location.reload();
});

$(document).on('click', '.name_submit_btn', function(evt) {
  newPlayerSubmit();
});

$('#dname').keypress(function(event) {
    if (event.keyCode == 13 || event.which == 13)
        newPlayerSubmit();
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
        touchend: "mouseup",
        touchenter: "mouseenter",
        touchleave: "mouseleave"
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
    document.addEventListener("touchenter", touchHandler, true);
    document.addEventListener("touchleave", touchHandler, true);
}

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

	tableWidth = $('#table').width();
	tableHeight = $('#table').height();
  
  $('#table_container').scrollLeft((tableWidth / 2) - 400);
  $('#table_container').scrollTop((tableHeight / 2) - 200);
  //TODO change this to
  //actually be in middle of screen

	// canvas.width = tableWidth;
	// canvas.height = tableHeight;
});

$(window).resize(function() {

	// inMemCanvas.width = tableWidth;
	// inMemCanvas.height = tableHeight;
	// inMemCtx.drawImage(canvas, 0, 0, tableWidth, tableHeight);

	// canvas.width = tableWidth;
	// canvas.height = tableHeight;

	// ctx.drawImage(inMemCanvas, 0, 0);
});



/**

Game Vars

**/

let drawing;
let cursorMode;

/**

Player Mouse Events

**/


$(document).on('mousedown', '#drawing_area', function(evt) {
	if (evt.which == 1 && (cursorMode == 'pencil' || cursorMode == 'eraser')) {
		drawing = true;
    
		prevDrawPointX = evt.pageX / canvas.width;
		prevDrawPointY = evt.pageY / canvas.height;
	}
});

$(document).on('touchstart', '#drawing_area', function(evt) {
	if (evt.touches.length > 1)
		drawing = false;
});

$(window).mouseup(function(evt) {
  if (drawing) {
		var data = {
      fromX: prevDrawPointX,
      fromY: prevDrawPointY,
			toX: evt.pageX / canvas.width,
      toY: evt.pageY / canvas.height,
			playerID: playerInfo.id,
      color: playerInfo.color,
      mode: cursorMode
    }

		//draw on our own cavas first
		drawOnCanvas(data);
		//next send that info over to the server.
		socket.emit('new draw line', data);

		drawing = false;
	}
});



/**

Listen for the sever for states of the deck, chips, and other players.

**/

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

socket.on('new draw line', function(data) {
	//if not us we draw the line from the other user.
	
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
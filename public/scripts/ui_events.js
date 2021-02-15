const inventoryIndex = 2; // TODO update these variables to load from JSON config
const backpackIndex = 3; // TODO update ^

$(document).on('mouseenter', '#ui_inventory', function(evt) {
  if (targEnt.active && entityIsOverHome(targEnt, inventoryIndex)) {
    targEnt.isOverHome = true;
    
    let htmlID = targEnt.location + '_' + targEnt.id;
    
    $('#ui_inventory').toggleClass('inventory_area__active', true);
    $('#' + htmlID).toggleClass('entity__over_inventory', true);
    
    $('#inventory').append('<div class="item" id="placeholder_item"></div>');
  }
});

$(document).on('mouseleave', '#ui_inventory', function(evt) {
  if (targEnt.isOverHome) {
    deactivateHome();
  }
});

$(document).on('mouseenter', '#ui_backpack', function(evt) {
  if (targEnt.active && entityIsOverHome(targEnt, backpackIndex)) {
    targEnt.isOverHome = true;
    
    let htmlID = targEnt.location + '_' + targEnt.id;
    
    $('#ui_backpack').toggleClass('inventory_area__active', true);
    $('#' + htmlID).toggleClass('entity__over_inventory', true);
    
    $('#backpack').append('<div class="item" id="placeholder_item"></div>');
  }
});

$(document).on('mouseleave', '#ui_backpack', function(evt) {
  if (targEnt.isOverHome) {
    deactivateHome();
  }
});

function deactivateHome() {
  targEnt.isOverHome = false;
  
  let htmlID = targEnt.location + '_' + targEnt.id;
  
  $('#ui_inventory').toggleClass('inventory_area__active', false);
  $('#ui_backpack').toggleClass('inventory_area__active', false);
  $('#' + htmlID).toggleClass('entity__over_inventory', false);
  
  $('#placeholder_item').remove();
}

$(document).on('click', '.plus-minus', function(evt) {
  let idParts = $(evt.target).attr('id').split('_');
  let playerID = idParts[0];
  let plusMinus = idParts[1];
  let delta = 0;
  
  if (plusMinus == 'plus') {
    delta = 1;
  } else {
    delta = -1;
  }
  
  socket.emit('update player points', {
    sourceID: playerInfo.id,
    playerID: playerID,
    delta: delta
  });
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
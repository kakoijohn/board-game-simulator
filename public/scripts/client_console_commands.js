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
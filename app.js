//Set up the express server and socketio engine on top of that server
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var path = require("path");
//All game code is in application folder
app.use(express.static(__dirname + '/public'));
//Routing
app.get('/', function(req, res){
  res.sendFile(path.join(__dirname+'/public/index.html'));
});
//Go to lobby
app.get('/chat', function(req, res){
  res.sendFile(path.join(__dirname+'/public/chat.html'));
});
//Declare variables to keep track of players
var playerCount = 0;
var id = 0;
var tagged = false;

var usernames = {};
var rooms = ['lobby'];
var AllRooms = {'lobby':''};

io.on('connection', function (socket) {
  playerCount++;
  id++;
  socket.room = 'game';
  socket.join('game');
  setTimeout(function () {
    if (!tagged) {
      socket.emit('connected', { playerId: id, tagged: true });
    } else {
      socket.emit('connected', { playerId: id });
    }
    io.emit('count', { playerCount: playerCount });
  }, 1500); //Delay by 1.5 seconds to let the page buffer
  //Handle the disconnect logic
  socket.on('disconnect', function () {
    playerCount--;
    io.emit('count', { playerCount: playerCount });
    socket.disconnect();
  });
  //Receive updated information from the players
  socket.on('update', function (data) {
    if (data['tagged']) {
      tagged = true;
    }
    //Send information to everyone but this socket
    socket.broadcast.emit('updated', data);
  });

  socket.on('tag', function (data) {
    io.emit('tagged', data);
  });


  socket.on('message_to_server', function(data) {
    // This callback runs when the server receives a new message from the client.
    console.log("message: "+data["message"]); // log it to the Node.JS output
    var msg = data["message"];
    //emit it only to people in the room
    io.sockets.in(socket.room).emit("message_to_client", socket.username, msg);
});

socket.on("addUser", function(username){
    socket.username = username;
    socket.room = 'lobby';
    usernames[username] = socket.room;
    socket.join('lobby');
    //Log the new user to the console
    console.log("Added User " + username);
    socket.emit('updateAddRoom', rooms, socket.room);
    socket.broadcast.to('lobby').emit('updatechat', username, 'has connected to the chat room');
    io.sockets.in(socket.room).emit('updateUsers', socket.room, usernames);
});


socket.on("privateMsg", function(target, msg, sender){
  //If they are in the same chat room
  if(usernames[target] == socket.room){
    //Send it back to the client
    socket.broadcast.to(socket.room).emit('privMess', target, msg, sender);
  }
});
socket.on("goGame", function(){
  var old = 'lobby';
  var newroom = 'game';
  socket.leave(socket.room);
  socket.join(newroom);
  usernames[socket.username] = newroom;
  socket.broadcast.to('lobby').emit('updatechat', socket.username, 'has left the chat room');
  io.sockets.in(old).emit('updateUsers', old, usernames);
  playerCount++;
});
socket.on("goChat", function(){
  var old = 'game';
  var newroom = 'lobby'
  socket.leave(socket.room);
  socket.join(newroom);
  socket.room = newroom;
  playerCount--;
  io.emit('count', { playerCount: playerCount });
});


});
//If the tagger disconnects, then the next connecting player will be made the tagger
setInterval(function () {
  tagged = false;
}, 3000);
//Listen on port 
var port = process.env.PORT || 5000;
server.listen(port);
console.log("Multiplayer app listening on port " + port);

//Instantiate array of player objects
var players = [];
//Create a socket that connects with the server
var socket = io.connect('/');
//Declare Ui Players from the document
var UiPlayers = document.getElementById("players");
var chatButton = document.getElementById("chatter");
var selfId, player;
//Create Quintus Game engine
var Q = Quintus({audioSupported: [ 'wav','mp3' ]})
      .include('Sprites, Scenes, Input, 2D, Anim, Touch, UI, Audio')
      .setup({ maximize: true })
      .enableSound()
      .controls().touch();
//Disable gravity
Q.gravityY = 0;
//Custom Quintus classes
var objectFiles = [
  './src/player'
];
//Create mane game stage
require(objectFiles, function () {
  chatButton.addEventListener("click", function(){
    socket.emit("goChat");
  });
  //Setup function that oversees communication with socket
  function setUp (stage) {
    socket.on('count', function (data) {
      //Update text on the document
      UiPlayers.innerHTML = 'Players: ' + data['playerCount'];
    });

    socket.on('connected', function (data) {
      //Save the id
      selfId = data['playerId'];
      if (data['tagged']) {
        //Create a new Player object w/ passed properties
        player = new Q.Player({ playerId: selfId, x: 100, y: 100, socket: socket });
        player.p.sheet = 'enemy'
        player.p.tagged = true;
        stage.insert(player);
      } else {
        player = new Q.Player({ playerId: selfId, x: 100, y: 100, socket: socket });
        //Add the playere to the stage
        stage.insert(player);
        player.trigger('join');
      }
      //Center the page around the player
      stage.add('viewport').follow(player);
    });
    //Have the socket listen for updated events
    socket.on('updated', function (data) {
      var actor = players.filter(function (obj) {
        return obj.playerId == data['playerId'];
      })[0];
      if (actor) {
        //Update an existing actor
        actor.player.p.x = data['x'];
        actor.player.p.y = data['y'];
        actor.player.p.sheet = data['sheet'];
        actor.player.p.opacity = data['opacity'];
        actor.player.p.invincible = data['invincible'];
        actor.player.p.tagged = data['tagged'];
        actor.player.p.update = true;
      } else {
        //Add a new actor
        var temp = new Q.Actor({ playerId: data['playerId'], x: data['x'], y: data['y'], sheet: data['sheet'], opacity: data['opacity'], invincible: data['invincible'], tagged: data['tagged'] });
        players.push({ player: temp, playerId: data['playerId'] });
        stage.insert(temp);
      }
    });

    socket.on('tagged', function (data) {
      if (data['playerId'] == selfId) {
        player.p.sheet = 'enemy';
        player.p.tagged = true;
      } else {
        var actor = players.filter(function (obj) {
          return obj.playerId == data['playerId'];
        })[0];
        if (actor) {
          actor.player.p.sheet = 'enemy'
        }
      }
    });
  }
  //Create the map
  Q.scene('arena', function (stage) {
    stage.collisionLayer(new Q.TileLayer({ dataAsset: '/maps/arena.json', sheet: 'tiles' }));
    setUp(stage);
  });
  //Images used for the game
  var files = [
    '/images/tiles.png',
    '/maps/arena.json',
    '/images/sprites.png',
    '/images/sprites.json'
  ];
  //Join the files
  Q.load(files.join(','), function () {
    Q.sheet('tiles', '/images/tiles.png', { tilew: 32, tileh: 32 });
    Q.compileSheets('/images/sprites.png', '/images/sprites.json');
    Q.stageScene('arena', 0);
  });
});

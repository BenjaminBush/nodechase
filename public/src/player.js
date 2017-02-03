Q.Sprite.extend('Actor', {
  init: function (p) {
    this._super(p, {
      update: true
    });

    var temp = this;
    setInterval(function () {
      if (!temp.p.update) {
        temp.destroy();
        playerCount--;

      }
      temp.p.update = false;
    }, 8000);
  }
});

require([], function () {
  Q.Sprite.extend('Player', {
      init: function (p) {
        this._super(p, {
          //Declare default values
          sheet: 'player',
          tagged: false,
          score: 0,
          invincible: false,
          vyMult: 1
        });
        this.add('2d, platformerControls, animation');
        //Add some event Listeners
        this.addEventListeners();
      },
      addEventListeners: function () {
        //Check if a player is tagged or hit a wall (from Quintus engine)
        this.on('hit', function (collision) {
          if (this.p.tagged && collision.obj.isA('Actor') && !collision.obj.p.tagged && !collision.obj.p.invincible) {
            var start = window.performance.now();
            //Increment their score for tagging somebody else (reward active gameplay!)
            this.p.score++;
            document.getElementById("score").innerHTML = 'Score: '+ this.p.score;
            this.p.socket.emit('tag', { playerId: collision.obj.p.playerId });
            this.p.tagged = false;
            this.p.sheet = 'player';
            //Go invicible
            this.p.invincible = true;
            //Indicate invincibility visibly
            this.p.opacity = 0.5;
            //Give them increased speed!
            this.p.speed = 300;
            this.p.vyMult = 1.5;
            var temp = this;
            var delay = window.performance.now() - start;

            setTimeout(function () {
              temp.p.invincible = false;
              temp.p.opacity = 1;
              temp.p.speed = 200;
              temp.p.vyMult = 1;
            }, 3000);
          }

            //Right after you tag somebody, you go invisible but go slow (aka THA JUKES!)
          else if (!this.p.tagged && collision.obj.isA('Actor') && !collision.obj.p.tagged && !collision.obj.p.invincible) {
              //Indicate slowing down visibly
              this.p.opacity = 0.01;
              //Give them decreased speed!
              this.p.speed = 140;
              this.p.vyMult = 0.6;
              var temp = this;
              setTimeout(function () {
                temp.p.invincible = false;
                temp.p.opacity = 1;
                temp.p.speed = 200;
                temp.p.vyMult = 1;
              }, 1750);
          }
        });
        //On join, give them a handicap
        this.on('join', function () {
          this.p.invincible = true;
          this.p.opacity = 0.5;
          this.p.speed = 300;
          this.p.vyMult = 1.5;
          var temp = this;
          setTimeout(function () {
            temp.p.invincible = false;
            temp.p.opacity = 1;
            temp.p.speed = 200;
            temp.p.vyMult = 1;
          }, 3000);
        });
      },
    //Step function is called by Quintus to update player class
    step: function (dt) {
      //Keyboard inputs
      if (Q.inputs['up']) {
        this.p.vy = -200;
      } else if (Q.inputs['down']) {
        this.p.vy = 200;
      } else if (!Q.inputs['down'] && !Q.inputs['up']) {
        this.p.vy = 0;
      }
      //Send information back to the server
      this.p.socket.emit('update', { playerId: this.p.playerId, x: this.p.x, y: this.p.y, sheet: this.p.sheet });
    }
  });
});

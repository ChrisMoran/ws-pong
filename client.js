$(document).ready(function() {
	Util = (function(){ 
	    var _msg = $("#messages");
	    
	    function printSafe(str) {
			return str.replace('&', '&amp').replace('<', '&lt').replace('>', '&gt');
		}
	
	    return {
	        log : function(msg) {
			    _msg.append(printSafe(msg)+"<br/>");
		    },
		    getWebSocketAddress : function() {
		        return "ws://" + window.location.host;
		    }
	    };
    })();
	
	var canvas = $('#main-canvas')[0];
	
	if(canvas && canvas.getContext && ("WebSocket" in window)) {
		var context = canvas.getContext('2d');
		canvas.width = 800;
		canvas.height = 600;
		var Game = { 
		        player : new Paddle(20, 100, 15, 60, canvas.width, canvas.height),
		        socket : new WebSocket(Util.getWebSocketAddress()),
		        isActive : false,
                fillBackground : function() {
                    context.fillStyle = this.colors.background;
                    context.fillRect(0,0,canvas.width, canvas.height);
                },
                sendObj : function(o) {
                    this.socket.send(JSON.stringify(o));
                }
		    },
		    Keys = {
		        UP : 38,
		        DOWN : 40,
		        downHandler : function(evt) {
		            Keys.activeKeys[evt.keyCode] = true;
		        },
		        upHandler : function(evt) {
		            if(Keys.activeKeys[evt.keyCode]) {
		                Keys.activeKeys[evt.keyCode] = false;
		            }
		        },
		        isPressed : function(code) {
		            return Keys.activeKeys[code];
		        },
		        init : function() {
		            this.activeKeys = {};
		            this.activeKeys[this.UP] = false;
		            this.activeKeys[this.DOWN] = false;
		        }
		    },
			updateTime = Math.floor(1000/60);
		Keys.init();
		
		Game.socket.onopen = function() {
			//do nothing for now
		}
		
		document.onkeydown =  Keys.downHandler;
		document.onkeyup = Keys.upHandler;
		
		Game.socket.onmessage = function(evt) {
			var msg = JSON.parse(evt.data);
			if(msg.type === Messages.Init) {
			    if(msg.id) {
			        Util.log("my id : " + msg.id);
			        Game.player.id = msg.id;
			    }
			    if(msg.opponent) {
			        Game.opponent = new Paddle(760, 100, 15, 60, canvas.width, canvas.height);
			        Game.ball = new Ball(canvas.width/2, canvas.height/2, canvas.width, canvas.height, 10);
                    Game.ball.checkBounds = function() {
                        if(Game.ball.atBounds && Game.owner) {
                            if(Game.ball.x === Game.ball.maxX) {
                                Game.ball.vx = -Math.abs(Game.ball.vx);
                            } else if(Game.ball.x === Game.ball.min) {
                                Game.ball.vx = Math.abs(Game.ball.vx);
                            }
                            
                            if(Game.ball.y === Game.ball.maxY) {
                                Game.ball.vy = -Math.abs(Game.ball.vy);
                            } else if(Game.ball.y === Game.ball.min) {
                                Game.ball.vy = Math.abs(Game.ball.vy);
                            }
                            
                            Game.sendObj({type:Messages.BallUpdate, position : {x:canvas.width - Game.ball.x,y:Game.ball.y},velocity : { x : -Game.ball.vx, y : Game.ball.vy }});
                        }
                    };
			        Game.opponent.id = msg.opponent;
			        Game.match = msg.match;
			        Game.tossValue = Math.random();
			        Game.sendObj({type:Messages.Toss, value : Game.tossValue});
			        
			        Game.isActive = true;
			    }
			} else if(msg.type === Messages.Update) {
			    Game.opponent.y = msg.position.y;
			} else if(msg.type === Messages.BallUpdate) { //update ball velocity
			    Game.ball.vx = msg.velocity.x;
			    Game.ball.vy = msg.velocity.y;
			    if(msg.position) {
			        Game.ball.x = msg.position.x;
			        Game.ball.y = msg.position.y;
			    }
			} else if(msg.type === Messages.BallOwner) { //change ball's owner
			    Game.owner = true;
			    if(msg.velocity) {
			        Game.ball.vx = msg.velocity.x;
			        Game.ball.vy = msg.velocity.y
			    }
			    if(msg.position) {
			        Game.ball.x = msg.position.x;
			        Game.ball.y = msg.position.y;
			    }
			} else if(msg.type === Messages.Toss) {
			    if(msg.value > Game.tossValue) {
			        Game.owner = false;
			    } else if(msg.value < Game.tossValue) {
			        Game.owner = true;
			        Game.ball.vx = -0.1;
			        Game.ball.vy = 0.1;
			        Game.sendObj({type:Messages.BallUpdate, velocity : { x : -Game.ball.vx, y : Game.ball.vy }});
			    } else {
			        Game.tossValue = Math.random()
			        Game.sendObj({type:Messages.Toss, value : Game.tossValue});
			    }
			}else if(msg.type === Messages.Close) {
			    Game.isActive = false;
			    Util.log("Opponent left");
			}
		};
		
		Game.sendPosition = (function() {
		    var oldPosition = Game.player.y;
		    
		    return function(msg) {
		        if(Math.abs(oldPosition - msg.position.y) > 10) {
		            oldPosition = msg.position.y;
		            Game.sendObj(msg);
		        }
		    };
		})();
		Game.player.halfHeight = Game.player.height / 2;
		Game.player.checkCollision = function(ball) {
		    if(Game.owner) {
                var rightEdge = Game.player.x + Game.player.width,
                    middle = Game.player.x + (Game.player.width / 2),
                    ballLeftEdge = ball.x - ball.radius;
                
                if(ballLeftEdge <= rightEdge && ballLeftEdge > middle) {
                    if(ball.y >= Game.player.y && ball.y < (Game.player.y + Game.player.height)) {
                        ball.vx = Math.abs(ball.vx);
                        Game.owner = false;
                        Game.sendObj({type:Messages.BallOwner, velocity : {x:-ball.vx,y:ball.vy},position:{x:canvas.width-ball.x,y:ball.y}});
                    }
                }
		    }
		};
		
		var startTime = 0;
		Game.loop = function() {
		    startTime = (startTime + updateTime) % 1000;
		    Game.fillBackground();
		    if(Game.isActive) {
                if(Keys.isPressed(Keys.UP) && !Keys.isPressed(Keys.DOWN)) {
                    Game.player.vy = -0.8;
                    Game.player.updatePosition(updateTime);
                } else if(Keys.isPressed(Keys.DOWN) && !Keys.isPressed(Keys.UP)) {
                    Game.player.vy = 0.8;
                    Game.player.updatePosition(updateTime);
                } else {
                    Game.player.vy = 0;
                    Game.player.wobble(startTime/1000);
                }
                Game.ball.updatePosition(updateTime);
                Game.ball.checkBounds();
                Game.player.checkCollision(Game.ball);
                Game.player.draw(context);
                Game.opponent.draw(context);
                Game.ball.draw(context);
                
                
                Game.opponent.wobble(startTime/1000);
                Game.sendPosition({type: Messages.Update, position : {y : Game.player.y}});
			} 
		}
		setInterval(Game.loop, updateTime);
		Util.log("Waiting for opponent");
	} else {
		//Browser not supported!!
	}
});
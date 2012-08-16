Paddle.prototype = new ScreenObj;
Paddle.prototype.constructor = Paddle;

function Paddle(x, y, width, height, maxX, maxY) {
	this.x = x,
	this.y = y,
	this.width = width,
	this.height = height;
	this.vy = 0;
	this.vx = 0;
	this.color = "#5f6870";
	this.maxX = maxX - this.width;
	this.maxY = maxY - this.height;
}

Paddle.prototype.wobble = function(time) {
    if(!this.origin) {
        this.origin = this.x;
    }
    this.x = this.origin + 1.5 * Math.sin(6*time*Math.PI);
}


Paddle.prototype.draw = function(canvasContext) { 
	canvasContext.fillStyle = this.color;
	canvasContext.fillRect(this.x, this.y, this.width, this.height);
}

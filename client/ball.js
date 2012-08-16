Ball.prototype = new ScreenObj;
Ball.prototype.constructor = Ball;

function Ball(x, y, maxX, maxY, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.width = radius * 2;
    this.height = this.width;
    this.vx = 0;
    this.vy = 0;
    this.color = "#5f6870";
    this.border = "#444";
	this.maxX = maxX - this.radius;
	this.maxY = maxY - this.radius;
	this.min = radius;
}

Ball.prototype.draw = function(context) {
    context.fillStyle = this.color;
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = this.border;
    context.stroke();
}


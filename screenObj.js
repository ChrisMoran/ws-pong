function ScreenObj() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.maxX = 0;
    this.maxY = 0;
    this.min = 0;
    this.atBounds = false;
}

ScreenObj.prototype._move = function(prop, delta, max) {
	this[prop] += delta;
	if(this[prop] > max) { this[prop] = max; this.atBounds = true;}
	else if(this[prop] < this.min) { this[prop] = this.min; this.atBounds = true; }
}

ScreenObj.prototype.moveX = function(delta) {
	this._move("x", delta, this.maxX);
}

ScreenObj.prototype.moveY = function(delta) {
	this._move("y", delta, this.maxY);
}

ScreenObj.prototype.updatePosition = function(dt) {
	this.moveX(dt * this.vx);
	this.moveY(dt * this.vy);
}
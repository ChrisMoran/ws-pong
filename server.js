var http = require('http'),
	ws = require('websocket.io'),
	url = require('url'),
	fs = require('fs'),
	util = require('util'),
	HTTP_PORT = 8080,
	ENCODING = 'UTF-8',
	INDEX = "index.html";
	
	
function write404(res, fileName) {
	var body = "Could not find resource!";
	res.writeHead(404, {
		'Content-Length' : body.length,
		'Content-Type' : 'text.plain'
	});
	res.write(body);
	res.end();
}	

function respondWithData(res, data, type) {
	res.writeHead(200, {
		'Content-Length' : data.length,
		'Content-Type' : type
	});
	res.write(data);
	res.end();
}

var contentTypes = {
	"html" : "text/html",
	"js" : "text/javascript",
	"css" : "text/css"
};
function contentType(filePath) {
	var matches = /[^\s]+\.(\w+)/g.exec(filePath),
		ext = matches[1];
	return (ext in contentTypes) ? contentTypes[ext] : "text/plain";
}
	
http = http.createServer(function (req, res) {
	var path = url.parse(req.url).pathname || INDEX;
	path = __dirname + "/" + (path === "/" ? INDEX : path);
	fs.readFile(path, ENCODING, function(err, data) {
		if(data !== undefined) {
			respondWithData(res, data, contentType(path));		
		} else {
			var pathArr = path.split('/');
			write404(res, pathArr[pathArr.length-1]);
		}
	});
}).listen(HTTP_PORT);	
console.log('Started server on port %d', HTTP_PORT);	
	
var wss = ws.attach(http),
    Messages = require('./messages').Messages,
    util = require('util'),
    waitingPlayers = [],
    matchedPlayers = {},
    closeMsg = JSON.stringify({type: Messages.Close}),
    idStart = 1;

wss.on('connection', function(socket) {
	socket.id = idStart++;
	var initMessage = { type : Messages.Init, id : socket.id };
	if(waitingPlayers.length > 0) {
	    var opponentIndex = Math.floor(Math.random()*waitingPlayers.length);
	    var opponent = waitingPlayers[opponentIndex];
	    waitingPlayers.splice(opponentIndex, 1);
	    
	    var matchId = opponent.id > initMessage.id ? initMessage.id + ":" + opponent.id : opponent.id + ":" + initMessage.id;
	    matchedPlayers[matchId] = {  };
	    matchedPlayers[matchId][initMessage.id] = socket;
	    matchedPlayers[matchId][opponent.id] = opponent.socket;
	    
	    opponent.socket.send(JSON.stringify({type:Messages.Init, match:matchId, opponent : initMessage.id}));
	    initMessage.match = matchId;
	    initMessage.opponent = opponent.id;
	    opponent.socket.match = matchId;
	    opponent.socket.opponent = initMessage.id;
	    socket.opponent = opponent.id;
	    socket.match = matchId;
	    
	} else {
	    waitingPlayers.push({id : initMessage.id, socket : socket});
	}
	
	socket.send(JSON.stringify(initMessage));
	socket.on('message', function(message) { //keep this as simple as possible 
		if(socket.match && socket.opponent && matchedPlayers[socket.match]) {
		    matchedPlayers[socket.match][socket.opponent].send(message);
		}
	});
	
	socket.on('close', function() {
	    console.log("Closing " + socket.id);
	    if(socket.match && matchedPlayers[socket.match]) {
	        matchedPlayers[socket.match][socket.opponent].send(closeMsg);
	        waitingPlayers.push({id : socket.opponent, socket : matchedPlayers[socket.match][socket.opponent]});
	        delete matchedPlayers[socket.match];
	         //TODO: match if waiting
	        return;
	    }
		
		for(var i = 0; i < waitingPlayers.length; ++i) {
		    if(waitingPlayers[i].id === socket.id) {
		        waitingPlayers.splice(i, 1);
		        return;
		    }
		}
	});
});	
console.log('Started websocket server on port %d', HTTP_PORT);





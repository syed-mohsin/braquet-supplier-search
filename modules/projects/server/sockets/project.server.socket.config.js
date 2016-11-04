'use strict';

// Create the bid socket configuration
module.exports = function(io, socket) {
	// Emit the connected status when client connects
	io.emit('bidMessage', {
		type: 'status',
		text: 'Is now connected',
		created: Date.now(),
		username: ''
	});

	// update bid value for all connected sockets
	socket.on('bidMessage', function(message) {
		message.type = 'bid';
		message.created = Date.now();
		message.username = '';

		// Emit the 'bid' event
		console.log("about to send bid to everyone");
		io.emit('bidMessage', message);
		console.log("sent bid to everyone");
	});
};
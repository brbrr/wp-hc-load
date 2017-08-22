import HCAuth from './HCAuth';
import HCSocket from './HCSocket';

const auth = new HCAuth();
auth.doAuth().then( () => {
	const socket = new HCSocket();
	socket.open( auth.store.vars.usrId, auth.store.vars.jwt )
	setInterval( () => {
		socket.send( 'Sending message every 3 sec. Sent at: ' + Date.now() )
	}, 10000 ); // repeat forever, polling every 3 seconds
} );


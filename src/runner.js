import HCAuthenticator from './HCAuthenticator';
import HCSocket from './HCSocket';
import config from 'config';
import pry from 'pryjs';

const accounts = config.get( 'testAccounts' )
const poll = config.get( 'pollingTime' )

let sockets = [];

Object.keys( accounts ).forEach( account => {
	const user = config.get( 'testAccounts' )[ account ]
	if ( user === undefined ) {
		throw new Error( `Account key '${account}' not found in the configuration` );
	}
	const interval = poll + ( Math.random() * 10 )

	const auth = new HCAuthenticator();
	auth.doAuth( user ).then( () => {
		const socket = new HCSocket();
		sockets.push( socket );
		socket.open( auth.store.vars.usrId, auth.store.vars.jwt, user[2] )
		setInterval( () => {
			socket.emit( 'ping', 1 );
			socket.message( `Sending message every ${interval} sec. Sent at: ` + Date.now() );
		}, interval * 1000 ); // repeat forever, polling every  seconds
	} );
} )

eval( pry.it )

// TODO:
// Define some terminate function to nicely close socket for every user.
process.on( 'SIGINT', () => {
	console.log( 'Terminating sockets' )
	closeAllSockets( sockets ).then( () => process.exit(0) );
} );

function closeAllSockets( ary ) {
	return new Promise( ( resolve ) => {
		console.log( `Closing all streams. Total: ${sockets.length}` );
		ary.forEach( ( socket ) => {
			return socket.openSocket.then( ( s ) => s.close() );
		} )
		return setTimeout( () => ( resolve() ), 1000 );
	} )
}

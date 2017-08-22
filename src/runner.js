import HCAuthenticator from './HCAuthenticator';
import HCSocket from './HCSocket';
import config from 'config';

const accounts = config.get( 'testAccounts' )
const poll = config.get( 'pollingTime' )

// TODO:
// Define some terminate function to nicely close socket for every user.

Object.keys( accounts ).forEach( account => {
	const user = config.get( 'testAccounts' )[ account ]
	const interval = poll + ( Math.random() * 10 )

	const auth = new HCAuthenticator();
	auth.doAuth( user ).then( () => {
		const socket = new HCSocket();
		socket.open( auth.store.vars.usrId, auth.store.vars.jwt, user[2] )
		setInterval( () => {
			socket.send( `Sending message every ${interval} sec. Sent at: ` + Date.now() )
		}, interval * 1000 ); // repeat forever, polling every  seconds
	} );
} )

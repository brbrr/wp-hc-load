import config from 'config';
import pry from 'pryjs';

import HCAuthenticator from './HCAuthenticator';
import HCSocket from './HCSocket';

export function setupCli( user ) {
	if ( user === undefined ) {
		user = config.get( 'testAccounts' ).defaultHEUser
	}
	let socket;
	const auth = new HCAuthenticator();
	return auth.doAuth( user ).then( () => {
		socket = new HCSocket();
		socket.open( auth.store.vars.usrId, auth.store.vars.jwt, user[2] )
	} ).then( () => socket );
}

export default function runHC( user ) {
	const interval = config.get( 'pollingTime' ) + ( Math.random() * 10 )

	return setupCli( user ).then( ( socket ) => {
		setInterval( () => {
			socket.emit( 'ping', 1 );
			socket.message( `Sending message every ${interval} sec. Sent at: ` + Date.now() );
		}, interval * 1000 );
		return socket;
	} );
}


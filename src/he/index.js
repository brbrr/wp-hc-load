import config from 'config';
import pry from 'pryjs';

import HESocket from './HESocket';
import HEAuthenticator from './HEAuthenticator';

export default function runHE() {
	const url = config.get( 'happyChatURL' ) + '/operator';

	return setupCli( url );
}

export function setupCli( url ) {
	const auth = new HEAuthenticator();

	return auth.login().then( () => {
		console.log( auth.store )
		return new HESocket( url, auth.store.token );
	} );
}

export const UNAVAILABLE = 'unavailable';
export const AVAILABLE = 'available';
export const BUSY = 'busy';
export const UNKNOWN = 'unknown';
export const RESERVE = 'reserve';

export function setOperationStatus( hECli, status ) {
	hECli.withSocket().then( ( ( socket ) =>
		socket.emit( 'broadcast.dispatch', {
			type: 'SET_OPERATOR_STATUS', status: status
		} ) ) )
}

import config from 'config';
import pry from 'pryjs';

import HESocket from './HESocket';
import HEAuthenticator from './HEAuthenticator';

export default function runHE() {
	const url = config.get( 'happyChatURL' ) + '/operator';
	const auth = new HEAuthenticator();

	return auth.login().then( () => {
		console.log( auth.store )
		return new HESocket( url, auth.store.token );
	} );
}

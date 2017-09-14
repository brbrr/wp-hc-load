import config from 'config';
import pry from 'pryjs';

import runHC from './user'

const accounts = config.get( 'testAccounts' )
let sockets = [];
let usersCount = 1;
if ( process.env.COUNT && process.env.COUNT > 1 ) {
	usersCount = process.env.COUNT;
}

for ( let i = 0; i < usersCount; i++ ) {
	let user = accounts[Object.keys( accounts )[i]]
	const socket = runHC( user );
	sockets.push( socket );
}

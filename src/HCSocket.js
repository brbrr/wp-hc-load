import config from 'config';
import IO from 'socket.io-client';
import { v4 as uuid } from 'uuid';
const debug = require( 'debug' )( 'load:happychat:socket' );

export default class HCSocket {
	open( signer_user_id, jwt, locale = 'en' ) {
		this.openSocket = new Promise( resolve => {
			const url = config.get( 'happyChatURL' );
			const socket = new IO( url );
			socket
				.once( 'connect', () => debug( 'connected' ) )
				.on( 'init', () => {
					debug( 'INIT connected' );
					resolve( socket );
				} )
				.on( 'token', handler => {
					handler( { signer_user_id, jwt, locale, groups: ['WP.com'] } );
				} )
				.on( 'unauthorized', () => {
					socket.close();
					debug( 'Not authorized!! Socket closed' );
				} )
				.on( 'disconnect', reason => debug( 'Disconnected: ' + reason ) )
				.on( 'reconnecting', () => debug( 'reconnecting' ) )
			// Received a chat message
				.on( 'message', message => debug( 'Receive message: ' + JSON.stringify( message ) ) )
			// Received chat status new/assigning/assigned/missed/pending/abandoned
				.on( 'status', status => debug( 'Chat status update: ' + status ) )
			// If happychat is currently accepting chats
				.on( 'accept', accept => debug( 'HC is accepting chats' + accept ) );
		} );
		return this.openSocket;
	}

	send( message ) {
		this.openSocket
			.then(
				( socket ) => socket.emit( 'message', { text: message, id: uuid() } ),
				( e ) => debug( 'failed to send message: ' + e )
			);
	}

	typing( message ) {
		this.openSocket
			.then(
				socket => socket.emit( 'typing', { message } ),
				e => debug( 'failed to send typing', e )
			);
	}

	notTyping() {
		this.openSocket
			.then(
				socket => socket.emit( 'typing', false ),
				e => debug( 'failed to send typing', e )
			);
	}

	info( message ) {
		this.openSocket.then(
			socket => socket.emit( 'message', { text: message.text, id: uuid(), meta: { forOperator: true } } ),
			e => debug( 'failed to send message', e )
		);
	}

	transcript( timestamp ) {
		return this.openSocket.then( socket => Promise.race( [
			new Promise( ( resolve, reject ) => {
				socket.emit( 'transcript', timestamp || null, ( e, result ) => {
					if ( e ) {
						return reject( new Error( e ) );
					}
					resolve( result );
				} );
			} ),
			new Promise( ( resolve, reject ) => setTimeout( () => {
				reject( Error( 'timeout' ) );
			}, 10000 ) )
		] ) );
	}
}

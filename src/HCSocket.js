import config from 'config';
import IO from 'socket.io-client';
import { v4 as uuid } from 'uuid';

const debug = require( 'debug' )( 'load:happychat:cli' );

export default class HCSocket {
	open( signer_user_id, jwt, locale = 'en' ) {
		this.messages = {};
		this.openSocket = new Promise( resolve => {
			const url = config.get( 'happyChatURL' ) + '/customer';
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
				.on( 'message', message => {
					if ( this.messages[message.id] ) {
						this.messages[message.id].push( Date.now() );
						console.log( Date.now() - this.messages[message.id][0] );
					}
					return debug( 'Receive message: ' + JSON.stringify( message ) )
				} )
			// Received chat status new/assigning/assigned/missed/pending/abandoned
				.on( 'status', status => debug( 'Chat status update: ' + status ) )
			// If happychat is currently accepting chats
				.on( 'accept', accept => debug( 'HC is accepting chats' + accept ) )
				.on( 'pong', ( latency ) => console.log( `PONG LAT: ${latency}` ) );
		} );
		return this.openSocket;
	}

	emit( event, data ) {
		this.openSocket
			.then(
				( socket ) => {
					return socket.emit( event, data )
				},
				( e ) => debug( 'failed to send message: ' + e )
			);
	}

	message( message ) {
		this.openSocket
			.then(
				( socket ) => {
					const id = uuid();
					const timeNow = Date.now();
					this.messages[id] = [timeNow];
					return socket.send(
						{ text: message, id: id },
						( data ) => console.log( Date.now() - timeNow ) )
				},
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

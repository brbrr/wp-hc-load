/**
 * External dependencies
 */
import { map, evolve, prop } from 'ramda';
import io from 'socket.io-client';
/**
 * Module variables
 */
const debug = require( 'debug' )( 'load:happychat:he:cli' );

export default class HESocket {
	constructor( url, token ) {
		debug( 'connect to', url );

		const socket = io( url, {
			reconnectionDelayMax: 600000,
			randomizationFactor: 0
		} );

		return this.init( socket, token );
	}

	deinit( ) {
		debug( 'socketClient.deinit' );

		this.socket.removeAllListeners();
		this.socket.close();
		this.socket = null;
	}

	init( socket, token ) {
		debug( 'socketClient.init' );

		if ( this.socket ) {
			debug( 'socketClient already initialized' );

			// TODO: return error?
			return;
		}

		this.socket = socket;

		socket
			.on( 'broadcast.state', ( version, remoteState ) => {
				debug( `dispatch( replaceRemoteState( ${version}, ${remoteState} ) )` );
			} )
			.on( 'broadcast.update', ( version, nextVersion, patch ) => {
				debug( `dispatch( updateRemoteState( ${version}, ${nextVersion}, ${patch} ) )` );
			} );

		socket.on( 'connect', () => {
			debug( 'socket.connect' );

			socket.emit( 'token', token );
			this.clearReconnectCountdown();
		} );

		socket.on( 'unauthorized', () => {
			debug( 'socket.unauthorized' );
			return new Error( 'Your mission has ended, Agent W! Please log in and try again.' );
		} );

		this.reconnectCountdown = undefined;

		socket.on( 'reconnect', () => {
			debug( 'socket.reconnect' );

			this.clearReconnectCountdown();
		} );

		socket.on( 'reconnecting', ( attemptNum ) => {
			debug( 'socket.reconnecting' );
			const maxDelay = socket.io.opts.reconnectionDelayMax || 5000;
			const msForAttempt = Math.pow( 2, attemptNum ) * 1000;
			let retryMs = ( msForAttempt > maxDelay )
				? maxDelay
				: msForAttempt;

			this.clearReconnectCountdown();

			this.reconnectCountdown = setInterval( () => {
				if ( retryMs > 0 ) {
					retryMs -= 1000;
				}
			}, 1000 );
		} );

		socket.on( 'disconnect', reason => {
			debug( 'socket.disconnect', reason );

			socket.io.reconnect();
		} );

		socket.on( 'init', user => {
			// TODO: Review after which event - HE become connected (can interact w/ socket)
			this.connected = true;
			debug( 'socket.init', user );
		} );

		const failCallback = ( error ) => {
			debug( 'socket.error|fail', error );
		};

		socket.on( 'error', failCallback );

		socket.on( 'chat.open', ( { chat, session } ) => {
			debug( 'chat.open', chat, session );
		} );

		socket.on( 'chat.close', ( chat ) => {
			debug( 'chat.close', chat );
		} );

		socket.on( 'chat.leave', ( chat ) => {
			debug( 'chat.leave', chat );
		} );

		socket.on( 'chat.online', ( chatId, operators ) => {
			debug( 'chat.online', chatId, operators );
		} );

		socket.on( 'chat.observe', ( chat ) => {
			debug( 'chat.observe', chat );
			if ( chat.error ) {
				debug( 'chat.observe.error', chat );
				return;
			}
		} );

		socket.on( 'chat.message', ( from, message ) => {
			const { id } = from;
			debug( 'chat.message', from, message );

			// delayAction IMMEDIATE clears timer associated with the identifier
		} );

		socket.on( 'chat.typing', ( chat, user, text ) => {
			debug( 'chat.typing', chat, user, text );
		} );

		// We don't want to show stale stats if actual data hasn't
		// been received. For that reason, we will dispatch a
		// void receivedCapacityStats action if after the firs 30 seconds,
		// we haven't received any data yet.
		//
		// The same action will be programmed after receiving some data.
		//
		const STATS_TIMER = 30000;
		socket.on( 'stats', ( capacity ) => {
			// debug( 'stats', capacity )
		} );

		this.requestRemoteStateUpdate = () => this.getSocket()
			.then( s => s.emit( 'broadcast.state', ( version, remoteState ) => {
				debug( 'broadcast.state', version, remoteState );
			} ) );
	}

	getSocket( { mustBeConnected = true } = {} ) {
		return new Promise( ( resolve, reject ) => {
			if ( ! this.socket ) {
				return reject( new Error( 'Socket not initialized.' ) );
			}

			if ( mustBeConnected && ! this.socket.connected ) {
				return reject( new Error( 'Socket is not connected.' ) );
			}

			resolve( this.socket );
		} );
	}

	withSocket() {
		return this.getSocket();
	}

	reconnect() {
		return this.getSocket( { mustBeConnected: false } )
			.then( () => this.socket.connect() );
	}

	sendMessage( chatId, message ) {
		return this.withSocket()
			.then( socket => socket.emit( 'message', chatId, message ) );
	}

	bookmarkMessage( chatId, messageId, isBookmarked ) {
		return this.withSocket()
			.then( socket => new Promise( ( resolve, reject ) => {
				socket.emit( 'message.bookmark',
					chatId,
					messageId,
					isBookmarked,
					( error, result ) => {
						if ( error ) {
							return reject( error );
						}
						resolve( result );
					}
				);
			} ) );
	}

	leaveChat( chatId ) {
		debug( 'leaving chat', chatId );

		return this.withSocket()
			.then( socket => socket.emit( 'chat.leave', chatId ) );
	}

	observeChat( chatId, operatorId ) {
		return this.withSocket()
			.then( socket => socket.emit( 'chat.observe', chatId, operatorId ) );
	}

	removeObserver( chatId, operatorId ) {
		return this.withSocket()
			.then( socket => socket.emit( 'chat.removeObserver', chatId, operatorId ) );
	}

	blockUser( chatId, operatorId, userId ) {
		return this.withSocket()
			.then( socket => socket.emit( 'chat.block', chatId, operatorId, userId ) );
	}

	closeChat( chatId ) {
		debug( 'closing chat', chatId );

		return this.withSocket()
			.then( socket => socket.emit( 'chat.close', chatId ) );
	}

	transferChat( chatId, operatorId ) {
		return this.withSocket()
			.then( socket => socket.emit( 'chat.transfer', chatId, operatorId ) );
	}

	requestTranscript( chatId, userId, timestamp ) {
		return this.withSocket().then( socket => new Promise( ( resolve, reject ) => {
			socket.emit( 'chat.transcript', chatId, userId, timestamp, ( error, result ) => {
				if ( error ) {
					if ( 'unknown chat' === error ) {
						// mark unknown chats as not found
						debug( 'chat.transcript unknown :c' );
					}
					return reject( new Error( error ) );
				}
				resolve( result );
			} );
		} ) )
			.then( result => ( {
				...result,
				// TODO: We're ensuring here that timestamps are integers. This is a problem
				// that should be fixed on the API side, so we can drop this client-side data-mangling.
				messages: map( evolve( { timestamp: parseInt } ), prop( 'messages', result ) )
			} ) );
	}

	typing( chatId, message ) {
		return this.withSocket()
			.then( socket => socket.emit(
				'chat.typing',
				chatId,
				! message.length ? false : message
			) );
	}

	clearReconnectCountdown() {
		if ( this.reconnectCountdown ) {
			clearInterval( this.reconnectCountdown );
		}
	}

	setOperationStatus( status ) {
		return this.withSocket()
			.then( ( socket => socket.emit(
				'broadcast.dispatch',
				{ type: 'SET_OPERATOR_STATUS', status: status }
			) ) )
	}
}

/**
 * External Dependencies
 */
import wpcomLib from 'wpcom';
import qs from 'querystring';
// import validator from 'is-my-json-valid';
import { parse } from 'url';
import axios from 'axios';
const debug = require( 'debug' )( 'load:happychat:hc:authenticator' );

/**
 * Internal Dependencies
 */
import config from 'config';
export default class HEAuthenticator {
	constructor() {
		this.store = {
			req: [], // For debugging purposes. TODO: Delete it.
			vars: {},
			cookies: [],
			token: ''
		};
	}

	getAuthenticationUrl() {
		const origin = config.get( 'happyChatURL' );
		const clientId = config.get( 'oauth_client_id' )[ parse( origin ).hostname ];
		const querystring = qs.stringify( {
			client_id: clientId,
			redirect_uri: origin + '/authenticate',
			response_type: 'token',
			scope: 'auth'
		} );

		return 'https://public-api.wordpress.com/oauth2/authorize?' + querystring;
	}

	login( user ) {
		if ( user === undefined ) {
			user = config.get( 'HETestAccounts' ).defaultUser
		}
		return axios( {
			method: 'post',
			url: 'https://public-api.wordpress.com/oauth2/token',
			data: qs.stringify( {
				username: user[0],
				password: user[1],
				remember_me: 'false',
				client_id: user[2],
				client_secret: user[3],
				grant_type: 'password'
			} ),
		} ).then( ( response ) => {
			debug( '%O', response );
			this.store.token = response.data.access_token;
		} ).catch( ( error ) => {
			debug( '%O', error );
			console.error( 'Make sure you have used valid user. Was used' )
			throw new Error( 'on LOGIN Request' );
		} );
	}

	getAutomattician( token ) {
		return new Promise( ( resolve, reject ) => {
			Promise
				.all( [
					this.getUserInfo( token ),
					this.isAutomattician( token )
				] )
				.then( ( [ user ] ) => {
					resolve( user );
				}, reject );
		} );
	}

	requestAccessToken() {
		// wpoauth.code(req.params.code);

		wpcomLib.requestAccessToken( ( err, data ) => {
			if ( err ) return debug( 'error', err );
			debug( 'ok', data );
		} );
	}

	isAutomattician( token ) {
		return new Promise( ( resolve, reject ) => {
			const wpcom = wpcomLib( token );
			wpcom.req.get( '/internal/automattician', { apiVersion: '1.2' }, ( error, info ) => {
				if ( error ) {
					if ( error.error === 'unauthorized' ) {
						error = new Error( 'Looks like we may have an imposter. Blink twice if you\'re an Automattician, Agent W!' );
					}
					return reject( error );
				}

				if ( ! info.is_proxied ) {
					return reject( new Error( 'Looks like your proxy access is missing, Agent W!' ) );
				}

				resolve( info.is_automattician );
			} );
		} );
	}

	/**
	 * Save the js error to logstash via WP.com endpoint
	 * @export
	 * @param {any} token WP.com Bearer
	 * @param {any} payload Error body
	 * @returns {Promise} response of the HTTP request
	 */
	saveJsError( token, payload ) {
		const wpcom = wpcomLib( token );
		const url = '/happychat/js/errors/new';
		const body = { error: payload };

		return wpcom.req.post( url, body );
	}

	getUserInfo( token ) {
		return new Promise( ( resolve, reject ) => {
			const wpcom = wpcomLib( token );
			const me = wpcom.me();

			me.get( ( error, user ) => {
				if ( error ) {
					return reject( error );
				}

				resolve( user );
			} );
		} );
	}
}

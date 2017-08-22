import axios from 'axios';
import querystring from 'querystring';
import config from 'config';

const debug = require( 'debug' )( 'load:happychat:auth' );

export default class HCAuthenticator {
	constructor() {
		this.store = {
			req: [],
			vars: {},
			cookies: []
		};
	}

	doAuth( account = 'defaultUser' ) {
		return this.login( account )
			.then( () => this.restProxy()
				.then( () => this.me()
					.then( () => this.session()
						.then( () => this.signJwt()
						) ) ) )
	}

	login( account ) {
		if ( account === undefined ) {
			account = config.get( 'testAccounts' ).defaultUser
		}
		return axios( {
			method: 'post',
			url: 'https://wordpress.com/wp-login.php?action=login-endpoint',
			data: querystring.stringify( {
				username: account[0],
				password: account[1],
				remember_me: 'false',
				redirect_to: 'http://calypso.localhost:3000/devdocs/welcome',
				client_id: config.get( 'clientId' ),
				client_secret: config.get( 'clientSecret' )
			} ),
		} ).then( ( response ) => {
			var cookies = response.headers['set-cookie'];
			this.store.cookies = this.store.cookies.concat( cookies.map( ( el ) => el.match( /(.+?);/ )[0] ) )
			this.store.req.push( response );
			debug( '%O', response );
		} ).catch( ( error ) => {
			debug( '%O', error );
			console.error( `Make sure you have used valid user. Was used ${user}` )
			throw new Error( 'on LOGIN Request' );
		} );
	}

	restProxy() {
		return axios( {
			method: 'get',
			url: config.get( 'wpApiEndPoint' ) + '/wp-admin/rest-proxy/',
			headers: {
				Cookie: this.store.cookies
			},
		} ).then( ( response ) => {
			var cookies = response.headers['set-cookie'];
			this.store.cookies = this.store.cookies.concat( cookies.map( ( el ) => el.match( /(.+?);/ )[0] ) )

			this.store.vars.wpApi = cookies[0].match( /wp_api=(.+?);(.*)/ )[1];
			this.store.vars.wpApiSec = cookies[1];

			this.store.req.push( response );
			debug( '%O', response );
		} ).catch( ( error ) => {
			debug( '%O', error );
			console.error( `Strange! Thats should pass smooth if valid cookies was used.\nHere cookies used: ${this.store.cookies}` )

			throw new Error( 'on restProxy request' );
		} );
	}

	me() {
		return axios( this.apiObject( 'get', '/rest/v1.1/me' )
		// 	{
		// 	method: 'get',
		// 	url: config.get( 'wpApiEndPoint' ) + '/rest/v1.1/me', //?http_envelope=1&meta=flags",
		// 	headers: {
		// 		Authorization: 'X-WPCOOKIE ' + this.store.vars.wpApi + ':1:http://calypso.localhost:3000',
		// 		Cookie: this.store.cookies.join( '; ' ),
		// 	}
		// }
		).then( ( response ) => {
			var cookies = response.headers['set-cookie'];
			this.store.cookies = this.store.cookies.concat( cookies.map( ( el ) => el.match( /(.+?);/ )[0] ) )

			this.store.vars.usrId = response.data.ID;
			this.store.vars.usrInfo = response.data;
			this.store.req.push( response );
			debug( '%O', response );
		} ).catch( ( error ) => {
			debug( '%O', error );
			console.error( `There might be an issue with Auth Token. Take a look: ${this.store.vars.wpApi}` )
			throw new Error( 'on ME' );
		} );
	}

	session() {
		return axios( this.apiObject( 'post', '/rest/v1/happychat/session' )
		// 	{
		// 	method: 'post',
		// 	url: config.get( 'wpApiEndPoint' ) + '/rest/v1/happychat/session',
		// 	headers: {
		// 		Authorization: 'X-WPCOOKIE ' + this.store.vars.wpApi + ':1:http://calypso.localhost:3000',
		// 		Cookie: this.store.cookies.join( '; ' ),
		// 	}
		// }
		).then( ( response ) => {
			var cookies = response.headers['set-cookie'];
			this.store.cookies = this.store.cookies.concat( cookies.map( ( el ) => el.match( /(.+?);/ )[0] ) )

			this.store.vars.sessionId = response.data.session_id;
			this.store.req.push( response );
			debug( '%O', response );
		} ).catch( ( error ) => {
			debug( '%O', error );
			console.error( `There might be an issue with Auth Token. Take a look: ${this.store.vars.wpApi}` )
			throw new Error( 'on SESSION' );
		} );
	}

	signJwt() {
		return axios( Object.assign(
			this.apiObject( 'post', '/rest/v1/jwt/sign' ),
			{
				transformRequest: [( data ) => {
					var payload = `{"user":${JSON.stringify( this.store.vars.usrInfo )},"session_id":${this.store.vars.sessionId}}`;
					data = `payload=${encodeURIComponent( payload )}`;
					return data;
				}]
			} )
		).then( ( response ) => {
			var cookies = response.headers['set-cookie'];
			this.store.cookies = this.store.cookies.concat( cookies.map( ( el ) => el.match( /(.+?);/ )[0] ) )

			this.store.vars.jwt = response.data.jwt;
			this.store.req.push( response );
			debug( '%O', response );
		} ).catch( ( error ) => {
			debug( '%O', error );
			console.error( `There might be an issue with Auth Token. Take a look: ${this.store.vars.wpApi}` )
			throw new Error( 'on JWT' );
		} );
	}

	apiObject( method, path ) {
		return {
			method: method,
			url: config.get( 'wpApiEndPoint' ) + path,
			headers: {
				Authorization: 'X-WPCOOKIE ' + this.store.vars.wpApi + ':1:http://calypso.localhost:3000',
				Cookie: this.store.cookies.join( '; ' ),
			}
		}
	}
}

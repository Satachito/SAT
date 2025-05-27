import http	from 'http'
import url	from 'url'
import path	from 'path'
import fs	from 'fs'

export const
SendFile = ( S, _ ) => new Promise(
	( R, J ) => {
		S.writeHead(
			200
		,	{ 'Content-Type': MimeTypes[ path.extname( _ ) ] || 'application/octet-stream' }
		)
		const
		$ = fs.createReadStream( _ )
		$.on( 'error', E => J( E ) )
		$.on( 'end', () => R() )
		$.pipe( S )
	}
)

export const
Send = ( S, status = 200, _ = '', type = 'text/plain' ) => (
	S.writeHead(
		status
	,	{	'Content-Type'	: type
		,	'Content-Length': Buffer.from( _ ).byteLength
		}
	)
,	S.end( _ )
)

export const
SendJSONable = ( S, _ ) => Send( S, 200, JSON.stringify( _ ), 'application/json' )

export	const
_400 = ( S, _ = 'Bad request.'				) => Send( S, 400, _ )

export	const
_401 = ( S, _ = 'Unauthorized.'				) => Send( S, 401, _ )

export	const
_403 = ( S, _ = 'Forbidden.'				) => Send( S, 403, _ )

export	const
_404 = ( S, _ = 'Not found.'				) => Send( S, 404, _ )

export	const
_500 = ( S, _ = 'Internal server error.'	) => Send( S, 500, _ )

export const
Body = Q => new Promise(
	( R, J ) => {
		let $ = ''
		Q.on( 'data', _ => $ += _ )
		Q.on( 'end', () => R( $ ) )
		Q.on( 'error', E => J( E ) )
	}
)

export const
BodyAsJSON = async Q => JSON.parse( await Body( Q ) )

const	//	THROWS, CATCH IT
PathName = Q => decodeURIComponent( new URL( Q.url, 'http://localhost' ).pathname )

const
AccessControl = ( Q, S, allower ) => {

	const
	origin = Q.headers.origin

	if ( origin ) {
		if ( allower( origin ) ) {
			S.setHeader( 'Access-Control-Allow-Origin', origin )
		    S.setHeader( 'Vary', 'Origin' ) // キャッシュ対策
			S.setHeader( 'Access-Control-Allow-Credentials', 'true' ) // 認証ありのリクエスト用
		} else {
			_403( S )
			return true
		}
	} else {
		//	origin がない：Web と API が同じアドレスからサービスされてる：多分DEBUG環境
		//	vercel みたいに同じアドレスからサービスする場合は無条件に '*'
		if ( process.env.DEBUG ) {	//	process.env.DEBUG があって、nullable ではない時
			S.setHeader( 'Access-Control-Allow-Origin', '*' )
		} else {
			_403( S )
			return true
		}
	}

	S.setHeader( 'Access-Control-Allow-Methods'	, 'GET, POST, OPTIONS' )
	S.setHeader( 'Access-Control-Allow-Headers'	, 'Content-Type' )

	if ( Q.method === 'OPTIONS' ) {
		S.writeHead(204)
		S.end()
		return true
	}
	return false
}

const
API = async ( Q, S, APIs ) => {
	try {
		const
		API = APIs[ PathName( Q ) ]
		if ( !API ) return false
		await API( Q, S )
	} catch ( e ) {
		console.error( e )
		e instanceof URIError
		?	_400( S )
		:	_500( S )
	}
	return true
}

const
MimeTypes = {
	'.html'			: 'text/html'
,	'.js'			: 'application/javascript'
,	'.css'			: 'text/css'
,	'.json'			: 'application/json'
,	'.png'			: 'image/png'
,	'.jpg'			: 'image/jpeg'
,	'.gif'			: 'image/gif'
,	'.svg'			: 'image/svg+xml'
,	'.wasm'			: 'application/wasm'
,	'.ico'			: 'image/x-icon'
,	'.webmanifest'	: 'application/manifest+json'
}

const
Static = async ( Q, S, dir ) => {
	try {
		const
		name = path.normalize( path.join( dir, PathName( Q ) ) )
		if ( !name.startsWith( dir ) ) {
			_403( S )
			return true
		}
		await fs.promises.access( name )

		const
		stat = await fs.promises.stat( name )

		if ( stat.isFile() ) {
			await SendFile( S, name )
			return true
		}
		if ( stat.isDirectory() ) {
			const
			indexPath = path.join( name, 'index.html' )
			await fs.promises.access( indexPath )

			if ( ( await fs.promises.stat( indexPath ) ).isFile() ) {
				await SendFile( S, indexPath )
				return true
			}
		}
	} catch ( e ) {
		if ( e.code !== 'ENOENT' && e.code !== 'EACCESS' ) {
			console.error( e )
			e instanceof URIError
			?	_400( S )
			:	_500( S )
			return true
		}
	}
	return false
}

const
ExistingAbsolutePath = _ => {
	const
	dir = path.resolve( process.cwd(), _ )
	if( !fs.existsSync( dir ) ) throw `No ${dir}.`
	return dir
}

const
LOG = ( tag, Q ) => console.log( `[${new Date().toISOString()}] ${tag}\t${Q.url}` )

export const
API_SERVER = APIs => http.createServer(
	async ( Q, S ) => await API( Q, S, APIs )
	?	LOG( 'API', Q )
	: (	_404( S )
	,	LOG( '404', Q )
	)
)
export const
CORS_API_SERVER = ( APIs, allower ) => http.createServer(
	async ( Q, S ) => AccessControl( Q, S, allower )
	?	LOG( 'CORS', Q )
	:	await API( Q, S, APIs )
		?	LOG( 'API', Q )
		: (	_404( S )
		,	LOG( '404', Q )
		)
	//
)

export const
STATIC_SERVER = dirREL => {
	const
	dir = ExistingAbsolutePath( dirREL )

	return http.createServer(
		async ( Q, S ) => await Static( Q, S, dir )
		?	LOG( 'FILE', Q )
		: (	_404( S )
		,	LOG( '404', Q )
		)
	)
}
export const
CORS_STATIC_SERVER = ( dirREL, allower ) => {
	const
	dir = ExistingAbsolutePath( dirREL )

	return http.createServer(
		async ( Q, S ) => AccessControl( Q, S, allower )
		?	LOG( 'CORS', Q )
		:	await Static( Q, S, dir )
			?	LOG( 'FILE', Q )
			: (	_404( S )
			,	LOG( '404', Q )
			)
		//
	)
}

export const
API_STATIC_SERVER = ( APIs, dirREL ) => {
	const
	dir = ExistingAbsolutePath( dirREL )

	return http.createServer(
		async ( Q, S ) => {
			await API( Q, S, APIs )
			?	LOG( 'API', Q )
			:	await Static( Q, S, dir )
				?	LOG( 'FILE', Q )
				: (	_404( S )
				,	LOG( '404', Q )
				)
			//
		}
	)
}
export const
CORS_API_STATIC_SERVER = ( APIs, dirREL, allower ) => {

	const
	dir = ExistingAbsolutePath( dirREL )

	return http.createServer(
		async ( Q, S ) => AccessControl( Q, S, allower )
		?	LOG( 'CORS', Q )
		:	await API( Q, S, APIs )
			?	LOG( 'API', Q )
			:	await Static( Q, S, dir )
				?	LOG( 'FILE', Q )
				: (	_404( S )
				,	LOG( '404', Q )
				)
			//
		//
	)
}

import crypto from 'crypto'

import {
	parse
,	serialize
} from 'cookie'

const
Sign = _ => crypto.createHmac(
	'sha256'
,	process.env.SESSION_SECRET
).update( _ ).digest( 'hex' )

export const
SerializeSessionCookie = sessionID => serialize(
	'session'
,	`${ sessionID }.${ Sign( sessionID ) }`
,	{	httpOnly	: true
	,	path		: '/'
	,	sameSite	: 'lax'
	,	secure		: !process.env.DEBUG
	,	maxAge		: 60 * 60 * 24 * 7
	}
)

export const
ParseSessionCookie = cookie => {
	const
	session = parse( cookie ).session
	if ( !session ) throw new Error( 'No session cookie' )

	const [ sessionID, signature ] = session.split( '.' )
	if ( Sign( sessionID ) !== signature ) throw new Error( 'Invalid session signature' )
	return sessionID
}


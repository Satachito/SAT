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
_400 = S => Send( S, 400, 'Bad request.' )

export	const
_401 = S => Send( S, 401, 'Unauthorized.' )

export	const
_403 = S => Send( S, 403, 'Forbidden.' )

export	const
_404 = S => Send( S, 404, 'Not found.' )

export	const
_500 = S => Send( S, 500, 'Internal server error.' )

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
PathName = Q => decodeURIComponent( new URL( Q.url, `http://${Q.headers.host}` ).pathname )

const
AccessControl = ( Q, S ) => (
	S.setHeader( 'Access-Control-Allow-Origin'	, '*' )
,	S.setHeader( 'Access-Control-Allow-Methods'	, 'GET, POST, OPTIONS' )
,	S.setHeader( 'Access-Control-Allow-Headers'	, 'Content-Type' )
,	Q.method === 'OPTIONS'
	? (	S.writeHead(204)
	,	S.end()
	,	true
	)
	:	false
)

const
API = async ( Q, S, APIs ) => {
	try {
		const
		API = APIs[ PathName( Q ) ]
		if ( !API ) return false
		await API( Q, S )
	} catch ( e ) {
		setTimeout( () => console.error( e ) )
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
			setTimeout( () => console.error( e ) )
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
CORS_API_SERVER = APIs => http.createServer(
	async ( Q, S ) => AccessControl( Q, S )
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
CORS_STATIC_SERVER = dirREL => {
	const
	dir = ExistingAbsolutePath( dirREL )

	return http.createServer(
		async ( Q, S ) => AccessControl( Q, S )
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
CORS_API_STATIC_SERVER = ( APIs, dirREL ) => {
	const
	dir = ExistingAbsolutePath( dirREL )

	return http.createServer(
		async ( Q, S ) => AccessControl( Q, S )
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


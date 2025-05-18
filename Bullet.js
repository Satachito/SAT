import http	from 'http'
import url	from 'url'
import path	from 'path'
import fs	from 'fs'

const
_404 = S => (
	S.writeHead( 404, { 'Content-Type': 'text/plain' } )
,	S.end( 'Not Found' )
)

const
PathName = Q => decodeURIComponent( new URL( Q.url, `http://${Q.headers.host}` ).pathname )

const
AccessControl = ( Q, S ) => {
	Q.method === 'OPTIONS'
	? (	S.writeHead(204)
	,	S.end()
	,	true
	)
	: (	S.setHeader( 'Access-Control-Allow-Origin'	, '*' )
	,	S.setHeader( 'Access-Control-Allow-Methods'	, 'GET, POST, OPTIONS' )
	,	S.setHeader( 'Access-Control-Allow-Headers'	, 'Content-Type' )
	,	false
	)
}

const
API = async ( Q, S, APIs ) => {

console.log( 'API:', PathName( Q ) )

	const
	API = APIs[ PathName( Q ) ]

	if ( !API ) return false

	try {
		await API( Q, S )
	} catch ( e ) {
		console.error( e )
		S.writeHead( 500, { 'Content-Type': 'text/plain' } )
		S.end( 'Internal Server Error' )
	}
	return true
}

const
MimeTypes = {
	'.html'	: 'text/html'
,	'.js'	: 'application/javascript'
,	'.css'	: 'text/css'
,	'.json'	: 'application/json'
,	'.png'	: 'image/png'
,	'.jpg'	: 'image/jpeg'
,	'.gif'	: 'image/gif'
,	'.svg'	: 'image/svg+xml'
}

const
IsReadable = async _ => {
	try {
		await fs.promises.access( _, fs.constants.R_OK )
		return true
	} catch {
		return false
	}
}

const
Static = async ( Q, S, dir ) => {

console.log( 'STATIC:', PathName( Q ) )

	const
	name = path.join( dir, PathName( Q ) )

	try {
		await fs.promises.access( name, fs.constants.R_OK )

		const
		stat = await fs.promises.stat( name )
		console.assert( stat )

		if ( stat.isFile() ) {
			await SendFile( S, name )
			return true
		}
		if ( stat.isDirectory() ) {
			const
			indexPath = path.join( name, 'index.html' )
			if ( ( await fs.promises.stat( indexPath ) ).isFile() ) {
				await SendFile( S, indexPath )
				return true
			}
		}
	} catch {
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

export const
API_SERVER = APIs => http.createServer(
	async ( Q, S ) => await API( Q, S, APIs ) || _404( S )
)
export const
API_SERVER_CORS = APIs => http.createServer(
	async ( Q, S ) => AccessControl( Q, S ) || await API( Q, S, APIs ) || _404( S )
)

export const
STATIC_SERVER = dirREL => {
	const
	dir = ExistingAbsolutePath( dirREL )

	return http.createServer(
		async ( Q, S ) => await Static( Q, S, dir ) || _404( S )
	)
}
export const
STATIC_SERVER_CORS = dirREL => {
	const
	dir = ExistingAbsolutePath( dirREL )

	return http.createServer(
		async ( Q, S ) => AccessControl( Q, S ) || await Static( Q, S, dir ) || _404( S )
	)
}

export const
API_STATIC_SERVER = ( APIs, dirREL ) => {
	const
	dir = ExistingAbsolutePath( dirREL )

	return http.createServer(
		async ( Q, S ) => await API( Q, S, APIs ) || await Static( Q, S, dir ) || _404( S )
	)
}
export const
API_STATIC_SERVER_CORS = ( APIs, dirREL ) => {
	const
	dir = ExistingAbsolutePath( dirREL )

	return http.createServer(
		async ( Q, S ) => AccessControl( Q, S ) || await API( Q, S, APIs ) || await Static( Q, S, dir ) || _404( S )
	)
}

export const
Send = ( S, _, type ) => (	//	_ must be Uint8Array
	S.writeHead(
		200
	,	{	'Content-Type'	: type
		,	'Content-Length': _.byteLength
		}
	)
,	S.end( _ )
)

export const
SendJSONable = ( S, _ ) => Send( S, Buffer.from( JSON.stringify( _ ) ), 'application/json' )

export const
SendHTML = ( S, _ ) => Send( S, Buffer.from( _ ), 'text/html' )

/*
export const
SendFile = ( S, _ ) => (
	S.writeHead(
		200
	,	{ 'Content-Type': MimeTypes[ path.extname( _ ) ] || 'application/octet-stream' }
	)
,	fs.createReadStream( _ ).pipe( S )
)
*/
export const
SendFile = async ( S, _ ) => new Promise(
	( R, J ) => {
		S.writeHead(
			200
		,	{ 'Content-Type': MimeTypes[ path.extname( _ ) ] || 'application/octet-stream' }
		)
		const
		$ = fs.createReadStream( _ )
		$.on( 'error', e => J( e ) )
		$.on( 'finish', () => R() )
		$.pipe( S )
	}
)

export const
Body = Q => new Promise(
	( R, J ) => {
		let $ = ''
		Q.on( 'data', _ => $ += _ )
		Q.on( 'end', () => R( $ ) )
		Q.on( 'error', e => J( e ) )
	}
)


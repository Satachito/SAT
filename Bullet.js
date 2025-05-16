import http	from 'http'
import url	from 'url'
import path	from 'path'
import fs	from 'fs'

const
PathName = Q => decodeURIComponent( new URL( Q.url, `http://${Q.headers.host}` ).pathname )

const
AccessControl = S => {
	S.setHeader( 'Access-Control-Allow-Origin'	, '*' )
	S.setHeader( 'Access-Control-Allow-Methods'	, 'GET, POST, OPTIONS' )
	S.setHeader( 'Access-Control-Allow-Headers'	, 'Content-Type' )
}

const
API = async ( Q, S, APIs ) => {
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
_404 = S => (
	S.writeHead( 404, { 'Content-Type': 'text/plain' } )
,	S.end( 'Not Found' )
)

export const
API_SERVER = APIs => http.createServer(
	async ( Q, S ) => await API( Q, S, APIs ) || _404( S )
)

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
Static = ( Q, S, dir ) => {

	const
	name = path.join( dir, PathName( Q ) )

	const
	SendFile = _ => fs.existsSync( _ ) && fs.statSync( _ ).isFile() 
	?	(	S.writeHead(
				200
			,	{ 'Content-Type': MimeTypes[ path.extname( _ ) ] || 'application/octet-stream' }
			)
		,	fs.createReadStream( _ ).pipe( S )
		,	true
		)
	:	false

	if ( SendFile( name								) ) return true
	if ( SendFile( path.join( name, 'index.html' )	) ) return true

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
STATIC_SERVER = dirREL => {
	const
	dir = ExistingAbsolutePath( dirREL )

	return http.createServer(
		( Q, S ) => Static( Q, S, dir ) || _404( S )
	)
}

export const
API_STATIC_SERVER = ( APIs, dirREL ) => {
	const
	dir = ExistingAbsolutePath( dirREL )

	return http.createServer(
		async ( Q, S ) => await API( Q, S, APIs ) || Static( Q, S, dir ) || _404( S )
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


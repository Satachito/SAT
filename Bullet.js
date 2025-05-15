import http	from 'http'
import url	from 'url'
import path	from 'path'
import fs	from 'fs'

const
On			= ( _, $ ) => _ ? ( $( _ ), true ) : false

const
PathName	= Q => decodeURIComponent( url.parse( Q.url, true ).pathname )

const
API			= ( Q, S, APIs ) => On( APIs[ PathName( Q ) ], _ => _( Q, S ) )

const
_404		= S => (
	S.statusCode = 404
,	S.end( 'Not Found' )
)

export const
API_SERVER	= APIs => http.createServer(
	( Q, S ) => API( Q, S, APIs ) || _404( S )
)

import { fileURLToPath } from 'url'
const
Static	= ( Q, S, dirREL ) => {

	const
	dir = path.resolve( 
		path.dirname( fileURLToPath( import.meta.url ) )
	,	dirREL
	)
	if( !fs.existsSync( dir ) ) throw new Error( `No ${dirREL} dir.` )

	const
	SendFile = _ => {
		const
		mimeTypes = {
			'.html'	: 'text/html'
		,	'.js'	: 'application/javascript'
		,	'.css'	: 'text/css'
		,	'.json'	: 'application/json'
		,	'.png'	: 'image/png'
		,	'.jpg'	: 'image/jpeg'
		,	'.gif'	: 'image/gif'
		,	'.svg'	: 'image/svg+xml'
		}
		S.writeHead(
			200
		,	{ 'Content-Type': mimeTypes[ path.extname( _ ) ] || 'application/octet-stream' }
		)
		fs.createReadStream( _ ).pipe( S )
	}

	try {
		const
		name = path.join( dir, PathName( Q ) )

		SendFile(
			fs.statSync( name ).isFile()
			?	name
			:	path.join( name, 'index.html' )
		)
		return true
	} catch( e ) {
		return false
	}
}

export const
STATIC_SERVER = dirREL => http.createServer(
	( Q, S ) => Static( Q, S, dirREL ) || _404( S )
)

export const
API_STATIC_SERVER = ( APIs, dirREL ) => http.createServer(
	( Q, S ) => API( Q, S, APIs ) || Static( Q, S, dirREL ) || _404( S )
)

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

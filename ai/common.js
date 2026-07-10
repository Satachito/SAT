//	Shared apply_ops tool schema + SSE reader for BYOK AI panels.

export const
OPS_SCHEMA		= {
	type		: 'object'
,	properties	: { ops: { type: 'array', items: { type: 'object' } } }
,	required	: [ 'ops' ]
}

//	Read an SSE response, calling onEvent( rawDataString ) per `data:` line.
//	Stops on `data: [DONE]` ( OpenAI ) or stream end ( Anthropic ).
export const
readSSE			= async ( res, onEvent ) => {
	const
	reader		= res.body.getReader()
	,	decoder		= new TextDecoder
	let	buf			= ''
	for	( ;; ) {
		const	{ value, done } = await reader.read()
		if	( done )	break
		buf += decoder.decode( value, { stream: true } )
		let	i
		while	( ( i = buf.indexOf( '\n\n' ) ) !== -1 ) {
			const
			chunk	= buf.slice( 0, i )
			buf		= buf.slice( i + 2 )
			const	line = chunk.split( '\n' ).find( _ => _.startsWith( 'data:' ) )
			if	( !line )	continue
			const	data = line.slice( 5 ).trim()
			if	( data === '[DONE]' )	return
			onEvent( data )
		}
	}
}

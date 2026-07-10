//	Anthropic ( Claude ) provider for <ai-assistant>.

import { OPS_SCHEMA, readSSE } from './common.js'

const
ENDPOINT		= 'https://api.anthropic.com/v1/messages'
,	MODELS_URL		= 'https://api.anthropic.com/v1/models'
,	TOOLS			= [
	{
		name		: 'apply_ops'
	,	description	: 'Apply one or more edit operations to the live document.'
	,	input_schema: OPS_SCHEMA
	}
]

const
listModels		= async key => {
	const
	headers	= {
		'x-api-key'									: key
	,	'anthropic-version'							: '2023-06-01'
	,	'anthropic-dangerous-direct-browser-access'	: 'true'
	}
	,	out		= []
	let	after	= null
	for	( ;; ) {
		const
		url = new URL( MODELS_URL )
		url.searchParams.set( 'limit', '1000' )
		after && url.searchParams.set( 'after_id', after )
		const
		res = await fetch( url, { headers } )
		if	( !res.ok ) {
			const	j = await res.json().catch( () => null )
			throw new Error( j?.error?.message || `HTTP ${ res.status }` )
		}
		const
		j = await res.json()
		out.push( ...( j.data || [] ) )
		if	( !j.has_more ) break
		after = j.last_id
		if	( !after ) break
	}
	return	out
	.	filter( m => /^claude-/.test( m.id ) && !/-20\d{6}$/.test( m.id ) )
	.	map( m => ( { id: m.id, label: m.display_name || m.id } ) )
}

//	getSystem() is supplied by the host panel each turn.
const
streamTurn		= async ( key, model, messages, getSystem, { onTextStart, onTextDelta } ) => {
	const
	res = await fetch(
		ENDPOINT
	,	{
			method	: 'POST'
		,	headers	: {
				'content-type'							: 'application/json'
			,	'x-api-key'								: key
			,	'anthropic-version'						: '2023-06-01'
			,	'anthropic-dangerous-direct-browser-access'	: 'true'
			}
		,	body	: JSON.stringify( {
				model
			,	max_tokens	: 8192
			,	system		: getSystem()
			,	tools		: TOOLS
			,	messages
			,	stream		: true
			} )
		}
	)
	if	( !res.ok ) {
		const	j = await res.json().catch( () => null )
		throw new Error( j?.error?.message || `HTTP ${ res.status }` )
	}

	const
	blocks		= []
	,	jsonByIndex	= []
	await readSSE( res, raw => {
		const	data = JSON.parse( raw )
		switch ( data.type ) {
		case 'content_block_start':
			blocks[ data.index ] = data.content_block
			if	( data.content_block.type === 'text' )	onTextStart()
			break
		case 'content_block_delta':
			if	( data.delta.type === 'text_delta' ) {
				blocks[ data.index ].text += data.delta.text
				onTextDelta( blocks[ data.index ].text )
			} else if ( data.delta.type === 'input_json_delta' ) {
				jsonByIndex[ data.index ] = ( jsonByIndex[ data.index ] || '' ) + data.delta.partial_json
			}
			break
		case 'content_block_stop': {
			const	b = blocks[ data.index ]
			if	( b && b.type === 'tool_use' )
				b.input = jsonByIndex[ data.index ] ? JSON.parse( jsonByIndex[ data.index ] ) : {}
			break
		}
		case 'error':
			throw new Error( data.error?.message || 'stream error' )
		}
	} )

	const
	toolCalls	= blocks.filter( b => b && b.type === 'tool_use' ).map( b => ( { id: b.id, input: b.input } ) )
	return	{ assistant: { role: 'assistant', content: blocks }, toolCalls }
}

export default {
	listModels
,	streamTurn
,	initMessages		: prompt => [ { role: 'user', content: prompt } ]
,	toolResultMessages	: results => [ {
		role	: 'user'
	,	content	: results.map( r => ( { type: 'tool_result', tool_use_id: r.id, content: r.content } ) )
	} ]
}

//	OpenAI provider for <ai-assistant>.

import { OPS_SCHEMA, readSSE } from './common.js'

const
ENDPOINT		= 'https://api.openai.com/v1/chat/completions'
,	MODELS_URL		= 'https://api.openai.com/v1/models'
,	TOOLS			= [
	{
		type		: 'function'
	,	function	: {
			name		: 'apply_ops'
		,	description	: 'Apply one or more edit operations to the live document.'
		,	parameters	: OPS_SCHEMA
		}
	}
]

const
listModels		= async key => {
	const
	res = await fetch(
		MODELS_URL
	,	{ headers: { authorization: `Bearer ${ key }` } }
	)
	if	( !res.ok ) {
		const	j = await res.json().catch( () => null )
		throw new Error( j?.error?.message || `HTTP ${ res.status }` )
	}
	const
	j = await res.json()
	return	( j.data || [] )
	.	filter( m => {
		const
		id = m.id
		if	( !/^(gpt-|o[1-9]|chatgpt-)/.test( id ) ) return false
		if	( /realtime|audio|transcribe|tts|image|search|moderation|embedding|instruct|codex/i.test( id ) ) return false
		if	( /-\d{4}-\d{2}-\d{2}$/.test( id ) || /-20\d{6}$/.test( id ) ) return false
		return	true
	} )
	.	sort( ( a, b ) => ( b.created || 0 ) - ( a.created || 0 ) )
	.	map( m => ( { id: m.id, label: m.id } ) )
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
				'content-type'	: 'application/json'
			,	authorization	: `Bearer ${ key }`
			}
		,	body	: JSON.stringify( {
				model
			,	stream		: true
			,	tools		: TOOLS
			,	tool_choice	: 'auto'
			,	messages	: [ { role: 'system', content: getSystem() }, ...messages ]
			} )
		}
	)
	if	( !res.ok ) {
		const	j = await res.json().catch( () => null )
		throw new Error( j?.error?.message || `HTTP ${ res.status }` )
	}

	let	content		= ''
	,	started		= false
	const	calls		= []
	await readSSE( res, raw => {
		const	d = JSON.parse( raw ).choices?.[ 0 ]?.delta
		if	( !d )	return
		if	( d.content ) {
			if	( !started )	{ onTextStart(); started = true }
			content += d.content
			onTextDelta( content )
		}
		if	( d.tool_calls ) for ( const tc of d.tool_calls ) {
			const	c = calls[ tc.index ] ||= { id: '', name: '', args: '' }
			if	( tc.id )					c.id	= tc.id
			if	( tc.function?.name )		c.name	= tc.function.name
			if	( tc.function?.arguments )	c.args	+= tc.function.arguments
		}
	} )

	const
	used		= calls.filter( Boolean )
	,	assistant	= {
		role		: 'assistant'
	,	content		: content || null
	,	...( used.length && { tool_calls: used.map( c => ( {
			id			: c.id
		,	type		: 'function'
		,	function	: { name: c.name, arguments: c.args }
		} ) ) } )
	}
	,	toolCalls	= used.map( c => ( { id: c.id, input: c.args ? JSON.parse( c.args ) : {} } ) )
	return	{ assistant, toolCalls }
}

export default {
	listModels
,	streamTurn
,	initMessages		: prompt => [ { role: 'user', content: prompt } ]
,	toolResultMessages	: results => results.map( r => ( {
		role			: 'tool'
	,	tool_call_id	: r.id
	,	content			: r.content
	} ) )
}

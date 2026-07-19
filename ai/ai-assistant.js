//	<ai-assistant> — BYOK Claude / OpenAI panel ( light DOM, no ShadowRoot ).
//	Extends <float-panel>: the float / dock button, head and drag logic live there.
//
//	Host supplies:
//	  el.systemWithModel = () => string
//	  el.applyOps = async ops => issues
//	  el.onSend = () => void
//
//	Attributes: provider, store-key, store-model, title?, float-store?,
//	key-placeholder?, max-turns?

import FloatPanel from '../float-panel.js'
import anthropic from './anthropic.js'
import openai from './openai.js'
import { DEFAULT_MODELS } from './defaults.js'

const
PROVIDERS	= { anthropic, openai }
,	ATTRS		= [
	'provider', 'store-key', 'store-model', 'title'
,	'float-store', 'key-placeholder', 'max-turns'
]

const
E	= ( tag, attrs = {}, ...kids ) => {
	const
	$ = document.createElement( tag )
	for ( const [ k, v ] of Object.entries( attrs ) ) {
		if	( v == null || v === false ) continue
		if	( k === 'text' )	$.textContent = v
		else if ( k === 'className' ) $.className = v
		else	$.setAttribute( k, v === true ? '' : v )
	}
	for ( const kid of kids ) kid != null && $.append( kid )
	return $
}

class
AiAssistant extends FloatPanel {

	static get observedAttributes() { return ATTRS }

	constructor() {
		super()
		this.systemWithModel	= null
		this.applyOps			= null
		this.onSend			= null
		this._defaultModels		= null
		this._built				= false
	}

	get defaultModels() { return this._defaultModels }
	set defaultModels( v ) {
		this._defaultModels = v
		this._built && this._fillModels( v || DEFAULT_MODELS[ this.provider ] || [] )
	}

	get provider() { return this.getAttribute( 'provider' ) || 'anthropic' }
	get storeKey() { return this.getAttribute( 'store-key' ) || '' }
	get storeModel() { return this.getAttribute( 'store-model' ) || '' }
	get panelTitle() {
		return	this.getAttribute( 'title' )
			||	( this.provider === 'openai' ? 'OpenAI assistant' : 'Claude assistant' )
	}
	get keyPlaceholder() {
		return	this.getAttribute( 'key-placeholder' )
			||	( this.provider === 'openai'
				?	'OpenAI API key (sk-…)'
				:	'Anthropic API key (sk-ant-…)'
				)
	}
	get maxTurns() {
		const
		n = Number( this.getAttribute( 'max-turns' ) )
		return	n > 0 ? n : 6
	}

	connectedCallback() {
		if	( !this._built ) {
			this._build()
			this._bind()
		}
		super.connectedCallback()	//	FloatPanel: prepend head, wire float / dock
	}

	attributeChangedCallback( name ) {
		super.attributeChangedCallback( name )	//	FloatPanel: title, float-store
		if	( !this._built ) return
		if	( name === 'key-placeholder' && this._key ) this._key.placeholder = this.keyPlaceholder
		if	( name === 'provider' ) {
			this._fillModels( this._defaultModels || DEFAULT_MODELS[ this.provider ] || [] )
			this._pickModel( localStorage.getItem( this.storeModel ) )
			if	( this._key ) this._key.placeholder = this.keyPlaceholder
			if	( this._titleEl ) this._titleEl.textContent = this.panelTitle
		}
		if	( name === 'store-key' && this._key ) {
			this._key.value = localStorage.getItem( this.storeKey ) || ''
		}
		if	( name === 'store-model' ) this._pickModel( localStorage.getItem( this.storeModel ) )
	}

	_provider() {
		const
		p = PROVIDERS[ this.provider ]
		if	( !p ) throw new Error( `Unknown AI provider: ${ this.provider }` )
		return p
	}

	_build() {
		this.replaceChildren()

		this._key		= E( 'input', {
			type			: 'password'
		,	placeholder		: this.keyPlaceholder
		,	spellcheck		: 'false'
		,	autocomplete	: 'off'
		} )
		this._keyToggle	= E( 'button', {
			type: 'button', className: 'ai-key-btn', title: 'Show / hide key'
		,	'aria-label': 'Show / hide key', text: '👁'
		} )
		this._keyClear	= E( 'button', {
			type: 'button', className: 'ai-key-btn', title: 'Clear key'
		,	'aria-label': 'Clear key', text: '✕'
		} )
		const
		keyRow = E( 'div', { className: 'ai-key-row' }, this._key, this._keyToggle, this._keyClear )

		this._model		= E( 'select' )
		this._modelFetch	= E( 'button', {
			type: 'button', className: 'ai-fetch-btn'
		,	title: 'Fetch available models with this API key', text: 'Fetch'
		} )
		const
		modelRow = E( 'div', { className: 'ai-model-row' }, this._model, this._modelFetch )

		this._log	= E( 'div', { className: 'ai-log' } )
		this._input	= E( 'textarea', {
			className	: 'ai-input'
		,	rows		: '2'
		,	placeholder	: 'Describe a change… (Enter to send)'
		} )
		this._send	= E( 'button', { type: 'button', text: 'Send' } )

		this.append(
			E( 'div', { className: 'ai-config' }, keyRow, modelRow )
		,	this._log
		,	this._input
		,	this._send
		)
		this._built = true
	}

	_fillModels( models ) {
		this._model.replaceChildren()
		for ( const m of models ) {
			this._model.append(
				E( 'option', { value: m.id, text: m.label || m.id } )
			)
		}
	}

	_pickModel( prefer ) {
		const
		ok = prefer && [ ...this._model.options ].some( o => o.value === prefer )
		this._model.value = ok ? prefer : this._model.options[ 0 ]?.value
		this._model.value && this.storeModel
			&& localStorage.setItem( this.storeModel, this._model.value )
	}

	_setKey( v ) {
		if	( !this.storeKey ) return
		v	? localStorage.setItem( this.storeKey, v )
			: localStorage.removeItem( this.storeKey )
	}

	_logLine( role, text ) {
		const
		div = E( 'div', { className: `ai-msg ai-${ role }`, text } )
		this._log.append( div )
		this._log.scrollTop = this._log.scrollHeight
		return div
	}

	_bind() {
		this._fillModels( this._defaultModels || DEFAULT_MODELS[ this.provider ] || [] )
		this._key.value = this.storeKey ? ( localStorage.getItem( this.storeKey ) || '' ) : ''
		this._pickModel( this.storeModel ? localStorage.getItem( this.storeModel ) : null )

		this._key.onchange		= () => this._setKey( this._key.value.trim() )
		this._model.onchange	= () => this.storeModel
			&& localStorage.setItem( this.storeModel, this._model.value )
		this._keyToggle.onclick	= () => {
			this._key.type = this._key.type === 'password' ? 'text' : 'password'
		}
		this._keyClear.onclick	= () => {
			this._key.value = ''
			this._setKey( '' )
			this._key.focus()
		}
		this._modelFetch.onclick	= () => void this._fetchModels()
		this._send.onclick			= () => void this._run()
		this._input.onkeydown		= ev => {
			if	( ev.key === 'Enter' && !ev.shiftKey ) {
				ev.preventDefault()
				void this._run()
			}
		}
	}

	async _fetchModels() {
		const
		key = this._key.value.trim()
		if	( !key ) {
			this._logLine( 'error', 'Set your API key first ( the key field above ).' )
			return
		}
		this._setKey( key )
		this._modelFetch.disabled = true
		const
		prev = this._model.value
		try {
			const
			models = await this._provider().listModels( key )
			if	( !models.length ) throw new Error( 'No chat models returned' )
			this._fillModels( models )
			this._pickModel( prev )
			this._logLine( 'status', `Loaded ${ models.length } models` )
		} catch ( er ) {
			this._logLine( 'error', String( er?.message || er ) )
		} finally {
			this._modelFetch.disabled = false
		}
	}

	async _run() {
		const
		prompt = this._input.value.trim()
		if	( !prompt ) return
		const
		key = this._key.value.trim()
		if	( !key ) {
			this._logLine( 'error', 'Set your API key first ( the key field above ).' )
			return
		}
		if	( typeof this.systemWithModel !== 'function' ) {
			this._logLine( 'error', 'systemWithModel is not set on this panel.' )
			return
		}
		if	( typeof this.applyOps !== 'function' ) {
			this._logLine( 'error', 'applyOps is not set on this panel.' )
			return
		}
		this._setKey( key )
		this.onSend?.()

		const
		provider = this._provider()
		this._logLine( 'user', prompt )
		this._input.value		= ''
		this._send.disabled		= true
		let	pending = this._logLine( 'status', '…thinking' )
		const
		clearPending = () => { if ( pending ) { pending.remove(); pending = null } }

		const
		messages = provider.initMessages( prompt )
		try {
			for	( let turn = 0; turn < this.maxTurns; turn++ ) {
				let	liveEl = null
				const	{ assistant, toolCalls } = await provider.streamTurn(
					key
				,	this._model.value
				,	messages
				,	() => this.systemWithModel()
				,	{
						onTextStart	: () => { clearPending(); liveEl = this._logLine( 'assistant', '' ) }
					,	onTextDelta	: full => {
							if	( liveEl ) {
								liveEl.textContent = full
								this._log.scrollTop = this._log.scrollHeight
							}
						}
					}
				)

				if	( !toolCalls.length )	break

				messages.push( assistant )

				const	results = []
				for	( const tc of toolCalls ) {
					let		content
					try {
						const	ops = tc.input?.ops ?? []
						const	issues = await this.applyOps( ops )
						content = JSON.stringify( { applied: ops.length, issues } )
					} catch ( er ) {
						content = JSON.stringify( { error: String( er?.message || er ) } )
					}
					results.push( { id: tc.id, content } )
				}
				messages.push( ...provider.toolResultMessages( results ) )
			}
		} catch ( er ) {
			this._logLine( 'error', String( er?.message || er ) )
		} finally {
			clearPending()
			this._send.disabled = false
		}
	}
}

customElements.get( 'ai-assistant' ) || customElements.define( 'ai-assistant', AiAssistant )

export default AiAssistant

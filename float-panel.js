//	<float-panel> — floatable / dockable sidebar panel ( light DOM, no ShadowRoot ).
//
//	Use as an element wrapping a sidebar section, or as a base class for panel
//	components ( e.g. <ai-assistant> ). Prepends a head ( title + drag handle,
//	meant to be shown only while floating ) and a float / dock button. When the
//	panel sits inside <details>, the button is injected into the <summary>;
//	otherwise it lives in the head.
//
//	Attributes: title?, float-store? ( localStorage key persisting the state )
//
//	Host page styles the classes: float-panel, floating, float-head,
//	float-head-title, float-btn.

const
FLOAT_ATTRS	= [ 'title', 'float-store' ]

class
FloatPanel extends HTMLElement {

	static get observedAttributes() { return FLOAT_ATTRS }

	constructor() {
		super()
		this._floatBuilt	= false
		this._floatDrag		= null
	}

	get panelTitle()	{ return this.getAttribute( 'title' ) || '' }
	get floatStore()	{ return this.getAttribute( 'float-store' ) }

	connectedCallback() {
		this.classList.add( 'float-panel' )
		this._floatBuilt || this._buildFloat()
	}

	attributeChangedCallback( name ) {
		if	( !this._floatBuilt ) return
		if	( name === 'title' ) this._titleEl.textContent = this.panelTitle
		if	( name === 'float-store' ) {
			this._setFloat( !!this.floatStore && localStorage.getItem( this.floatStore ) === '1' )
		}
	}

	_setFloat( on ) {
		this.classList.toggle( 'floating', on )
		if	( !on ) {
			this.style.left = this.style.top = this.style.right = this.style.transform = ''
		}
		this._floatBtn.textContent	= on ? '⤓' : '⤢'
		this._floatBtn.title		= on ? 'Dock panel' : 'Float panel'
		this.floatStore && localStorage.setItem( this.floatStore, on ? '1' : '' )
	}

	_buildFloat() {
		this._floatBuilt = true

		this._titleEl = document.createElement( 'span' )
		this._titleEl.className		= 'float-head-title'
		this._titleEl.textContent	= this.panelTitle

		const
		head = document.createElement( 'div' )
		head.className = 'float-head'
		head.append( this._titleEl )
		this.prepend( head )

		const
		btn = document.createElement( 'button' )
		btn.type		= 'button'
		btn.className	= 'float-btn'
		btn.setAttribute( 'aria-label', 'Float / dock panel' )
		this._floatBtn	= btn

		const
		summary = this.closest( 'details' )?.querySelector( ':scope > summary' )
		;( summary || head ).append( btn )

		btn.onclick = ev => {
			//	inside <summary>, keep the click from toggling the <details>
			ev.preventDefault()
			ev.stopPropagation()
			const
			on = !this.classList.contains( 'floating' )
			on && summary && ( summary.parentElement.open = true )
			this._setFloat( on )
		}

		head.onpointerdown = ev => {
			if	( !this.classList.contains( 'floating' ) || ev.target === btn ) return
			const	r = this.getBoundingClientRect()
			this._floatDrag = { dx: ev.clientX - r.left, dy: ev.clientY - r.top }
			this.style.transform	= 'none'
			this.style.left			= `${ r.left }px`
			this.style.top			= `${ r.top }px`
			this.style.right		= 'auto'
			head.setPointerCapture( ev.pointerId )
		}
		head.onpointermove = ev => {
			if	( !this._floatDrag ) return
			this.style.left	= `${ ev.clientX - this._floatDrag.dx }px`
			this.style.top	= `${ ev.clientY - this._floatDrag.dy }px`
		}
		head.onpointerup = ev => {
			this._floatDrag = null
			head.releasePointerCapture?.( ev.pointerId )
		}

		this._setFloat( !!this.floatStore && localStorage.getItem( this.floatStore ) === '1' )
	}
}

customElements.get( 'float-panel' ) || customElements.define( 'float-panel', FloatPanel )

export default FloatPanel

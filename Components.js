////////////////////////////////////////////////////////////////
export class
Spinner extends HTMLElement {
	constructor() {
		super()

		this.attachShadow( { mode: 'open' } ).innerHTML = `
			<style>
				@keyframes spin {
					from	{ transform: rotate( 0deg	) }
					to		{ transform: rotate( 360deg	) }
				}
				:host {
				;	display		: inline-block
				;	animation	: spin 2s linear infinite
				}
			</style>
			<slot></slot>
		`
	}
}
customElements.define( 'sat-spinner', Spinner )

//	Calls CreatePromise and always returns a Promise,
//	even if CreatePromise throws synchronously or returns a non-Promise value.
const
Start = ( $, ...args ) => new Promise( R => R( $.CreatePromise( ...args ) ) )

export class
Button extends HTMLButtonElement {
	constructor() {
		super()

		this.onclick = e => (
			this.disabled = true
		,	Start( this, e ).finally(
				() => this.disabled = false
			)
		)
	}
}
customElements.define( 'sat-button', Button, { extends: 'button' } )

export class
OverlayButton extends HTMLButtonElement {

	constructor() {
		super()

		this.style.display			= 'inline-flex'
		this.style.alignItems		= 'center'
		this.style.justifyContent	= 'center'
		this.style.position			= 'relative'

		//	Disable before CreateOverlay so a double click cannot start CreatePromise twice.
		//	overlay.remove() works even if CreatePromise replaced the button's children.
		this.onclick = e => {
			this.disabled = true
			let overlay
			return Promise.resolve().then(
				() => this.CreateOverlay()
			).then(
				_ => (
					overlay = _
				,	overlay.style.position	= 'absolute'
				,	this.appendChild( overlay )
				,	Start( this, e )
				)
			).finally(
				() => (
					overlay?.remove()
				,	this.disabled = false
				)
			)
		}
	}
}
customElements.define( 'sat-overlay-button', OverlayButton, { extends: 'button' } )

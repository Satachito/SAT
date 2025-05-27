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

export class
Button extends HTMLButtonElement {
	constructor() {
		super()

		this.onclick = e => (
			this.disabled = true
		,	this.CreatePromise( e ).finally(
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

		this.onclick = () => this.CreateOverlay().then(
			overlay => (
				this.disabled = true
			,	overlay.style.position	= 'absolute'
			,	this.appendChild( overlay )
			,	this.CreatePromise().finally(
					() => (
						this.removeChild( overlay )
					,	this.disabled = false
					)
				)
			)
		)
	}
}
customElements.define( 'sat-overlay-button', OverlayButton, { extends: 'button' } )


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

		this.onclick = ev => (
			this.disabled = true
		,	this.CreatePromise( ev ).finally(
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

		this.onclick = () => On(
			this.CreateOverlay()
		,	overlay => (
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

//	OverlayButton EXAMPLE
//	class
//	SpinButton extends OverlayButton {
//		constructor() {
//			super()
//	
//			this.CreateOverlay = () => {
//				const
//				$ = new Spinner()
//				$.style.boxSizing		= 'border-box'
//				$.style.border			= '5px solid black'
//				$.style.borderTop		= '5px solid transparent'
//				$.style.borderRadius	= '50%'
//				return $
//			}
//		}
//	}
//	customElements.define( 'spin-button', SpinButton, { extends: 'button' } )

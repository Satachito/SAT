export const
Alert = e => (
	console.error( e )
,	alert( e )
)

export const E		= _ => document.createElement( _ )

export const Rs		= ( $, ..._ ) => $.replaceChildren( ..._ )
export const As		= ( $, ..._ ) => $.append( ..._ )
export const AC		= ( $, _ ) => $.appendChild( _ )
export const ACE	= ( $, _ ) => AC( $, E( _ ) )
export const On		= ( $, _ ) => $ && _( $ )

////////////////////////////////////////////////////////////////

export const
ReadAsText = _ => ( //	_ : <input type=file>
	_.disabled = true
,	Promise.all(
		Array.from( _.files ).map(
			_ => new Promise(
				( S, J ) => {
					const
					$ = new FileReader()
					$.onload = () => S( $.result )
					$.onerror = () => J( $.error )
					$.readAsText( _ )
				}
			)
		)
	).catch( Alert ).finally(
		() => _.disabled = false
	)
)

//	EXAMPLE
//	INPUT_FILE.onchange = ev => ReadAsText( ev.currentTarget ).then( console.log )

////////////////////////////////////////////////////////////////

export const
Load = options => window.showOpenFilePicker( options ).then(
	_ => Promise.all( _.map( _ => _.getFile() ) )
).catch(
	e => e.name === 'AbortError' ? console.log( e ) : Alert( e )
)

export const
LoadText = _ => Load( _ ).then( _ => Promise.all( _.map( _ => _.text() ) ) )

export const
LoadJSON = _ => LoadText( _ ).then( _ => Promise.all( _.map( _ => JSON.parse( _ ) ) ) )

export const
Save = ( _, options ) => window.showSaveFilePicker( options ).then(
	handle => handle.createWritable().then(
		writable => writable.write( _ ).then(
			() => writable.close()
		)
	)
).catch(
	e => e.name === 'AbortError' ? console.log( e ) : Alert( e )
)

export const
SaveText = Save

export const
SaveJSON = ( _, options ) => Save( JSON.stringify( _ ), options )

//	SAMPLE
//
//	let
//	DSC = []
//	
//	const
//	TYPES = [
//		{	description : 'DashSC Description file'
//		,	accept		: { 'application/json': [ '.dsc' ] }
//		}
//	]
//
//	BUTTON_LOAD.onclick = () => LoadJSON(
//		{	multiple				: true
//		,	types					: TYPES
//		,	excludeAcceptAllOption	: true
//		}
//	).then(
//		_ => DSC = _[ 0 ]
//	)
//	
//	BUTTON_SAVE.onclick = () => SaveJSON(
//		DSC
//	,	{	types					: TYPES
//		,	excludeAcceptAllOption	: true
//		}
//	)


////////////////////////////////////////////////////////////////
//	URLが存在しない場合 fetch 自体が TypeError( 'TypeError', 'Failed to fetch' ) を throw してくる
//	これらを　catch したら、FetchAlertを呼ぼう

export const
FetchJSON = ( _, options = {} ) => fetch( _, options ).then(
	_ => {
		if ( !_.ok ) throw _
		return _.json()
	}
)
export const
FetchText = ( _, options = {} ) => fetch( _, options ).then(
	_ => {
		if ( !_.ok ) throw _
		return _.text()
	}
)
export const
FetchBLOB = ( _, options = {} ) => fetch( _, options ).then(
	_ => {
		if ( !_.ok ) throw _
		return _.blob()
	}
)
export const
FetchArrayBuffer = ( _, options = {} ) => fetch( _, options ).then(
	_ => {
		if ( !_.ok ) throw _
		return _.arrayBuffer()
	}
)

export const
FetchImageURL = ( _, options = {} ) => FetchBLOB( _, options ).then(
	_ => URL.createObjectURL( _ )
)

export const
FetchDOM = ( _, options = {} ) => FetchText( _, options ).then(
	_ => new DOMParser().parseFromString( _, "text/html" )
)

export const
FetchAlert = _ => (
	( _ instanceof Error	) && Alert( _ )
,	( _ instanceof Response	) && Alert( `${ _.status }: ${ _.statusText }` )
)

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

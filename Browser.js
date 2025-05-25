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
				( R, J ) => {
					const
					$ = new FileReader()
					$.onload = () => R( $.result )
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

export const
AlertForFetch = _ => (
	( _ instanceof Error	) && Alert( _ )
,	( _ instanceof Response	) && Alert( `${ _.status }: ${ _.statusText }` )
)









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


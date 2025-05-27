export const
Alert = _ => (
	console.error( _ )
,	alert( _ )
)

export const
AlertForFetch = _ => (
	( _ instanceof Error	) && Alert( _ )
,	( _ instanceof Response	) && Alert( `${ _.status }: ${ _.statusText }` )
)

export const E		= _ => document.createElement( _ )

export const Rs		= ( $, ..._ ) => $.replaceChildren( ..._ )
export const As		= ( $, ..._ ) => $.append( ..._ )
export const AC		= ( $, _ ) => $.appendChild( _ )
export const ACE	= ( $, _ ) => AC( $, E( _ ) )

////////////////////////////////////////////////////////////////	TODO: TEST

const
ReadsAs = ( files, method ) => Promise.all(
	files.map(
		file => new Promise(
			( R, J ) => {
				const
				$ = new FileReader()
				$.onload = () => R( $.result )
				$.onerror = () => J( $.error )
				$[ method ]( file )
			}
		)
	)
)
	
const
ReadFilesAs = ( e, method ) => ReadsAs( [ ...e.target.files ]		, method )
const
ReadDropsAs = ( e, method ) => ReadsAs( [ ...e.dataTransfer.files ]	, method )
const
ReadInputAs = async ( _, method ) => (		//	_: <input type=file>
	_.disabled = true
,	ReadsAs( Array.from( _.files ), method ).finally( () => _.disabled = false )
)

export const ReadFilesAsText		= e => ReadFilesAs( e, 'readAsText'			)
export const ReadDropsAsText		= e => ReadDropsAs( e, 'readAsText'			)
export const ReadInputAsText		= _ => ReadInputAs( _, 'readAsText'			)

export const ReadFilesAsArrayBuffer	= e => ReadFilesAs( e, 'readAsArrayBuffer'	)
export const ReadDropsAsArrayBuffer	= e => ReadDropsAs( e, 'readAsArrayBuffer'	)
export const ReadInputAsArrayBuffer	= _ => ReadInputAs( _, 'readAsArrayBuffer'	)

export const ReadFilesAsDataURL		= e => ReadFilesAs( e, 'readAsDataURL'		)
export const ReadDropsAsDataURL		= e => ReadDropsAs( e, 'readAsDataURL'		)
export const ReadInputAsDataURL		= _ => ReadInputAs( _, 'readAsDataURL'		)

////////////////////////////////////////////////////////////////

export const
Load = options => window.showOpenFilePicker( options ).then(
	pathes => Promise.all( pathes.map( path => path.getFile() ) )
).catch(
	E => { if ( E.name !== 'AbortError' ) throw E }
)

export const
LoadText = options => Load( options ).then( files => Promise.all( files.map( file => file.text() ) ) )

export const
LoadJSONable = options => LoadText( options ).then( texts => Promise.all( texts.map( text => JSON.parse( text ) ) ) )

export const
Save = ( _, options ) => window.showSaveFilePicker( options ).then(
	handle => handle.createWritable().then(
		writable => writable.write( _ ).then(
			() => writable.close()
		)
	)
).catch(
	E => { if ( E.name !== 'AbortError' ) throw E }
)

export const
SaveText = Save

export const
SaveJSONable = ( _, options ) => Save( JSON.stringify( _ ), options )









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


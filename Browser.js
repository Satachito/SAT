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
ReadFilesAs = ( ev, method ) => ReadsAs( [ ...ev.target.files ]			, method )
export const ReadFilesAsText		= ev => ReadFilesAs( ev, 'readAsText'			)
export const ReadFilesAsArrayBuffer	= ev => ReadFilesAs( ev, 'readAsArrayBuffer'	)
export const ReadFilesAsDataURL		= ev => ReadFilesAs( ev, 'readAsDataURL'		)

const
ReadDropsAs = ( ev, method ) => ReadsAs( [ ...ev.dataTransfer.files ]	, method )
export const ReadDropsAsText		= ev => ReadDropsAs( ev, 'readAsText'			)
export const ReadDropsAsArrayBuffer	= ev => ReadDropsAs( ev, 'readAsArrayBuffer'	)
export const ReadDropsAsDataURL		= ev => ReadDropsAs( ev, 'readAsDataURL'		)

const
ReadInputAs = async ( _, method ) => (		//	<input type=file>
	_.disabled = true
,	ReadsAs( [ ..._.files ], method ).finally( () => _.disabled = false )
)
export const ReadInputAsText		= _ => ReadInputAs( _, 'readAsText'		)
export const ReadInputAsArrayBuffer	= _ => ReadInputAs( _, 'readAsArrayBuffer'	)
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
LoadJSON = options => LoadText( options ).then( texts => Promise.all( texts.map( text => JSON.parse( text ) ) ) )

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


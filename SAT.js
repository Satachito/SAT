////////////////////////////////////////////////////////////////

export const
ExpandTab = ( _, nSpaces = 4 ) => _.split( '\n' ).map(
	_ => [ ..._ ].reduce(
		( $, _ ) => (
			$ += _ === '\t'
			?	' '.repeat( nSpaces - ( $.length % nSpaces ) )
			:	_
		,	$
		)
	,	''
	)
).join( '\n' )

////////////////////////////////////////////////////////////////
//	URLが存在しない場合 fetch 自体が TypeError( 'TypeError', 'Failed to fetch' ) を throw してくる
//	response.ok が false の場合、response 自体を throw する
//	Browser.js に Browser が catch した時のために AlertForFetch を用意してある。

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
PostJSON = async ( _, $ ) => FetchJSON(
	_
,	{	method	: 'POST'
	,	headers	: { 'Content-Type': 'application/json' }
	,	body	: JSON.stringify( $ )
	}
)

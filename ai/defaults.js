//	Default model options for <ai-assistant> ( before Fetch ).

export const
DEFAULT_MODELS	= {
	anthropic	: [
		{ id: 'claude-fable-5', label: 'Fable 5 (best)' }
	,	{ id: 'claude-opus-4-8', label: 'Opus 4.8' }
	,	{ id: 'claude-sonnet-5', label: 'Sonnet 5 (balanced)' }
	,	{ id: 'claude-haiku-4-5', label: 'Haiku 4.5 (cheap)' }
	]
,	openai		: [
		{ id: 'gpt-5.6', label: 'gpt-5.6 (best)' }
	,	{ id: 'gpt-5.6-terra', label: 'gpt-5.6-terra (balanced)' }
	,	{ id: 'gpt-5.6-luna', label: 'gpt-5.6-luna (cheap)' }
	]
}

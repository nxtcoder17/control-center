import { type Ref } from 'solid-js'

interface TextFieldProps {
	ref?: Ref<HTMLInputElement>
	value: string
	setValue: (value: string) => void
	placeholder?: string
	class?: string
	autofocus?: boolean
	disabled?: boolean
}

export const TextField = (props: TextFieldProps) => {
	return <input
		type="text"
		ref={props.ref}
		autofocus={props.autofocus}
		disabled={props.disabled}
		placeholder={props.placeholder}
		class={props.class}
		value={props.value}
		onInput={(e) => {
			props.setValue(e.target.value)
		}}
	/>
}

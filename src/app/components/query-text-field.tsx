import type { Component, Ref } from "solid-js";
import { TextField } from "../../pkg/ui/components/inputs";

interface QueryTextFieldArgs {
	ref?: Ref<HTMLInputElement>;
	value: string;
	setValue: (value: string) => void;
	placeholder: string;
	disabled?: boolean;
	class?: string;
}

export const QueryTextField: Component<QueryTextFieldArgs> = (
	props: QueryTextFieldArgs,
) => {
	return (
		<TextField
			value={props.value}
			ref={props.ref}
			setValue={(v) => {
				props.setValue(v);
			}}
			placeholder={props.placeholder}
			autofocus
			disabled={props.disabled}
			class={`bg-inherit dark:text-blue-50 rounded-r-md w-full px-4 py-2 text-lg leading-4 tracking-wider outline-none focus:outline-none border-none ring-0 focus:ring-0 flex-1 placeholder:font-bold placeholder:text-lg ${props.class ?? ""}`}
		/>
	);
};

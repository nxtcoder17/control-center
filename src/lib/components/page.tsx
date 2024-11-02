import { type Component } from "solid-js";

interface PageRootAttrs {
	class?: string;
	debug?: boolean;
	"overflow-y"?: boolean;
	"overflow-x"?: boolean;
	children?: any;
}

/*
NOTE: To have something like , you need to have a parent element with no scrollbars, and then have a child element with scrollbars.

You need to have something like this:
	<div class={`h-screen overflow-hidden`}>
		<div class="flex flex-col h-full">
			{ props.children }
		</div>
	</div>

the main ingredient is
1. h-screen overflow-hidden, on the parent element to fix the parent component
2. pass on h-full to any layout components that need to be full height, like `flex flex-col h-full`
*/

export const PageRoot: Component<PageRootAttrs> = (props) => {
	return (
		<div
			class={`min-h-screen relative h-max overflow-hidden ${props.class ?? ""}`}
			classList={{
				"border-8 border-green-800": props.debug,
				"overflow-y-auto": props["overflow-y"],
				"overflow-x-auto": props["overflow-x"],
			}}
		>
			{props.children}
		</div>
	);
};

export const PageRoot2: Component<PageRootAttrs> = (props) => {
	return (
		<div
			class={`h-screen min-h-screen w-screen truncate overflow-auto flex flex-col ${props.class ?? ""}`}
			classList={{
				"border-8 border-green-800": props.debug,
				"overflow-y-auto": props["overflow-y"],
				"overflow-x-auto": props["overflow-x"],
			}}
		>
			{props.children}
		</div>
	);
};

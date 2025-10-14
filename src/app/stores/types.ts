export interface HLText {
	text?: string;
	hl: boolean;
}

export interface HLMatchMeta {
	title: HLText[];
	url: HLText[];
}

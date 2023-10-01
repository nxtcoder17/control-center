import { type Component } from 'solid-js'

interface PowerlineIconAttrs {
  class: string
}

export const PowerlineIcon: Component<PowerlineIconAttrs> = (props: PowerlineIconAttrs) => {
  // return <svg
  //   viewBox="0 0 15 15"
  //   fill="currentColor"
  //   preserveAspectRatio="none"
  //   stroke-width="0"
  //   class={props.class}
  //   style={{ overflow: 'visible' }}
  //   xmlns="http://www.w3.org/2000/svg"
  // >
  //   {/* <g id="SVGRepo_bgCarrier" stroke-width="0" /> */}
  //   {/* <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" /> */}
  //   {/* <g id="SVGRepo_iconCarrier"> */}
  //   <path d="M12 7.5L4 0V15L12 7.5Z" />
  //   {/* </g> */}
  // </svg>

  // return <svg viewBox="0 0 48 48"
  //   // height="24"
  //   // width="24"
  //   fill="currentColor"
  //   // preserveAspectRatio="none"
  //   stroke-width="0"
  //   class={props.class}
  //   style={{ overflow: 'visible' }}
  //   xmlns="http://www.w3.org/2000/svg"><path d="M20 12L32 24L20 36V12Z" fill="#333" stroke="#333" stroke-width="1" stroke-linejoin="round" /></svg>
  //
  return (
    <svg
      fill="currentColor"
      preserveAspectRatio="none"
      class={props.class}
      stroke-width="0"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
      viewBox="300 159.97 424 704.05"
    >
      <path
        d="M715.8 493.5 335 165.1c-14.2-12.2-35-1.2-35 18.5v656.8c0 19.7 20.8 30.7 35 18.5l380.8-328.4c10.9-9.4 10.9-27.6 0-37z" />
    </svg>
  )
}

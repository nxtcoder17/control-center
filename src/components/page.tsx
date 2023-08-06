import { type Component } from 'solid-js'

interface PageRootAttrs {
  class?: string
  debug?: boolean
  'overflow-y'?: boolean
  'overflow-x'?: boolean
  children?: any
}

export const PageRoot: Component<PageRootAttrs> = (props) => {
  // return <div class={`h-full min-h-screen w-screen truncate overflow-none flex flex-col ${props.class}`}
  return <div class={`h-screen min-h-screen w-screen truncate overflow-auto flex flex-col ${props.class ?? ''}`}
    classList={{
      'border-8 border-green-800': props.debug,
      'overflow-y-auto': props['overflow-y'],
      'overflow-x-auto': props['overflow-x'],
    }}
  >
    {props.children}
  </div>
}

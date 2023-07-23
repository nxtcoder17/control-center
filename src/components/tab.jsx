import PropTypes from "prop-types";
import { TbVolumeOff, TbPinned } from 'solid-icons/tb'
import { createEffect, Switch, Match } from 'solid-js';
import { FaBrandsGithub } from 'solid-icons/fa'

const FavIcon = (props) => {
  return <Switch fallback={<img src={props.tabInfo.favIconUrl} />}>
    <Match when={props.tabInfo?.url?.startsWith("https://github.com")}>
      <FaBrandsGithub class="w-max h-max" />
    </Match>
  </Switch>
}

export const Tab = (props) => {
  let ref;
  createEffect(() => {
    if (props.isSelected) {
      ref.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
    }
  })

  return <div class="flex-1 flex flex-row gap-3 tracking-wide text-gray-700 px-2 py-1 cursor-pointer transition-all items-center overflow-y-auto overflow-x-auto"
    classList={{
      "bg-slate-300 dark:bg-slate-900 dark:text-slate-300": props.isSelected,
      "bg-slate-100 dark:bg-slate-700 dark:text-slate-400": !props.isSelected,
    }}
    ref={ref}
    onClick={() => props.onClick()}>
    <div class="flex flex-row gap-3 items-center">
      <div class="text-lg font-bold bg-blue-700 text-indigo-300 absolute -left-5 rounded-tl-md rounded-bl-md">
        {props.vimMark && <div class="px-2 py-1 w-7 scale-125">
          <div class="flex place-content-center">
            <div>{props.vimMark}</div>
          </div>
        </div>}
      </div>
      {/* {props.vimMark && <div class="text-xl font-bold bg-blue-700 text-indigo-300 rounded-md px-2">{props.vimMark}</div>} */}
      <div class="flex px-1">
        <div class="flex-initial w-5 text-right text-lg pl-1 overflow-visible">{props.index}</div>
      </div>
      <div class="w-5 h-5 flex items-center justify-center">
        <FavIcon tabInfo={props.tabInfo} />
      </div>
    </div>
    <div class="flex-initial text-lg w-2/3 truncate">{props.tabInfo.title}</div>
    <div class="flex-initial text-sm w-1/3 truncate"
      classList={{
        "dark:text-slate-400 text-slate-600": props.isSelected,
        "dark:text-slate-500 text-slate-400": !props.isSelected,
      }}
    >{props.tabInfo.url?.split('?')[0]}</div>
    <div class="">{props.tabInfo.pinned ? <TbPinned class="w-5 h-5" /> : <div class='w-5 h-5' />}</div>
    <div class="">{props.tabInfo.mutedInfo?.muted ? < TbVolumeOff class="w-5 h-5" /> : <div class='w-5 h-5' />}</div>
  </div >;
}

Tab.propTypes = {
  title: PropTypes.string,
  faviconUrl: PropTypes.string,
};

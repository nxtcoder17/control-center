import PropTypes from "prop-types";
import { TbVolumeOff, TbPinned } from 'solid-icons/tb'
import { createEffect } from 'solid-js';

export const Tab = (props) => {
  let ref;
  createEffect(() => {
    if (props.isSelected) {
      setTimeout(function() { // waiting for all  focus things to be done
        ref.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
      }, 0);
    }
  })

  return <div class="flex flex-row gap-3 tracking-wide text-gray-700 rounded-md px-2 py-1 dark:hover:bg-slate-700 cursor-pointer transition-all items-center overflow-y-auto"
    classList={{
      "bg-slate-200 dark:bg-slate-900 dark:text-slate-300": props.isSelected,
      "bg-slate-50 dark:bg-slate-700 dark:text-slate-400": !props.isSelected,
    }}
    ref={ref}
    onClick={() => props.onClick()}>
    <div class="flex flex-row gap-3 items-center">
      {props.bookmark && <div class="text-xl font-bold bg-gray-900 text-blue-100 px-2">k</div>}
      <div class="flex-initial w-5 truncate text-right text-lg">{props.index}</div>
      <div class="w-5 h-5 flex items-center justify-center">
        <img src={props.tabInfo.favIconUrl} />
      </div>
    </div>
    <div class="flex-initial text-lg w-2/3 truncate">{props.tabInfo.title}</div>
    <div class="flex-initial text-lg w-1/3 truncate"
      classList={{
        "dark:text-slate-300 text-slate-300": props.isSelected,
        "dark:text-slate-500 text-slate-400": !props.isSelected,
      }}
    >{props.tabInfo.url}</div>
    <div class="">{props.tabInfo.pinned ? <TbPinned class="w-5 h-5" /> : <div class='w-5 h-5' />}</div>
    <div class="">{props.tabInfo.mutedInfo?.muted ? < TbVolumeOff class="w-5 h-5" /> : <div class='w-5 h-5' />}</div>
  </div >
}

Tab.propTypes = {
  title: PropTypes.string,
  faviconUrl: PropTypes.string,
};

import cn from 'classnames'
import PropTypes from "prop-types";
import { TbVolumeOff, TbPinned } from 'solid-icons/tb'
import { createEffect, onMount } from 'solid-js';

export const Tab = (props) => {
  let ref;
  createEffect(() => {
    if (props.isSelected) {
      ref.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
    }
  })

  return <div
    class={cn("tracking-wide text-gray-700  px-2 py-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all flex flex-row justify-between", {
      "bg-slate-200 dark:bg-slate-900 dark:text-slate-300": props.isSelected,
      "bg-slate-50 dark:bg-slate-700 dark:text-slate-400": !props.isSelected,
    })}
    // ref={props.isSelected ? props.ref : null}
    ref={ref}
    onClick={() => props.onClick()}>
    <div class="flex flex-row items-center gap-2">
      <div class="h-5 w-5">
        <img src={props.tabInfo.favIconUrl} />
      </div>
      <span class="text-base">{props.tabInfo.title}</span>
    </div>

    <div class="flex flex-row gap-2 items-center">
      <span class="text-sm">{props.tabInfo.pinned ? <TbPinned size="20" /> : ""}</span>
      <span class="text-sm">{props.tabInfo.mutedInfo?.muted ? < TbVolumeOff size="20" /> : ""}</span>
    </div>

  </div>
}

Tab.propTypes = {
  title: PropTypes.string,
  faviconUrl: PropTypes.string,
};
import cn from 'classnames'
import PropTypes from "prop-types";
import { TbVolumeOff, TbPinned } from 'solid-icons/tb'
import { createEffect } from 'solid-js';
import { logger } from '../pkg/logger';

export const Tab = (props) => {
  let ref;
  createEffect(() => {
    if (props.isSelected) {
      ref.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
    }
  })

  createEffect(() => {
    logger.info(props.matches, "matches")
    const x = props.matches.filter(m => m.key === "title").indices.map(midx => props.tabInfo.title.slice(midx[0], midx[1]))
    logger.info(x, "tab title matches")
  }, "")


  return <div
    class={cn("tracking-wide text-gray-700  px-2 py-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all flex flex-row justify-between", {
      "bg-slate-200 dark:bg-slate-900 dark:text-slate-300": props.isSelected,
      "bg-slate-50 dark:bg-slate-700 dark:text-slate-400": !props.isSelected,
    })}
    ref={ref}
    onClick={() => props.onClick()}>
    <div class="flex-1 flex flex-row items-center gap-2">
      {/* {props.index != -1 && <span class="text-lg">{props.index}</span>} */}
      <span class="text-lg">{props.index}</span>
      <div class="h-5 w-5">
        <img src={props.tabInfo.favIconUrl} />
      </div>
      <div class='flex-1 flex justify-between px-2'>
        <span class="text-lg w-2/4">{props.tabInfo.title}</span>
        <span class="text-lg dark:text-gray-500">{props.tabInfo.url.split('?')[0]}</span>
      </div>
    </div>

    <div class="flex flex-row gap-2 items-center">
      <span class="text-sm">{props.tabInfo.pinned ? <TbPinned class="w-5 h-5" /> : <div class='w-5 h-5' />}</span>
      <span class="text-sm">{props.tabInfo.mutedInfo?.muted ? < TbVolumeOff size="20" /> : ""}</span>
    </div>
  </div>
}

Tab.propTypes = {
  title: PropTypes.string,
  faviconUrl: PropTypes.string,
};


export const TabItem = (props) => {
  return <div
    class={cn("tracking-wide text-gray-700  px-2 py-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all flex flex-row justify-between", {
      "bg-slate-200 dark:bg-slate-900 dark:text-slate-300": props.isSelected,
      "bg-slate-50 dark:bg-slate-700 dark:text-slate-400": !props.isSelected,
    })}
    onClick={() => props.onClick()}
  >
    <div class="flex-1 flex flex-row items-center gap-2">
      <div class="h-5 w-5" />
      <div class='flex-1 flex justify-between px-2'>
        <span class="text-lg">{props.label}</span>
      </div>
    </div>
  </div>
};

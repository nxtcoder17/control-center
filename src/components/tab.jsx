import PropTypes from "prop-types";
import { TbVolumeOff, TbPinned } from 'solid-icons/tb'
import { createEffect } from 'solid-js';

export const Tab = (props) => {
  let ref;
  createEffect(() => {
    if (props.isSelected) {
      ref.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
    }
  })

  // createEffect(() => {
  //   logger.info(props.matches, "matches")
  //   const x = props.matches?.filter(m => m.key === "title").indices.map(midx => props.tabInfo.title.slice(midx[0], midx[1]))
  //   logger.info(x, "tab title matches")
  // }, "")

  return <div class="flex flex-row gap-3 tracking-wide text-gray-700 rounded-md px-2 py-0.5 dark:hover:bg-slate-700 cursor-pointer transition-all"
    classList={{
      "bg-slate-200 dark:bg-slate-900 dark:text-slate-300": props.isSelected,
      "bg-slate-50 dark:bg-slate-700 dark:text-slate-400": !props.isSelected,
    }}
    ref={ref} onClick={() => props.onClick()}>
    <div class="flex-initial w-5 truncate text-right">{props.index}</div>
    <div class="w-5 h-5">
      <img src={props.tabInfo.favIconUrl} />
    </div>
    <div class="flex-initial w-2/3 truncate">{props.tabInfo.title}</div>
    <div class="flex-initial w-1/3 truncate">{props.tabInfo.url}</div>
    <div class="">{props.tabInfo.pinned ? <TbPinned class="w-5 h-5" /> : <div class='w-5 h-5' />}</div>
    <div class="">{props.tabInfo.mutedInfo?.muted ? < TbVolumeOff class="w-5 h-5" /> : <div class='w-5 h-5' />}</div>
  </div >
}

Tab.propTypes = {
  title: PropTypes.string,
  faviconUrl: PropTypes.string,
};

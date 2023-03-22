import cn from 'classnames'
import PropTypes from "prop-types";

export const Tab = (tabData) => {
  return <div
    className={cn("tracking-wide text-gray-700  px-2 py-2 rounded-md hover:bg-slate-200 cursor-pointer transition-all", {
      "bg-slate-200": tabData.isSelected,
      "bg-slate-50 ": !tabData.isSelected,
    })}
    onClick={tabData.onClick}>
    <div className="flex flex-row items-center gap-4">
      <div className="flex items-center justify-center h-10 w-10">
        <img src={tabData.favIconUrl} />
      </div>
      <span className="text-xl">{tabData.title}</span>
    </div>
  </div>
}

Tab.propTypes = {
  title: PropTypes.string,
  faviconUrl: PropTypes.string,
};

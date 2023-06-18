import { Select } from '@kobalte/core'

import { FiSettings } from 'solid-icons/fi'
import { FiCheck } from 'solid-icons/fi'
import { FiChevronDown } from 'solid-icons/fi'

export const NxtSelect = (props) => {
  const style = {
    "select__item": "bg-slate-200 flex flex-row items-center gap-2 px-2 py-1 border border-slate-100",
    "select__item-indicator": "bg-blue-200",
    "select__value": "bg-green-500",
    "select__trigger": "bg-yellow-200 flex flex-row items-center",
    "select__listbox": "bg-yellow-200 flex flex-row items-center",
  }

  return <Select.Root
    options={props.items}
    placeholder="Select a fruit…"
    itemComponent={props => (
      <Select.Item item={props.item} class={style["select__item"]}>
        <Select.ItemLabel>{props.item.rawValue}</Select.ItemLabel>
        <Select.ItemIndicator class={style["select__item-indicator"]}>
          <FiCheck />
        </Select.ItemIndicator>
      </Select.Item>
    )}
  >
    <Select.Trigger class={style["select__trigger"]} aria-label="Fruit">
      <Select.Value class={style["select__value"]}>
        {state => state.selectedOption()}
      </Select.Value>
      <Select.Icon class={style["select__icon"]}>
        <FiChevronDown />
      </Select.Icon>
    </Select.Trigger>
    <Select.Portal>
      <Select.Content class={style["select__content"]}>
        <Select.Listbox class={style["select__listbox"]} />
      </Select.Content>
    </Select.Portal>
  </Select.Root>
}


import { type InitializedResource, createEffect, createResource, type Setter } from 'solid-js'
import { DEFAULT_EMPTY_MARKS, type Marks } from '../types'
import { browserApi } from '../webext-apis/browser-api'

async function fetchMarks(): Promise<Marks> {
  const v = await browserApi.localStore.get<Marks>('tabs-vim-marks')
  if (v == null) {
    return DEFAULT_EMPTY_MARKS
  }

  return v
}

export const useMarks = (): [InitializedResource<Marks>, Setter<Marks>] => {
  const [marks, { mutate }] = createResource<Marks>(fetchMarks, { initialValue: {} satisfies Marks, name: 'marks' })

  createEffect(() => {
    const lMarks = marks()
    if (Object.keys(lMarks).length === 0) {
      return
    }
    void (async () => {
      await browserApi.localStore.set('tabs-vim-marks', lMarks)
      logger.debug('persisted marks into local-storage', { marks: lMarks })
    })()
  })

  return [marks, mutate]
}

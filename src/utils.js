import {
  getDefaultKeyBinding,
  KeyBindingUtil,
  EditorState,
  convertToRaw,
} from 'draft-js'

const { hasCommandModifier } = KeyBindingUtil

export const myKeyBindingFn = getEditorState => (e) => {
  // J'aurais préféré CTRL+$ que CTRL+M, mais cela semble
  // un peu compliqué car chrome gère mal e.key.
  // if (e.key === '$' && hasCommandModifier(e))
  if (e.keyCode === /* m */ 77 && hasCommandModifier(e)) {
    return 'insert-texblock'
  }
  if (e.key === /* $ */ '$' /* && hasCommandModifier(e)*/) {
    const c = getEditorState().getCurrentContent()
    const s = getEditorState().getSelection()
    if (!s.isCollapsed()) return 'insert-inlinetex'
    const bk = s.getStartKey()
    const b = c.getBlockForKey(bk)
    const offset = s.getStartOffset() - 1
    if (b.getText()[offset] === '\\') {
      return `insert-char-${e.key}`
    }
    return 'insert-inlinetex'
  }
  // if (e.key === '*') {
  //   return 'test'
  // }
  // gestion du cursor au cas où il est situé près d'une formule
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    const d = e.key === 'ArrowRight' ? 'r' : 'l'
    const s = getEditorState().getSelection()
    const c = getEditorState().getCurrentContent()
    if (!s.isCollapsed()) { return undefined }
    const offset = s.getStartOffset()
    const blockKey = s.getStartKey()
    const cb = c.getBlockForKey(blockKey)
    if (cb.getLength() === offset && d === 'r') {
      const b = c.getBlockAfter(blockKey)
      if (b && b.getType() === 'atomic' && b.getData().get('mathjax')) { return `update-texblock-${d}-${b.getKey()}` }
    }
    if (offset === 0 && d === 'l') {
      const b = c.getBlockBefore(blockKey)
      if (b && b.getType() === 'atomic' && b.getData().get('mathjax')) { return `update-texblock-${d}-${b.getKey()}` }
    }
    const ek = cb.getEntityAt(offset - (e.key === 'ArrowLeft' ? 1 : 0))
    if (ek && c.getEntity(ek).getType() === 'INLINETEX') {
      return `update-inlinetex-${d}-${ek}`
    }
  }

  return getDefaultKeyBinding(e)
}

export function findInlineTeXEntities(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges(
    (character) => {
      const entityKey = character.getEntity()
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === 'INLINETEX'
      )
    },
    callback,
  )
}

export function changeDecorator(editorState, decorator) {
  return EditorState.create({
    allowUndo: true,
    currentContent: editorState.getCurrentContent(),
    decorator,
    selection: editorState.getSelection(),
  })
}

export function getMostUsedTeXCmds(teX) {
  const cmdRe = /\\([a-zA-Z]+)/
  let copy = teX
  const res = {}
  let search
  let cmd
  while (true) {
    search = cmdRe.exec(copy)
    if (search === null) break
    cmd = search[1]
    copy = copy.slice(search.index + cmd.length + 1)
    if (Object.prototype.hasOwnProperty.call(res, cmd)) {
      res[cmd] += 1
    } else {
      res[cmd] = 1
    }
  }

  return res
}

export function getAllTeX(contentState) {
  const entityMapObj = convertToRaw(contentState).entityMap
  const entityKeys = Object.keys(entityMapObj)
  const entityMap = entityKeys.map(k => entityMapObj[k])
  // Todo: lorsque drafjs sera en version 0.11.0,
  // remplacer ce qui précède par
  // const entityMap = contentState.getBlockMap()
  const blockMap = contentState.getBlockMap()

  let allTeX = entityMap
    .filter(e => e.type === 'INLINETEX')
  // Todo: lorsque drafjs sera en version 0.11.0,
  // .filter(e => e.get('type') === 'INLINETEX');;
    .reduce((red, e) => red + e.data.teX, '')
  // Todo: lorsque drafjs sera en version 0.11.0,
  // .reduce((red, e) => red + e.get('data').teX, '')
  allTeX = blockMap
    .filter(b => b.getData().mathjax)
    .reduce((red, b) => red + b.getData().teX, allTeX)

  return allTeX
}

export function getInitialMostUsedTeXCmds(editorState) {
  return getMostUsedTeXCmds(
    getAllTeX(editorState.getCurrentContent()),
  )
}

export function updateMostUsedTeXCmds(
  newTeX,
  mostUsedCommands,
  lastTex,
) {
  const newest = getMostUsedTeXCmds(newTeX)
  const old = getMostUsedTeXCmds(lastTex)
  const muc = { ...mostUsedCommands }
  const nk = Object.keys(newest)
  const ok = Object.keys(old)

  // newest including newest inter old
  let nmuc = nk.reduce((red, cmd) => {
    let repeat = newest[cmd]
    const nred = { ...red }
    if (Object.prototype.hasOwnProperty.call(old, cmd)) {
      repeat -= old[cmd]
    }
    if (Object.prototype.hasOwnProperty.call(nred, cmd)) {
      nred[cmd] += repeat
    } else {
      nred[cmd] = repeat
    }
    return nred
  }, muc)

  // old not inside newest
  nmuc = ok.filter(k => (nk.indexOf(k) === -1))
    .reduce((red, cmd) => {
      const nred = { ...red }
      if (Object.prototype.hasOwnProperty.call(nred, cmd)) {
        nred[cmd] -= old[cmd]
      }
      return nred
    }, nmuc)

  // console.log(nmuc)
  return nmuc
}

export function mergeMacros(teXCmds, macros) {
  return Object.keys(macros).reduce((red, m) => {
    const firstChar = m[0].toLowerCase()
    const tmp = [...red[firstChar]]
    tmp.unshift(m)
    tmp.sort()
    return { ...red, [firstChar]: tmp }
  }, { ...teXCmds })
}

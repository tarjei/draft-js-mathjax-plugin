# DraftJS MathJax Plugin

*This is a plugin for the `draft-js-plugins-editor`.*

This plugin allows you to edit math rendered by mathjax. [Give it a try!](https://efloti.github.io/draft-js-mathjax-plugin/)

It use the traditional `$` key to insert inline math and `CTRL+M` for block one. (Type `\$` to insert de `$` character)

![demo](https://github.com/efloti/draft-js-mathjax-plugin/raw/master/demo.gif)

## Installation

```
npm install draft-js-mathjax-plugin --save
```

## Usage

```js
import React, { Component } from 'react'
import Editor from 'draft-js-plugins-editor'
import createMathjaxPlugin from 'draft-js-mathjax-plugin'
// import other plugins, eg.:
// import createLinkifyPlugin from 'draft-js-linkify-plugin'
import { EditorState } from 'draft-js'

const mathjaxPlugin = createMathjaxPlugin()
//const linkifyPlugin = createLinkifyPlugin()

const plugins = [
  mathjaxPlugin,
  // linkifyPlugin,
]

export default class MyEditor extends Component {

  state = {
    editorState: EditorState.createEmpty(),
  }

  onChange = (editorState) => {
    this.setState({
      editorState,
    })
  }

  render() {
    return (
      <Editor
        editorState={this.state.editorState}
        onChange={this.onChange}
        plugins={plugins}
      />
    )
  }
}
```

Learn more [draftjs-plugins](https://github.com/draft-js-plugins/draft-js-plugins)

## Todo

  - give the ability to configure the plugin (key binding, style, ...),
  - improve help for tex editing (completion, snippet ...),
  - ...

## License

MIT

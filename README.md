# jQuery Collapsable

## Installation, examples, options, ...
Please see the plugin site http://zipper.github.io/jquery.collapsable/

## Changelog

### 2.0.8
- added control if hash in url is valid selector, eg. `#_=_` is would cause jQuery to throw an error 

### 2.0.7
- when collapsable control anchor is present in HTML and its `href` attribute is `#`, then it is replaced with collapsable box id

### 2.0.6
- fixup: default expanded box could have been ignored under certain circumstances

### 2.0.5
- there could be more than one box per collapsable element, id's are suffixed with index of the box and aria-controls attribute is changed appropriately

### 2.0.4
- fixes #10 (empty hash `#` in url causes JS error in jQuery 3 when used as selector `$('#')`)

### 2.0.3
- fixed JS error when called on empty jQuery object with `collapsableAll: false` set - fixes #7
- items are properly collapsed on initialization when combination of `collapsableAll` and `accordion` is used - fixes #8

### 2.0.2
- renamed property ~~`originalEvent`~~ to `collapsableEvent`, so `preventDefault` called on `expand.collapsable`/`collapse.collapsable` event doesn't prevent that custom event as well

### 2.0.1
- renamed option ~~`grouped`~~ to more recognizable `accordion`
- changed default `fx` value to `null` for no effect used
- changed order of executing `fx` function and class assigning so it doesn't interfere with jQuery effects
- default value of `extLinks.selector` to empty string `''`
- move class name option for active external links into `classNames`
- destroy function now actually works properly :) some optimizations were done to destroy method apart from making it work
- when destroy is called, aria attributes are removed as well
- `isExpanded` is not a method anymore
- bugfix of not binding event on control element if it is anchor

### 2.0.0

- Plugin has been completely rewritten.

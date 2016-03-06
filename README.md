# jQuery Collapsable

## Installation, examples, options, ...
Please see the plugin site http://zipper.github.io/jquery.collapsable/

## Changelog

### 2.0.1
- renamed option `grouped` to more recognizable ``accordion`
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

Web client served by [Volumio Now Playing plugin](https://github.com/patrickkfkan/volumio-now-playing) (version: > 0.1.4), implemented in ReactJS.

## Changelog

0.2.4
- Add hourly weather to idle screen (tap / click "Current" weather to toggle between daily and hourly).
- Idle screen now shows all available forecast periods - scroll horizontally to view.
- Add workaround to seekbar for music services that don't push 'stop' state when playback finishes, causing displayed seek time to overflow duration.
- Add support for metadata font settings
- Improve responsive display of grid columns on browse screen.
- Add "Maximize" button to browse screen and queue for displays with horizontal resolutions higher than 1024px, so that contents won't be fixed at 80% width.
- Misc UI fixes and improvements

0.2.3
- Fix volume bar of docked volume indicator closing on click

0.2.2
- Improve seekbar accuracy when screen is inactive
- Add support for option to show volume bar when docked volume indicator is clicked
- Add translation support
- Misc UI fixes

0.2.1
- Minor bug fix

0.2.0
- Add Idle Screen
- Add support for Dock Components:
  - Action Panel trigger
  - Volume Indicator (replaces Volume Indicator Tweaks)
  - Clock
  - Weather
- Add support for seek time font size and color
- Fix state not updating on socket reconnect
- Fix seekbar's unreasonably high memory consumption (caused by `react-range` component; switched to `rc-slider` instead)
- Various other bug fixes

0.1.2
- Add support for the following style settings:
  - Track info display order
  - Album art border
  - Background overlay gradients
  - Additional Volume Indicator Tweaks
- Some minor bug fixes

0.1.1
- Add menus
- Add metadata service support
- Add Info View to Now Playing Screen
- Add performance settings support
- Misc UI fixes and improvements

0.1.0
- Initial release

## License

MIT

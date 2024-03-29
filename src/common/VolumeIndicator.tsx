import classNames from 'classnames';
import React, { HTMLProps, useCallback, useMemo } from 'react';
import { usePlayerState } from '../contexts/PlayerProvider';
import './VolumeIndicator.scss';
import { StylesBundleProps } from './StylesBundle';

export interface VolumeIndicatorProps extends StylesBundleProps {
  showDial?: boolean;
  onClick?: HTMLProps<HTMLDivElement>['onClick'];
}

const VolumeIndicator = React.forwardRef<HTMLDivElement, VolumeIndicatorProps>((props, ref) => {
  const playerState = usePlayerState();
  const isMuted = playerState.mute !== undefined ? playerState.mute : false;
  const volume = playerState.volume || 0;

  const baseClassName = props.styles ? props.styles.baseClassName : null;
  const stylesBundle = baseClassName ? props.styles?.bundle : null;
  const extraClassNames = (props.styles ? props.styles.extraClassNames : null) || [];

  const mainClassName = (baseClassName && stylesBundle) ?
    classNames(
      stylesBundle[baseClassName] || 'VolumeIndicator',
      [ ...extraClassNames ]
    )
    :
    classNames(
      'VolumeIndicator',
      [ ...extraClassNames ]
    );

  const getElementClassName = useCallback((element: string) => (baseClassName && stylesBundle) ?
    stylesBundle[`${baseClassName}__${element}`] || `VolumeIndicator__${element}` :
    `VolumeIndicator__${element}`, [ baseClassName, stylesBundle ]);


  const getIcon = useCallback(() => {
    const iconClassNames = classNames(
      getElementClassName('icon'),
      playerState.mute ? getElementClassName('icon--muted') : null
    );
    return (
      <span className={iconClassNames}>{playerState.mute ? 'volume_off' : 'volume_up'}</span>
    );
  }, [ playerState.mute, getElementClassName ]);

  const getText = useCallback(() => {
    if (playerState.mute) {
      return null;
    }

    return (
      <><span className={getElementClassName('text')}>{`${volume || 0}`}</span><span
        className={getElementClassName('percentSymbol')}>%</span></>
    );

  }, [ playerState.mute, volume, getElementClassName ]);

  const dial = useMemo(() => {
    if (props.showDial === undefined || props.showDial) {
      return (<div className={getElementClassName('dialWrapper')}>
        <svg>
          <circle
            className={classNames(
              getElementClassName('dial'),
              getElementClassName('dial--primary')
            )}
            cx="50%"
            cy="50%"
            r="3.5em">
          </circle>
          <circle
            className={classNames(
              getElementClassName('dial'),
              getElementClassName('dial--highlight'),
              isMuted ? getElementClassName('dial--muted') : null
            )}
            cx="50%"
            cy="50%"
            r="3.5em"
            pathLength="100">
          </circle>
        </svg>
      </div>);
    }
    return null;
  }, [ props.showDial, isMuted, getElementClassName ]);

  return (
    <div
      ref={ref}
      className={mainClassName}
      style={{ '--volume-level': `${volume}px` } as React.CSSProperties}
      onClick={props.onClick}>
      {dial}
      <div className={classNames(
        getElementClassName('contents'),
        dial ? null : getElementClassName('contents--noDial')
      )}>
        {getIcon()}
        {getText()}
      </div>
    </div>
  );
});

VolumeIndicator.displayName = 'VolumeIndicator';

export default VolumeIndicator;

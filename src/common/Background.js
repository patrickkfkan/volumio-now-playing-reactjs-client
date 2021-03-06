import { useCallback, useEffect, useRef, useReducer } from "react";
import './Background.scss';
import './animations.scss';
import { sanitizeImageUrl } from "../utils/track";
import { useAppContext } from "../contexts/AppContextProvider";
import Image from "./Image";
import { preloadImage } from "../utils/image";
import classNames from "classnames";
import ContextualCSSTransition from "./ContextualCSSTransition";
import { usePerformanceContext, useRawSettings } from "../contexts/SettingsProvider";
import { usePlayerState } from "../contexts/PlayerProvider";

/**
   * Transition state phases:
   * 0. undefined - uninitialized state; for skipping first transition with empty albumart
   * 1. 'idle' - not doing anything
   * 2. 'preload' - preload background image
   * 3. 'beforeTransition' - prepare for transition
   * 3. 'transition' - transition to preloaded background image
   * 4. 'afterTransition' - transition completed
   * 
   * For webkit browsers, we rely on background-image CSS transition. After 'preload', there is
   * no need to go through the 'beforeTransition' and 'transition' phases as they are for manual
   * cross-fade image transition in non-webkit browsers. Instead, we shall skip directly to the 
   * 'afterTransition' phase.
   * 
   */
 const initialTransitionState = {
  targetSrc: null,
  loadedSrc: null,
  lastTargetSrc: null,
  lastLoadedSrc: null,
  phase: undefined
};

function Background(props) {
  const {host} = useAppContext();
  const playerState = usePlayerState();
  const {settings: backgroundSettings} = useRawSettings('background');
  const fallbackSrc = host + '/albumart';
  const pendingTargetSrc = useRef(null);
  const {disableTransitions} = usePerformanceContext();

  const transitionStateReducer = (state, transitionProps = {}) => {
    return {...state, ...transitionProps};
  };
  
  const [transitionState, updateTransitionState] = useReducer(transitionStateReducer, initialTransitionState);

  const isWebkit = navigator.userAgent.indexOf('AppleWebKit') >= 0;
  const isTransitionable = (backgroundSettings.backgroundType !== 'volumioBackground' || 
    backgroundSettings.volumioBackgroundImage === '') && backgroundSettings.backgroundType !== 'color';

  // Handle change in playerState albumart
  useEffect(() => {
    if (transitionState.phase === undefined && !playerState.albumart) {
      return;
    }
    const targetSrc = playerState.albumart ? sanitizeImageUrl(playerState.albumart, host) : fallbackSrc;

    // Return if albumart is the same as current or previous transitioned image 
    // and also same as pending src
    if ((transitionState.targetSrc === targetSrc ||
      transitionState.lastTargetSrc === targetSrc) &&
      pendingTargetSrc.current === targetSrc) {
        return;
    }
    // If background is still undergoing a transition, we set the new albumart as pending
    if (transitionState.phase !== undefined && transitionState.phase !== 'idle') {
      pendingTargetSrc.current = targetSrc;
    }
    else { // otherwise start the transition phase
      pendingTargetSrc.current = null;
      // Begin 'preload' phase
      updateTransitionState({
        targetSrc,
        phase: 'preload'
      });
    }
  }, [playerState.albumart, host, fallbackSrc, transitionState, updateTransitionState]);

  const processPendingOrReset = useCallback(() => {
    if (pendingTargetSrc.current === null || 
      pendingTargetSrc.current === transitionState.targetSrc) {
        updateTransitionState({
          targetSrc: null,
          loadedSrc: null,
          phase: 'idle'
        });
    }
    else {
      updateTransitionState({
        targetSrc: pendingTargetSrc.current,
        loadedSrc: null,
        phase: 'preload'
      });
    }
  }, [transitionState.targetSrc, updateTransitionState]);

  // Handle 'preload' transition phase
  useEffect(() => {
    if (transitionState.phase !== 'preload') {
      return;
    }

    const onImageLoaded = function(src) {
      this.dispose();
      // For webkit browsers where we rely on background-image transition, or 
      // otherwise background is fixed, we skip straight to the 'afterTransition' phase.
      if (!isTransitionable || isWebkit) {
        updateTransitionState({
          lastTargetSrc: transitionState.targetSrc,
          lastLoadedSrc: src,
          phase: 'afterTransition'
        });  
      }
      else { // non-webkit browsers
        // On image preloaded, start the 'beforeTransition' phase
        updateTransitionState({
          loadedSrc: src,
          phase: 'beforeTransition'
        });
      }
    };
    const onImageError = function() {
      this.dispose();
      processPendingOrReset();
    };

    const preloader = preloadImage(transitionState.targetSrc, fallbackSrc, {
      'ready': onImageLoaded,
      'error': onImageError
    });

    return () => { preloader.dispose() };
  }, [isTransitionable, isWebkit, transitionState, updateTransitionState, fallbackSrc, processPendingOrReset]);

  // Handle 'beforeTransition' phase. At this time, the CSS transition would have been 
  // added to the DOM. We can then move on to the actual 'transition' phase.
  useEffect(() => {
    if (transitionState.phase !== 'beforeTransition') {
      return;
    }
    updateTransitionState({
      phase: 'transition'
    });
  }, [transitionState, updateTransitionState]);

  // Called when 'transition' phase completes. Move on to 'afterTransition' phase.
  const onTransitioned = useCallback(() => {
    if (transitionState.phase !== 'transition') {
      return;
    }
    updateTransitionState({
      lastTargetSrc: transitionState.targetSrc,
      lastLoadedSrc: transitionState.loadedSrc,
      phase: 'afterTransition'
    });
  }, [updateTransitionState, transitionState]);

  // Handle 'afterTransition' phase, in which we 
  // process pending albumart, or reset transition state if there is none pending.
  useEffect(() => {
    if (transitionState.phase !== 'afterTransition') {
      return;
    }
   
    // For webkit browsers, the background image is still in transition. 
    // We wait for 1s (CSS transition time) before moving on.
    // For non-webkit browsers, the background image has fully transitioned 
    // (i.e. 'transitioning' image shown), so we proceed immediately.
    if (isWebkit) {
      const transitionTimer = setTimeout(processPendingOrReset, 1000);

      return () => { clearTimeout(transitionTimer); };
    }
    else { // non-webkit browsers
      processPendingOrReset();
    }
  }, [isWebkit, transitionState, updateTransitionState, processPendingOrReset]);

  // Custom styles
  const css = {};
  if (backgroundSettings.backgroundType === 'albumart') { 
    const albumartBackgroundFit = backgroundSettings.albumartBackgroundFit || 'cover'; 
    const backgroundSize = albumartBackgroundFit === 'fill' ? '100% 100%' : albumartBackgroundFit; 
    const backgroundPosition = backgroundSettings.albumartBackgroundPosition || 'center'; 
    const backgroundBlur = backgroundSettings.albumartBackgroundBlur || '0px'; 
    const backgroundScale = backgroundSettings.albumartBackgroundScale || '1'; 
    css['--background-size'] = backgroundSize;
    css['--background-position'] = backgroundPosition;
    css['--background-blur'] = backgroundBlur;
    css['--background-scale'] = backgroundScale;
  }
  else if (backgroundSettings.backgroundType === 'volumioBackground' && backgroundSettings.volumioBackgroundImage !== '') { 
    const volumioBackgroundFit = backgroundSettings.volumioBackgroundFit || 'cover'; 
    const backgroundSize = volumioBackgroundFit === 'fill' ? '100% 100%' : volumioBackgroundFit; 
    const backgroundPosition = backgroundSettings.volumioBackgroundPosition || 'center'; 
    const backgroundBlur = backgroundSettings.volumioBackgroundBlur || '0px'; 
    const backgroundScale = backgroundSettings.volumioBackgroundScale || '1';
    css['--background-image'] = `url("${ host }/backgrounds/${ backgroundSettings.volumioBackgroundImage }")`;
    css['--background-size'] = backgroundSize;
    css['--background-position'] = backgroundPosition;
    css['--background-blur'] = backgroundBlur;
    css['--background-scale'] = backgroundScale;
  }
  else if (backgroundSettings.backgroundType === 'color') {
    css['--background-image'] = 'none';
    css['--background-color'] = backgroundSettings.backgroundColor || '#000';
  }
  
  if (backgroundSettings.backgroundOverlay === 'customColor') { 
    css['--background-overlay-color'] = backgroundSettings.backgroundOverlayColor;
    css['--background-overlay-opacity'] = backgroundSettings.backgroundOverlayColorOpacity;
  }
  else if (backgroundSettings.backgroundOverlay === 'customGradient') { 
    css['--background-overlay-color'] = 'transparent';
    css['--background-overlay-gradient'] = backgroundSettings.backgroundOverlayGradient;
    css['--background-overlay-opacity'] = backgroundSettings.backgroundOverlayGradientOpacity || 1;
  }
  else if (backgroundSettings.backgroundOverlay === 'none') { 
    css['--background-overlay-display'] = 'none';
  }
  if (isTransitionable) {
    css['--default-background-image'] = transitionState.lastLoadedSrc ? `url("${ transitionState.lastLoadedSrc }")` : 'none';
  }

  if (props.enteringScreenId === 'Browse') {
    css['--active-screen-background-filter'] = 'var(--browse-screen-background-filter-entering)';
  }
  else if (props.activeScreenId === 'Browse') {
    css['--active-screen-background-filter'] = 'var(--browse-screen-background-filter)';
  }
  else if (props.enteringScreenId === 'Queue') {
    css['--active-screen-background-filter'] = 'var(--queue-screen-background-filter-entering)';
  }
  else if (props.activeScreenId === 'Queue') {
    css['--active-screen-background-filter'] = 'var(--queue-screen-background-filter)';
  }

  /*if (props.activeScreenId === 'Browse' || props.enteringScreenId === 'Browse') {
    css['--active-screen-background-filter'] = 'var(--browse-screen-background-filter)';
  }
  else if (props.activeScreenId === 'Queue' || props.enteringScreenId === 'Queue') {
    css['--active-screen-background-filter'] = 'var(--queue-screen-background-filter)';
  }*/

  return (
    <div 
      className={classNames(['Background', isWebkit && !disableTransitions ? 'Background--webkit' : null])}
      style={css}>
      { isTransitionable && !isWebkit && (transitionState.phase === 'beforeTransition' || transitionState.phase === 'transition') ? 
      <ContextualCSSTransition
        in={transitionState.phase === 'transition'}
        classNames="bg-fadein"
        timeout={1000}
        onEntered={onTransitioned}>
        <Image 
          src={transitionState.loadedSrc || ''}
          className="Background__transitioning" 
            />
      </ContextualCSSTransition>
      : null }
    </div>
  );
}

export default Background;

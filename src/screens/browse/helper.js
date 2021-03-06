const PLAY_ON_DIRECT_CLICK_TYPES = [
  'song',
  'webradio',
  'mywebradio',
  'cuesong'/*,
  'cd' // What's this? Can see in Volumio UI code but not in the backend...Leaving it out until I know how it's actually used
  */
];

export function isPlayOnDirectClick(itemType) {
  return PLAY_ON_DIRECT_CLICK_TYPES.includes(itemType);
}

export function isHome(location) {
  return location.type === 'browse' && 
      (location.uri === '/' || location.uri === '');
}

export function getServiceByUri(uri, browseSources) {
  if (!uri) {
    return null;
  }

  const matchedSource = browseSources.find(source => uri.startsWith(source.uri));
  if (matchedSource) {
    return {
      name: matchedSource.plugin_name,
      prettyName: matchedSource.plugin_name === 'mpd' ? 'Music Library' : matchedSource.name
    };
  }
  else {
    return null;
  }
}

export function getServiceByName(name, browseSources) {
  if (!name) {
    return null;
  }

  const matchedSource = browseSources.find(source => name === source.plugin_name);
  if (matchedSource) {
    return {
      name: matchedSource.plugin_name,
      prettyName: matchedSource.plugin_name === 'mpd' ? 'Music Library' : matchedSource.name
    };
  }
  else {
    return null;
  }
}

// Based on:
// https://github.com/volumio/Volumio2-UI/blob/master/src/app/browse-music/browse-music.controller.js
export function hasPlayButton(item) {
  if (!item) {
    return false;
  }
  // We avoid that by mistake one clicks on play all NAS or USB, freezing volumio
  if ((item.type === 'folder' && item.uri && item.uri.startsWith('music-library/') && item.uri.split('/').length < 4) ||
    item.disablePlayButton === true) {
    return false;
  }
  const playButtonTypes = [
    'folder',
    'album',
    'artist',
    'song',
    'mywebradio',
    'webradio',
    'playlist',
    'cuesong',
    'remdisk',
    'cuefile',
    'folder-with-favourites',
    'internal-folder'
  ]
  return playButtonTypes.includes(item.type);
}

export function hasMenu(item) {
  let ret = item.type === 'radio-favourites' || item.type === 'radio-category' || item.type === 'spotify-category';
  return !ret;
}

export function canAddToQueue(item) {
  let ret = item.type === 'folder' || item.type === 'song' ||
      item.type === 'mywebradio' || item.type === 'webradio' ||
      item.type === 'playlist' || item.type === 'remdisk' ||
      item.type === 'cuefile' || item.type === 'folder-with-favourites' ||
      item.type === 'internal-folder';
  return ret;
}
export function canAddToPlaylist(item) {
  let ret = item.type === 'folder' || item.type === 'song' ||
  item.type === 'remdisk' || item.type === 'folder-with-favourites' ||
  item.type === 'internal-folder';
  return ret;
}

export function getItemActions(location, item) {
  if (!hasMenu(item)) {
    return null;
  }
  const itemActions = [];
  if (hasPlayButton(item)) {
    itemActions.push({
      icon: 'play_arrow',
      action: 'play'
    });
  }
  if (canAddToQueue(item)) {
    itemActions.push({
      icon: 'add_to_queue',
      action: location.uri === 'playlists' ? 'addPlaylistToQueue' : 'addToQueue',
    });
  }
  if (hasPlayButton(item)) {
    itemActions.push({
      icon: 'playlist_play',
      action: 'clearAndPlay'
    });
  }
  if (canAddToPlaylist(item)) {
    itemActions.push({
      icon: 'playlist_add',
      action: 'addToPlaylist'
    });
  }
  if (location.browseItem && location.browseItem.type === 'playlist') {
    itemActions.push({
      icon: 'playlist_remove',
      action: 'removeFromPlaylist'
    });
  }
  if (item.type === 'playlist') {
    itemActions.push({
      icon: 'delete_outline',
      action: 'deletePlaylist'
    });
  }
  if (item.type === 'remdisk') {
    itemActions.push({
      icon: 'eject',
      action: 'removeDrive'
    });
  }
  if (item.type === 'folder' || item.type === 'internal-folder') {
    itemActions.push({
      icon: 'sync',
      action: 'updateFolder'
    });
  }
  if (item.type === 'internal-folder') {
    itemActions.push({
      icon: 'folder_delete',
      action: 'deleteFolder'
    });
  }

  if ((item.type === 'song' || item.type === 'folder-with-favourites') && location.uri !== 'favourites' && !item.favourite) {
    itemActions.push({
      icon: 'favorite',
      action: 'addToFavorites'
    });
  }
  if (location.uri === 'favourites' || item.favourite) {
    itemActions.push({
      icon: 'favorite_border',
      action: 'removeFromFavorites'
    });
  }
  if (item.type === 'mywebradio-category') {
    itemActions.push({
      icon: 'add',
      action: 'addWebRadio'
    });
  }
  if (item.type === 'mywebradio') {
    itemActions.push({
      icon: 'edit',
      action: 'editWebRadio'
    });
  }
  if (item.type === 'mywebradio' && location.uri === 'radio/myWebRadio') {
    itemActions.push({
      icon: 'delete',
      action: 'deleteWebRadio'
    });
  }
  if (location.uri !== 'radio/favourites' && (item.type === 'webradio' || item.type === 'mywebradio')) {
    itemActions.push({
      icon: 'favorite',
      action: 'addWebRadioToFavorites'
    });
  }
  if (location.uri === 'radio/favourites' && (item.type === 'webradio' || item.type === 'mywebradio')) {
    itemActions.push({
      icon: 'favorite_border',
      action: 'removeWebRadioFromFavorites'
    });
  }
  if (item.type === 'song') {
    itemActions.push({
      icon: 'info',
      action: 'viewInfo'
    });
  }
  return itemActions;
}

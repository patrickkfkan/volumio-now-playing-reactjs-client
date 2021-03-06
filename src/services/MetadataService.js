import { EventEmitter } from "eventemitter3";
import { requestPluginApiEndpoint } from "../utils/api";

export default class MetadataService {
  constructor() {
    this.apiPath = null;
    this.emitter = new EventEmitter();
  }

  setApiPath(apiPath) {
    this.apiPath = apiPath;
  }

  isReady() {
    return this.apiPath !== null;
  }

  /**
   * params {
   *  name: ...
   *  artist: ...
   *  album: ...
   * }
   */
  async getSongInfo(params) {
    if (!this.apiPath) {
      return;
    }
    const payload = {...params, type: 'song'};
    const data = await requestPluginApiEndpoint(this.apiPath, '/metadata/fetchInfo', payload);
    if (data.success) {
      this._pushFetched({
        song: params.name,
        album: params.album,
        artist: params.artist
      }, data.data);
    }
    else {
      this._pushError(data.error);
    }
  }

  /**
   * params {
   *  album: ...
   *  artist: ...
   * }
   */
  async getAlbumInfo(params) {
    if (!this.apiPath) {
      return;
    }
    const payload = {...params, type: 'album'};
    const data = await requestPluginApiEndpoint(this.apiPath, '/metadata/fetchInfo', payload);
    if (data.success) {
      this._pushFetched({
        album: params.name,
        artist: params.artist
      }, data.data);
    }
    else {
      this._pushError(data.error);
    }
  }

  /**
   * params {
   *  artist: ...
   * }
   */
  async getArtistInfo(params) {
    if (!this.apiPath) {
      return;
    }
    const payload = {...params, type: 'artist'};
    const data = await requestPluginApiEndpoint(this.apiPath, '/metadata/fetchInfo', payload);
    if (data.success) {
      this._pushFetched({
        artist: params.name
      }, data.data);
    }
    else {
      this._pushError(data.error);
    }
  }

  // Event:
  // fetched
  on(event, handler) {
    this.emitter.on(event, handler);
  }

  off(event, handler) {
    this.emitter.off(event, handler);
  }

  _pushFetched(params, data) {
    this.emitter.emit('fetched', {
      params,
      info: data
    });
  }

  _pushError(message) {
    this.currentLoading = null;
    this.emitter.emit('error', message)
  }
}

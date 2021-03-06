import { EventEmitter } from "eventemitter3";

const PLAY_ENTIRE_LIST_TYPES = [
  'song'
];

export default class QueueService {
  constructor() {
    this.socket = null;
    this.emitter = new EventEmitter();
    this.initState();
    this.initSocketEventHandlers();
  }

  initState() {
    this._setQueue([]);
  }

  initSocketEventHandlers() {
    this.socketEventHandlers = {
      'connect': this._handleSocketConnnect.bind(this),
      'reconnect': this._handleSocketConnnect.bind(this),
      'pushQueue': this._setQueue.bind(this)
    };
  }

  setSocket(socket) {
    const oldSocket = this.socket;
    if (oldSocket === socket) {
      return;
    }
    if (oldSocket) {
      for (const[event, handler] of Object.entries(this.socketEventHandlers)) {
        oldSocket.off(event, handler);
      }
    }
    this.socket = socket;
    if (this.socket) {
      for (const[event, handler] of Object.entries(this.socketEventHandlers)) {
        this.socket.on(event, handler);
      }

      // Reset
      this.initState();

      if (this.socket.connected) {
        // Request queue
        this.socket.emit('getQueue');
      }
    }
  }

  _handleSocketConnnect() {
    this.socket.emit('getQueue');
  }

  // Event:
  // queueChanged
  on(event, handler) {
    this.emitter.on(event, handler);
  }

  off(event, handler) {
    this.emitter.off(event, handler);
  }

  _setQueue(data) {
    if (this.queue !== data) {
      this.queue = data;
      if (this.emitter) {
        this.emitter.emit('queueChanged', this.queue);
      }
    }
  }

  getQueue() {
    return this.queue;
  }

  play(item, list, itemIndex) {
    if (!this.socket) {
      return;
    }
    if (item.type === 'cuesong') {
      this.socket.emit('addPlayCue', {
        uri: item.uri,
        number: item.number,
        service: (item.service || null)
      });
    }
    else if (item.type === 'playlist') {
      this.socket.emit('playPlaylist', {
        name: item.title
      });
    }
    else {
      if (PLAY_ENTIRE_LIST_TYPES.includes(item.type) && list && itemIndex !== undefined) {
        this.socket.emit('playItemsList', {
          item,
          list: list.items,
          index: itemIndex
        });
      }
      else {
        this.socket.emit('playItemsList', { item });
      }
    }
  }

  playQueue(position = 0) {
    if (!this.socket) {
      return;
    }
    this.socket.emit('play', { value: position });
  }

  addToQueue(item, isPlaylist = false) {
    if (!this.socket) {
      return;
    }
    if (!isPlaylist) {
      this.socket.emit('addToQueue', {
        uri: item.uri,
        title: item.title,
        albumart: (item.albumart || null),
        service: (item.service || null)
      });
    }
    else {
      this.socket.emit('enqueue', {name: item.title});
    }
  }

  removeFromQueue(position) {
    if (!this.socket) {
      return;
    }
    this.socket.emit('removeFromQueue', { value: position });
  }

  clearQueue() {
    if (!this.socket) {
      return;
    }
    this.socket.emit('clearQueue');
  }

  clearAndPlay(item) {
    this.socket.emit('replaceAndPlay', {
      uri: item.uri,
      title: item.title,
      albumart: (item.albumart || null),
      service: (item.service || null)
    });
  }
}

window.Tunes = Ember.Application.create();

Tunes.Router.map(function() {
  this.route('library');        // this is our default route
});

Tunes.ApplicationRoute = Ember.Route.extend({
  events: {
    queueAlbum: function(album) {
      this.controllerFor('playlist').addObject(album);
    },

    dequeueAlbum: function(album) {
      this.controllerFor('playlist').removeObject(album);
    }
  }
});

Tunes.IndexRoute = Ember.Route.extend({
  redirect: function() {
    this.transitionTo('library');
  }
});

Tunes.LibraryRoute = Ember.Route.extend({
  model: function() {
    var content = [];

    $.ajax({
      url: '/albums.json',
      success: function(albums) {
        var albums = albums.map(function(album){
          var tracks = album.tracks.map(function(track){
            return $.extend(track, {album: album});
          });
          return $.extend(album, {tracks: tracks});
        });

        content.pushObjects(albums);
      }
    });

    return content;
  }
});

Tunes.PlaylistView = Em.View.extend({
  classNames: ['playlist']
});

Tunes.LibraryView = Em.View.extend({
  tagName: 'section',

  classNames: ['library']
});

Tunes.PlayerView = Em.View.extend({
  tagName: 'nav'
});

Tunes.PlayerController = Em.Controller.extend({
  needs: ['playlist'],

  currentTrack: Em.computed.alias('controllers.playlist.currentTrack'),

  isPlaying: false,

  init: function(){
    this._super();

    var audio = new Audio();

    audio.addEventListener('ended', function() {
      this.get('target').send('next');
    }.bind(this));

    this.set('audio', audio);
  },

  play: function() {
    if (!this.get('currentTrack')) {
      return;
    }

    this.get('audio').play();
    this.set('isPlaying', true);
  },

  pause: function() {
    this.get('audio').pause();
    this.set('isPlaying', false);
  },

  currentTrackChanged: function() {
    var new_src = this.get('currentTrack.url');

    this.get('audio').src = new_src;

    if (!new_src) {
      this.pause();
    }

    if (this.get('isPlaying')) {
      this.play();
    }
  }.observes('currentTrack')
});

Tunes.PlaylistController = Em.ArrayController.extend({
  currentTrack: null,

  prev: function() {
    this.set('currentTrack', this.get('prevTrack'));
  },

  next: function() {
    this.set('currentTrack', this.get('nextTrack'));
  },

  prevTrack: function() {
    var tracks = this.get('tracks');
    var currentIndex = tracks.indexOf(this.get('currentTrack'));
    var prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1;

    return tracks.objectAt(prevIndex);
  }.property('tracks', 'currentTrack'),

  nextTrack: function() {
    var tracks = this.get('tracks');
    var currentIndex = tracks.indexOf(this.get('currentTrack'));
    var nextIndex = currentIndex === (tracks.length - 1) ? 0 : currentIndex + 1;

    return tracks.objectAt(nextIndex);
  }.property('tracks', 'currentTrack'),

  currentAlbum: function() {
    return this.get('currentTrack.album');
  }.property('currentTrack'),

  addObject: function(album) {
    this.get('content').addObject(album);

    if (this.get('content').length === 1) {
      this.set('currentTrack', this.get('tracks.firstObject'));
    }
  },

  removeObject: function(album) {
    var currentTrack = this.get('currentTrack');
    var containsCurrentTrack = album.tracks.contains(currentTrack);
    this.get('content').removeObject(album);

    if (this.get('content').length === 0) {
      this.set('currentTrack', null);
    } else if (containsCurrentTrack) {
      this.set('currentTrack', this.get('tracks.firstObject'));
    }
  },

  tracks: function() {
    return this.reduce(function(res, album) {
      return res.concat(album.tracks);
    }, []);
  }.property('content.@each')
});

Tunes.PlaylistAlbumController = Em.ObjectController.extend({
  needs: ['playlist'],

  currentAlbum: Em.computed.alias('controllers.playlist.currentAlbum'),

  current: function() {
    return this.get('content') === this.get('currentAlbum');
  }.property('content', 'currentAlbum')
});

Tunes.PlaylistTrackController = Em.ObjectController.extend({
  needs: ['playlist'],

  currentTrack: Em.computed.alias('controllers.playlist.currentTrack'),

  current: function() {
    return this.get('content') === this.get('currentTrack');
  }.property('content', 'currentTrack')
});
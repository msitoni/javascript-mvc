// PubSub
(function() {
    "use strict";
    var subscribers = [],
        elCache = {},
        Model = {
            playlist: [],
            currentIndex: 0,
            reLoad: function() {
                var tracks = Array.prototype.slice.call(elCache.get("playListSelector").options);
                this.playlist = [];
                tracks.forEach(function(e, i) { this.playlist.push(tracks[i].value); }, Model);
                this.currentIndex = 0;
            },
            next: function() {
                if (this.currentIndex < (this.playlist.length - 1)) {
                    this.currentIndex++;
                }
                subscribers.publish(this);
            },
            prev: function() {
                if (this.currentIndex > 0) {
                    this.currentIndex--;
                }
                subscribers.publish(this);
            },
            current: function() {
                subscribers.publish(this);
            }
        },
        // MVC
        View = {
            notify: function(model) {
                elCache.get("output").innerHTML = JSON.stringify(model);
                elCache.get("playListSelector").selectedIndex = model.currentIndex;
            }
        },
        Controller = {
            moveNext: function() {
                Model.next();
                return this;
            },
            movePrev: function() {
                Model.prev();
                return this;
            },
            getCurrent: function() {
                Model.current();
                return this;
            }
        };

    function start() {
        elCache.get = function(elId) {
            return this[elId] || (this[elId] = document.getElementById(elId));
        };

        subscribers.publish = function(event) {
            this.forEach(function(e) { e.notify(event); });
        };

        subscribers.push(View); // Subscribe for updates

        elCache.get("btnCurrent").addEventListener("click", Controller.getCurrent.bind(Model));
        elCache.get("btnNext").addEventListener("click", Controller.moveNext.bind(Model));
        elCache.get("btnPrev").addEventListener("click", Controller.movePrev.bind(Model));
        Model.reLoad.bind(Model)();
    }

    window.addEventListener("load", start, false);
})();
jQuery(function($){
    var App = {
        init: function(){
            this.bindEvents();
        },
        bindEvents: function(){
            $("div.delete-word").on("click", this.deleteCard.bind(this));
            $("a.remove-set").on("click", this.deleteSet.bind(this));
        },
        getParameterByName: function(name, url) {
            if (!url) url = window.location.href;
            name = name.replace(/[\[\]]/g, "\\$&");
            var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        },
        deleteCard: function(element){
            if($("div.centerpiece").children("div.word-outer").length > 5){
              var filename = this.getParameterByName("set");
              var cardindex = $(element.target).parent().index();
              $.post('/deleteCard', {file: filename, cardindex: JSON.stringify(cardindex)}, success => {
                  $(element.target).parent().remove();
              });
            } else {
              alert("You need at least 5 cards per set!");
            }
        },
        deleteSet: function(element){
          if (confirm("Are you sure you want to delete this set?")) {
            var filename = this.getParameterByName("set");
            $.post('/deleteset',{file: filename}, success => {
              document.location.href = 'http://localhost:3000/sets';
            });
            return;
          }
        }
    };
    App.init();
})
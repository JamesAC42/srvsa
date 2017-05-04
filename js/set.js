jQuery(function($) {
    const TAB_KEY = 9;
    const RIGHT_KEY = 39;
    const LEFT_KEY = 37;
    const ENTER_KEY = 13;

    const CARD = "<div class='card added'><input type='text' tabindex='-1' maxlength='30'></div>";
    
    var App = {
        init: function() {
            this.cards = [];
            this.focus = 1;
            this.cardamt = 1;
            this.filename = this.getParameterByName("set");
            this.optionsVisible = false;
            this.addWordsVisible = false;
            this.bindEvents();
            this.render();
        },
        focusIsLast: function() {
            return this.focus == this.cardamt;
        },
        bindEvents: function() {
            $("div.delete-word").on("click", this.deleteCard.bind(this));
            $("a.remove-set").on("click", this.deleteSet.bind(this));
            $("a.study-set").on("click", this.gotoStudy.bind(this));
            $("div.new-def-button").on("click", this.openDefOptions.bind(this));
            $("div.close-modal").on("click", this.closeDefOptions.bind(this));
            $("div.screen-blur").on("click", this.closeDefOptions.bind(this));
            $("div.def-defs-outer").on("click", "div.def-def-inner", this.selectNewDef.bind(this));
            $("div.submit").on("click", this.submitCustomDef.bind(this));
            $("textarea").on("keydown", this.render.bind(this));
            $("div.add-words-button").on("click", this.toggleAddWords.bind(this));
            $("div.close-new-word").on("click", this.toggleAddWords.bind(this));
            $('#next').on('click', this.nextCard.bind(this));
            $('#back').on('click', this.prevCard.bind(this));
            $('#add').on('click', this.addCard.bind(this));
            $('#remove').on('click', this.removeCard.bind(this));
            $('#create').on('click', this.submitSet.bind(this));
            $('#ff-next').on('click', this.gotoLast.bind(this));
            $('#ff-back').on('click', this.gotoFirst.bind(this));
            $('#cards-form')
                .on('keydown', 'input', this.cardLog.bind(this))
                .on('keyup', 'input', this.wordLog.bind(this));
            $('body').on('keydown', this.cardMove.bind(this));
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
        // remove the actual submitted card and definition
        deleteCard: function(element) {
            if ($("div.centerpiece").children("div.word-outer").length > 5) {
              var filename = this.filename;
              var cardindex = $(element.target).parent().index();
              $.post('/deleteCard', {file: filename, cardindex: JSON.stringify(cardindex)}, success => {
                  $(element.target).parent().remove();
              });
            } else {
              alert("You need at least 5 cards per set!");
            }
        },
        gotoStudy: function() {
          let filename = this.filename;
          document.location.href = "http://localhost:3000/study?set=" + filename;
          return;
        },
        openDefOptions: function(element) {
          if (!this.optionsVisible) {
            this.optionsVisible = true;
            let word = $(element.target).parent().parent().parent().children("div.word").text();
            $("div.def-title span").text(word);
            $("div.centerpiece").addClass("center-noscroll");
            $("div.new-def-button").removeClass("def-btn-enabled");
            $("div.add-definitions-modal").addClass("def-modal-visible");
            $("div.screen-blur").addClass("blur-enabled");
            let $wordDefInner = $(element.target).parent();
            if ($wordDefInner.children("div.alt-defs").length) {
              $wordDefInner.children("div.alt-defs").children("ul").children("li").each(function(item) {
                $("div.def-defs-outer").append("<div class='def-def-inner'><span class='def-choice'>" + $(this).text() + "</span></div>");
              });
            } else {
              $("div.def-defs-outer").append("<div class='def-def-inner'><span class='def-choice'>Word has no alternate definitions.</span></div>");
            }
          } else {
            return;
          }
        },
        closeDefOptions: function(element) {
          if (this.optionsVisible) {
            this.optionsVisible = false;
            $("div.centerpiece").removeClass("center-noscroll");
            $("div.new-def-button").addClass("def-btn-enabled")
            $("div.add-definitions-modal").removeClass("def-modal-visible");
            $("div.screen-blur").removeClass("blur-enabled");
            $("div.def-def-inner").remove();
          } else {
            return;
          }
        },
        deleteSet: function(element) {
          if (confirm("Are you sure you want to delete this set?")) {
            var filename = this.getParameterByName("set");
            $.post('/deleteset',{file: filename}, success => {
              document.location.href = 'http://localhost:3000/sets';
            });
            return;
          }
        },
        selectNewDef: function(element) {
          let definition;
          var filename = this.filename;
          if ($(element.target).prop("tagName") === "SPAN") {
            definition = $(element.target).text();
          } else {
            definition = $(element.target).children("span").text();
          }
          let word = $("div.def-title span").text();
          $.post("/changeDef", {file: filename, definition, word}, success => {
            $("div.word").each(function(index) {
              if ($(this).text() == word) {
                $(this).siblings("div.word-definition").children("div.word-definition-inner")
                  .children("div.main-definition").children("span").text(definition); 
              }
            });
            this.closeDefOptions();
          })
        },
        submitCustomDef: function() {
          let definition = $("div.custom-def-outer textarea").val().trim();
          var filename = this.filename;
          if (definition !== '') {
            let word = $("div.def-title span").text();
            $.post("/changeDef", {file: filename, definition, word}, success => {
              $("div.word").each(function(index) {
                if ($(this).text() == word) {
                  $(this).siblings("div.word-definition").children("div.word-definition-inner")
                    .children("div.main-definition").children("span").text(definition); 
                }
              });
              $("textarea").val('');
              this.closeDefOptions();
            });
          } else {
            return;
          }
        },
        toggleAddWords: function() {
          if (this.addWordsVisible) {
            this.addWordsVisible = false;
            $("div.new-word-container").removeClass("new-word-container-visible");
          } else {
            this.addWordsVisible = true;
            $("div.new-word-container").addClass("new-word-container-visible");
          }
        },
        disable: function(el) {
            $(el).addClass('disabled');
        },
        enable: function(el) {
            $(el).removeClass('disabled');
        },
        addCard: function(e) {
            var focus = this.focus;
            var cards = this.cards;
            $('div.card:nth-child(' + focus + ')')
                .addClass('left-card')
                .after(CARD);
            cards.splice(focus, 0, '');
            this.cardamt++;
            focus++;
            this.cards = cards;
            this.focus = focus;
            this.render();
        },
        //remove the card from the addcard window
        removeCard: function() {
            var focus = this.focus;
            var cards = this.cards;
            if (!(this.cardamt > 1)) {
                return;
            } else {
                $('div.card:nth-child(' + focus + ')').remove();
                cards.splice((focus - 1), 1);
                if (this.focusIsLast()) {
                    focus--;
                    $('div.card:nth-child(' + focus + ')').removeClass('left-card');
                } else {
                    $('div.card:nth-child(' + focus + ')').removeClass('right-card');
                }
                this.cards = cards;
                this.focus = focus;
                this.cardamt--;
                this.render();
            }
        },
        nextCard: function() {
            var focus = this.focus;
            if (!this.focusIsLast()) {
                $('div.card:nth-child(' + focus + ')').blur().addClass('left-card');
                focus++;
                $('div.card:nth-child(' + focus + ')').removeClass('right-card');
                this.focus = focus;
                this.render();
            }
        },
        prevCard: function() {
            var focus = this.focus;
            if (!(focus == 1)) {
                $('div.card:nth-child(' + focus + ')').addClass('right-card');
                focus--;
                $('div.card:nth-child(' + focus + ')').removeClass('left-card');
                this.focus = focus;
                this.render();
            }
        },
        gotoFirst: function() {
            while(this.focus !== 1) {
                this.prevCard();
            }
        },
        gotoLast: function() {
            while(!this.focusIsLast()) {
                this.nextCard();
            }
        },
        cardLog: function(e) {
            if (e.which == TAB_KEY) {
                e.preventDefault();
                if (e.shiftKey) {
                    this.prevCard();
                } else {
                    if (this.focusIsLast()) {
                        this.addCard();
                    } else {
                        $('div.card:nth-child(' + this.focus + ')').blur();
                        this.nextCard();
                        return false;
                    }
                }
                $('div.card:nth-child(' + this.focus + ') input').focus();
            }else if (e.which == ENTER_KEY) {
                e.preventDefault();
                this.addCard();
                $('div.card:nth-child(' + this.focus + ') input').focus();
            } else {
                return;
            }
        },
        wordLog: function(e) {
            var cards = this.cards;
            var focus = this.focus;
            if (e.which == TAB_KEY || e.which == ENTER_KEY) {
                return;
            } else {
                var word = $(e.target).val().trim();
                cards[focus-1] = word;
                this.cards = cards;
                this.render();
            }
        },
        cardMove: function(e) {
            var focus = this.focus;
            if (!$('div.card input').is(':focus') && !$('div.title-container input').is(':focus') && $("textarea").is("focus")) {
                if (e.which !== ENTER_KEY && e.which !== RIGHT_KEY && e.which !== LEFT_KEY) {
                    return false;
                } else {
                    if (e.which == ENTER_KEY) {
                        if (e.shiftKey) {
                            this.removeCard();
                        } else {
                            this.addCard();
                        }
                    }else if (e.which == RIGHT_KEY) {
                        this.nextCard();
                    }else if (e.which = LEFT_KEY) {
                        this.prevCard();
                    } else {
                        return false;
                    }
                }
            } else {
                return;
            }
        },
        canSubmit: function() {
            var validamt = 0;
            $('div.card').each(function() {
                var val = $(this).children('input').val().trim();
                if (val !== '') {
                    validamt++;
                }
            });
            var submitbool = (validamt >= 1);
            return submitbool;
        },
        loadCards: function(defList){
          defList.forEach(function(item, index){
            let cardString = "<div class='word-outer'>" +
              "<div class='word'>" + item["sanitizedw"] + 
              "</div><div class='word-definition'>";
            if(item["hasDefinitions"]){
              cardString += "<div class='word-definition-inner'>";
              if(item["definitions"].length > 0){
                cardString += "<div class='alt-defs'><ul>";
                item["definitions"].forEach(function(item, index){                  
                  cardString += "<li>" + item + "</li>";
                });
                cardString += "</ul></div>";
              };
              cardString += "<div class='main-definition'>" + 
                "<span>" + item["mainDefinition"] + "</span></div>" + 
                "<div class='new-def-button' title='New Definition'>&#x270E;</div>" + 
                "</div>";
            }else{
              cardString += "<div class='no-definition'>This word has no definitions!</div>"
            }
            cardString += "</div><div class='delete-word'>&#x2716;</div></div>";
            $(cardString).insertAfter($("div.word-outer:last"));
          });
          $("div.delete-word").on("click", this.deleteCard.bind(this));
          $("div.new-def-button").on("click", this.openDefOptions.bind(this));
        },
        clearNewCards: function(){
          while (this.cardamt > 1) {
            this.removeCard();
          }
          this.cards = [];
          $("div.card input").val(" ");
          this.render();
        },
        submitSet: function() {
            if (this.canSubmit()) {
                $.post("/addNewCards", {filename: this.filename, words: JSON.stringify(this.cards)}, success => {
                  if (this.addWordsVisible) {
                    this.toggleAddWords();
                  }
                  this.loadCards(JSON.parse(success));
                  this.clearNewCards();
                });
            }
        },
        render: function() {
          if ($("textarea").val().trim() === '') {
            $("div.submit").addClass("disabled");
          } else {
            $("div.submit").removeClass("disabled");
          }
          var progress = Math.round((this.focus / this.cardamt) * 100);
          $('.progress-bar-inner').css('width', progress + '%');
          if (progress == 100) {
              $('.progress-bar-inner').addClass('progress-bar-complete');
          } else {
              $('.progress-bar-inner').removeClass('progress-bar-complete');
          }
          if (this.focusIsLast()) {
              this.disable($('#next'));
              if (this.focus == 1) {
                  this.disable($('#back'));
              } else {
                  this.enable($('#back'));
              }
          } else {
              this.enable($('#next'));
              if (this.focus == 1) {
                  this.disable($('#back'));
              } else {
                  this.enable($('#back'));
              }
          }
          if (this.cardamt == 1) {
              this.disable($('#remove'));
          } else {
              this.enable($('#remove'));
          }
          $('#card-amt').text(this.focus + ' / ' + this.cardamt);
          if (this.canSubmit()) {
              this.enable($('#create'));
          } else {
              this.disable($('#create'));
          }
        }
    };
    App.init();
});
jQuery(function($){

    var TAB_KEY = 9;
    var RIGHT_KEY = 39;
    var LEFT_KEY = 37;
    var ENTER_KEY = 13;

    var CARD = "<div class='card added'><input type='text' tabindex='-1' maxlength='30'></div>";
    
    var util = {
        store: function (namespace, data) {
            if (arguments.length > 1) {
                return localStorage.setItem(namespace, JSON.stringify(data));
            } else {
                var store = localStorage.getItem(namespace);
                return (store && JSON.parse(store)) || [''];
            }
        }
    }
    
    var App = {
        init: function(){
            this.cards = util.store('application-cards');
            this.cardamt = 1;
            this.focus = 1;
            this.title = '';
            this.bindEvents();
            this.render();
        },
        focusIsLast:function(){
            return this.focus == this.cardamt;
        },
        bindEvents: function(){
            $('#next').on('click', this.nextCard.bind(this));
            $('#back').on('click', this.prevCard.bind(this));
            $('#add').on('click', this.addCard.bind(this));
            $('#remove').on('click', this.removeCard.bind(this));
            $('#create').on('click', this.submitSet.bind(this));
            $('#ff-next').on('click', this.gotoLast.bind(this));
            $('#ff-back').on('click', this.gotoFirst.bind(this));
            $('#hide-error').on('click', this.hideModal.bind(this));
            $('form')
                .on('keydown', 'input', this.cardLog.bind(this))
                .on('keyup', 'input', this.wordLog.bind(this));
            $('div.title-container input').on('keydown', this.setTitle.bind(this));
            $('body').on('keydown', this.cardMove.bind(this));
        },
        disable: function(el){
            $(el).addClass('disabled');
        },
        enable: function(el){
            $(el).removeClass('disabled');
        },
        addCard: function(e){
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
        removeCard: function(){
            var focus = this.focus;
            var cards = this.cards;
            if(!(this.cardamt > 1)){
                return;
            } else {
                $('div.card:nth-child(' + focus + ')').remove();
                cards.splice((focus - 1), 1);
                if(this.focusIsLast()){
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
        nextCard: function(){
            var focus = this.focus;
            if(!this.focusIsLast()){
                $('div.card:nth-child(' + focus + ')').blur().addClass('left-card');
                focus++;
                $('div.card:nth-child(' + focus + ')').removeClass('right-card');
                this.focus = focus;
                this.render();
            }
        },
        prevCard: function(){
            var focus = this.focus;
            if(!(focus == 1)){
                $('div.card:nth-child(' + focus + ')').addClass('right-card');
                focus--;
                $('div.card:nth-child(' + focus + ')').removeClass('left-card');
                this.focus = focus;
                this.render();
            }
        },
        gotoFirst: function(){
            while(this.focus !== 1){
                this.prevCard();
            }
        },
        gotoLast: function(){
            while(!this.focusIsLast()){
                this.nextCard();
            }
        },
        cardLog: function(e){
            if(e.which == TAB_KEY){
                e.preventDefault();
                if(e.shiftKey){
                    this.prevCard();
                } else {
                    if(this.focusIsLast()){
                        this.addCard();
                    } else {
                        $('div.card:nth-child(' + this.focus + ')').blur();
                        this.nextCard();
                        return false;
                    }
                }
                $('div.card:nth-child(' + this.focus + ') input').focus();
            }else if(e.which == ENTER_KEY){
                e.preventDefault();
                this.addCard();
                $('div.card:nth-child(' + this.focus + ') input').focus();
            } else {
                return;
            }
        },
        wordLog: function(e){
            var cards = this.cards;
            var focus = this.focus;
            if(e.which == TAB_KEY || e.which == ENTER_KEY){
                return;
            } else {
                var word = $(e.target).val().trim();
                cards[focus-1] = word;
                this.cards = cards;
                this.render();
            }
        },
        cardMove: function(e){
            var focus = this.focus;
            if(!$('div.card input').is(':focus') && !$('div.title-container input').is(':focus')){
                if(e.which !== ENTER_KEY && e.which !== RIGHT_KEY && e.which !== LEFT_KEY){
                    return false;
                } else {
                    if(e.which == ENTER_KEY){
                        if(e.shiftKey){
                            this.removeCard();
                        } else {
                            this.addCard();
                        }
                    }else if(e.which == RIGHT_KEY){
                        this.nextCard();
                    }else if(e.which = LEFT_KEY){
                        this.prevCard();
                    } else {
                        return false;
                    }
                }

            } else {
                return;
            }
        },
        setTitle: function(e){
            if(e.which == TAB_KEY){
                e.preventDefault();
                $('div.title-container input').blur();
                $('div.card:nth-child(' + this.focus + ') input').focus();
            }else{
                this.title = $('div.title-container input').val().trim();
                this.render();
                return;
            }
        },
        canSubmit: function(){
            var validamt = 0;
            $('div.card').each(function(){
                var val = $(this).children('input').val().trim();
                if(val !== ''){
                    validamt++;
                }
            });
            var submitbool = (validamt >= 5) && (this.title !== '');
            return(submitbool);
        },
        hideModal: function(){
            $('div.error').removeClass('modal-visible');
        },
        submitSet: function(){
            this.title = $('div.title-container input').val().trim();
            if(this.canSubmit()){
                $.post("/", {title: JSON.stringify(this.title), words: JSON.stringify(this.cards)}, data=>document.location.href = data);
            } else {
                if (!this.title == ''){
                    $('div.message').text("You need at least 5 valid cards to create a set.")
                } else {
                    $('div.message').text("You need a title to create a set.");
                }
                $('div.error').addClass('modal-visible');
            }
        },
        render: function(){
            var progress = Math.round((this.focus / this.cardamt) * 100);
            $('.progress-bar-inner').css('width', progress + '%');
            if(progress == 100){
                $('.progress-bar-inner').addClass('progress-bar-complete');
            } else {
                $('.progress-bar-inner').removeClass('progress-bar-complete');
            }
            if(this.focusIsLast()){
                this.disable($('#next'));
                if(this.focus == 1){
                    this.disable($('#back'));
                } else {
                    this.enable($('#back'));
                }
            } else {
                this.enable($('#next'));
                if(this.focus == 1){
                    this.disable($('#back'));
                } else {
                    this.enable($('#back'));
                }
            }
            if(this.cardamt == 1){
                this.disable($('#remove'));
            } else {
                this.enable($('#remove'));
            }
            $('#card-amt').text(this.focus + ' / ' + this.cardamt);
            if(this.canSubmit()){
                this.enable($('#create'));
            } else {
                this.disable($('#create'));
            }
        }
    }   
    App.init();
})
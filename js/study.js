jQuery(function($){

    const TAB_KEY = 9;
    const RIGHT_KEY = 39;
    const LEFT_KEY = 37;
    const ENTER_KEY = 13;
    const SPACE_KEY = 32;
    const DOWN_KEY = 40;

    var App = {
    	init: function(){
	    	this.cardamt = parseInt($("#card-amt").text());
	        this.focus = 1;
	        this.bindEvents();
	        this.render();
    	},
        focusIsLast:function(){
            return this.focus == this.cardamt;
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
    	bindEvents: function(){
    		$('#next').on('click', this.nextCard.bind(this));
            $('#back').on('click', this.prevCard.bind(this));
            $('#ff-next').on('click', this.gotoLast.bind(this));
            $('#ff-back').on('click', this.gotoFirst.bind(this));
            $("#flip").on('click', this.flipCard.bind(this));
            $("div.card").on('click', this.flipCard.bind(this));
            $("#edit-button").on('click', this.gotoEdit.bind(this));
            $('body').on('keydown', this.cardMove.bind(this));
    	},
    	disable: function(el){
            $(el).addClass('disabled');
        },
        enable: function(el){
            $(el).removeClass('disabled');
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
        flipCard: function(){
        	let $cardinner = $('div.card:nth-child(' + this.focus + ')').children('div.card-inner');
        	let $definition = $cardinner.children('div.definition');
        	let $word = $cardinner.children('div.word');
        	if ($definition.hasClass("visible")){
        		$cardinner.parent().removeClass("flip");
        		setTimeout(function(){
        			$definition.removeClass("visible");
        			$word.removeClass("invisible");
        		},150);
        	} else {
        		$cardinner.parent().addClass("flip");
        		setTimeout(function(){
	        		$definition.addClass("visible");
	        		$word.addClass("invisible");
        		},150);
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
        cardMove: function(e){
            var focus = this.focus;
            if(e.which !== SPACE_KEY && e.which !== RIGHT_KEY && e.which !== LEFT_KEY && e.which !== DOWN_KEY){
                    return false;
            } else {
                if(e.which == SPACE_KEY || e.which == DOWN_KEY){
                    this.flipCard();
                }else if(e.which == RIGHT_KEY){
                    this.nextCard();
                }else if(e.which = LEFT_KEY){
                    this.prevCard();
                } else {
                    return false;
                }
            }
        },
        gotoEdit: function(){
        	let filename = this.getParameterByName("set");
        	document.location.href = "http://173.49.165.252:3456/edit?set=" + filename;
        	return;
        },
        render: function(){
        	var progress = Math.round((this.focus / this.cardamt) * 100);
            $('div.card:nth-child(' + this.focus + ')').removeClass('right-card left-card');
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
            $('#card-amt').text(this.focus + ' / ' + this.cardamt);
        }
    };
    
    App.init();
}); 
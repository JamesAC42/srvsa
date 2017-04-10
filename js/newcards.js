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
			this.cards = 1;
			this.focus = 1;
			this.bindEvents();
			this.render();
		},
		focusIsLast:function(){
			return this.focus == this.cards;
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
			$('form').on('keydown', 'input', this.cardLog.bind(this));
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
			$('div.card:nth-child(' + focus + ')')
				.addClass('left-card')
				.after(CARD);
			this.cards++;
			focus++;
			this.focus = focus;
			this.render();
		},
		removeCard: function(){
			var focus = this.focus;
			if(!(this.cards > 1)){
				return;
			}else{
				$('div.card:nth-child(' + focus + ')').remove();
				if(this.focusIsLast()){
					focus--;
					$('div.card:nth-child(' + focus + ')').removeClass('left-card');
				}else{
					$('div.card:nth-child(' + focus + ')').removeClass('right-card');
				}
				this.focus = focus;
				this.cards--;
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
				}else{
					if(this.focusIsLast()){
						this.addCard();
					}else{
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
			}else{
				this.render();
				return;
			}
		},
		cardMove: function(e){
			var focus = this.focus;
			if(!$('div.card input').is(':focus')){
				if(e.which !== ENTER_KEY && e.which !== RIGHT_KEY && e.which !== LEFT_KEY){
					return false;
				}else{
					if(e.which == ENTER_KEY){
						if(e.shiftKey){
							this.removeCard();
						}else{
							this.addCard();
						}
					}else if(e.which == RIGHT_KEY){
						this.nextCard();
					}else if(e.which = LEFT_KEY){
						this.prevCard();
					}else{
						return;
					}
				}
			}else{
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
			return(validamt >= 5);
		},
		hideModal: function(){
			$('div.error').removeClass('modal-visible');
		},
		submitSet: function(){
			if(this.canSubmit()){

			}else{
				$('div.error').addClass('modal-visible');
			}
		},
		render: function(){
			if(this.focusIsLast()){
				this.disable($('#next'));
				if(this.focus == 1){
					this.disable($('#back'));
				}else{
					this.enable($('#back'));
				}
			}else{
				this.enable($('#next'));
				if(this.focus == 1){
					this.disable($('#back'));
				}else{
					this.enable($('#back'));
				}
			}
			if(this.cards == 1){
				this.disable($('#remove'));
			}else{
				this.enable($('#remove'));
			}
			$('#card-amt').text(this.focus + ' / ' + this.cards);
			if(this.canSubmit()){
				this.enable($('#create'));
			}else{
				this.disable($('#create'));
			}
		}
	}	
	App.init();
})
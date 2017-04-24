jQuery(function($){
	var App = {
		init: function() {
			this.bindEvents();
		},
		bindEvents: function() {
			$("a.delete").click(this.deleteSet.bind(this));
		},
		deleteSet: function(element){
			if (confirm("Are you sure you want to delete this set?")) {
				let link = $(element.target).attr("name");
				$.post('/deleteset',{file: link}, success => {
					if (success) {
						$('#' + success).remove();
					} else {
						alert("Error deleting card");
					}
				});
			}
		}
	}
	App.init();
})
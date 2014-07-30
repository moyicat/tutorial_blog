$(function() {

	Parse.$ = jQuery;

	Parse.initialize(
		"MuLlfET9KdSdwJ70aol03zHmu5bNTGprdu5jZpec", 
		"NslqpkwkAsRP3gxw5pSlf8gw9PJhKqNW6UbikTK3");

	$('.form-signin').on('submit', function(e) {
		
		e.preventDefault();

		var data = $(this).serializeArray(),
			username = data[0].value,
			password = data[1].value;

		Parse.User.logIn(username, password, {
			success: function(user) {
				$('.row').html('Welcome! ' + user.getUsername());
			},
			error: function(user, error) {
				console.log(error);
			}
		});
		
	});

});
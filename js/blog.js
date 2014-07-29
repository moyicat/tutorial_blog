$(function() {

	Parse.$ = jQuery;

	Parse.initialize("MuLlfET9KdSdwJ70aol03zHmu5bNTGprdu5jZpec", "NslqpkwkAsRP3gxw5pSlf8gw9PJhKqNW6UbikTK3");

	var Blog = Parse.Object.extend("Blog"),

		Blogs = Parse.Collection.extend({
			model: Blog
		}),

		blogs = new Blogs();

	blogs.fetch({
		success: function(blogs) {
			console.log(blogs);
		},
		error: function(blogs, error) {
			console.log(error);
		}
	});

});
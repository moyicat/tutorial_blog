$(function() {

	Parse.$ = jQuery;

	Parse.initialize(
		'MuLlfET9KdSdwJ70aol03zHmu5bNTGprdu5jZpec', 
		'NslqpkwkAsRP3gxw5pSlf8gw9PJhKqNW6UbikTK3');

	var $container = $('.main-container'),

		Blog = Parse.Object.extend('Blog'),

		BlogView = Parse.View.extend({

			className: 'blog-post',

			template: _.template($('#blog-tpl').html()),

			render: function(){
				var attributes = this.model.toJSON();
				this.$el.html(this.template(attributes));		
			}

		}),

		Blogs = Parse.Collection.extend({
			model: Blog
		}),

		BlogsView = Parse.View.extend({
			
			renderOne: function(blog){
				var blogView = new BlogView({ model: blog });
				blogView.render();
				this.$el.append(blogView.el);
			},

			render: function(){ 
				this.collection.forEach(this.renderOne, this);
			},

		}),

		blogs = new Blogs();

	blogs.fetch({
		success: function(blogs) {
			var blogsView = new BlogsView({ collection: blogs });
			blogsView.render();
			$container.html(blogsView.el);
		},
		error: function(blogs, error) {
			console.log(error);
		}
	});

});
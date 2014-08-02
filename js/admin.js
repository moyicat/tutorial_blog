$(function() {

	Parse.$ = jQuery;

	Parse.initialize(
		'MuLlfET9KdSdwJ70aol03zHmu5bNTGprdu5jZpec', 
		'NslqpkwkAsRP3gxw5pSlf8gw9PJhKqNW6UbikTK3');

	var $container = $('.main-container'),

		Blog = Parse.Object.extend('Blog'),

		LoginView = Parse.View.extend({

			template: _.template($('#login-tpl').html()),

			events: {
				'submit .form-signin': 'login'
			},

			login: function(e) {
				e.preventDefault();

				var data = $(e.target).serializeArray(),
					username = data[0].value,
					password = data[1].value;

				Parse.User.logIn(username, password, {
					success: function(user) {
						var welcomeView = new WelcomeView({ model: user });
						welcomeView.render();
						$container.html(welcomeView.el);
					},
					error: function(user, error) {
						console.log(error);
					}
				});

			},

			render: function(){
				this.$el.html(this.template());		
			}

		}),

		WelcomeView = Parse.View.extend({

			template: _.template($('#welcome-tpl').html()),

			events: {
				'click .add-blog':'add'
			},

			add: function() {
				var addBlogView = new AddBlogView();
				addBlogView.render();
				$container.html(addBlogView.el);
			},

			render: function(){
				var attributes = this.model.toJSON();
				this.$el.html(this.template(attributes));
			}

		}),

		AddBlogView = Parse.View.extend({

			template: _.template($('#add-tpl').html()),

			events: {
				'submit .form-add': 'submit'
			},

			submit: function(e) {
				e.preventDefault();

				var data = $(e.target).serializeArray(),
					blog = new Blog();

				blog.set('title', data[0].value)
					.set('content', data[1].value)
					.set('author', Parse.User.current())
					.save(null, {
						success: function(blog) {
							alert('You added a new blog: ' + blog.get('title'));
						},
						error: function(blog, error) {
							console.log(blog);
							console.log(error);
						}
					});
			},

			render: function(){
				this.$el.html(this.template());
			}

		});

	var loginView = new LoginView();
	loginView.render();
	$container.html(loginView.el);

});
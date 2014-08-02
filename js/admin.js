$(function() {

	Parse.$ = jQuery;

	Parse.initialize(
		'MuLlfET9KdSdwJ70aol03zHmu5bNTGprdu5jZpec', 
		'NslqpkwkAsRP3gxw5pSlf8gw9PJhKqNW6UbikTK3');

	var $container = $('.main-container'),

		Blog = Parse.Object.extend('Blog', {

			create: function(title, content) {
				this.set({
					'title': title,
					'content': content,
					'author': Parse.User.current(),
					'authorName': Parse.User.current().get('username'),
					'time': new Date().toDateString()
				}).save(null, {
					success: function(blog) {
						alert('You added a new blog: ' + blog.get('title'));
					},
					error: function(blog, error) {
						console.log(blog);
						console.log(error);
					}
				});
			}

		}),

		Blogs = Parse.Collection.extend({
			model: Blog
		}),

		BlogAdminView = Parse.View.extend({

			tagName: 'tr',

			template: _.template($('#blog-admin-tpl').html()),

			render: function(){
				var attributes = this.model.toJSON();
				this.$el.html(this.template(attributes));		
			}

		}),

		BlogsAdminView = Parse.View.extend({
			
			tagName: 'table',

			className: 'table',

			renderOne: function(blog){
				var blogAdminView = new BlogAdminView({ model: blog });
				blogAdminView.render();
				this.$el.append(blogAdminView.el);
			},

			render: function(){ 
				this.collection.forEach(this.renderOne, this);
			},

		}),

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
						nav("admin");
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

				blog.create(data[0].value, data[1].value);
			},

			render: function(){
				this.$el.html(this.template());
			}

		}),

		BlogRouter = Parse.Router.extend({

			initialize: function(options){
				this.blogs = new Blogs();
			},

			start: function(){
				Parse.history.start({pushState: true});
				nav("admin");
			},

			routes: {
				"admin": "admin",
				"add": "add",
				"edit/:url": "edit"
			},

			admin: function() {

				var currentUser = Parse.User.current();
				if (currentUser) {
				    var loginView = new LoginView();
					loginView.render();
					$container.html(loginView.el);
				} else {
				    var welcomeView = new WelcomeView({ model: currentUser });
					welcomeView.render();
					$container.html(welcomeView.el);

					var blogs = new Blogs();

					blogs.fetch({
						success: function(blogs) {
							var blogsAdminView = new BlogsAdminView({ collection: blogs });
							blogsAdminView.render();
							$container.append(blogsAdminView.el);
						},
						error: function(blogs, error) {
							console.log(error);
						}
					});
				}
				
			}
		}),

		BlogApp = new BlogRouter(),

		nav = function (target, e) {
			BlogApp.navigate(target, { trigger: true });
			if (e) { e.preventDefault(); }
		};

	BlogApp.start();

});
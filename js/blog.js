$(function() {

	Parse.$ = jQuery;

	Parse.initialize(
		'MuLlfET9KdSdwJ70aol03zHmu5bNTGprdu5jZpec', 
		'NslqpkwkAsRP3gxw5pSlf8gw9PJhKqNW6UbikTK3');

	var $container = $('.main-container'),

		Blog = Parse.Object.extend('Blog', {

			update: function(title, content) {

				if ( !this.get('ACL') ) {
					var blogACL = new Parse.ACL(Parse.User.current());
					blogACL.setPublicReadAccess(true);
					this.setACL(blogACL);
				}

				this.set({
					'title': title,
					'content': content,
					'author': this.get('author') || Parse.User.current(),
					'authorName': this.get('authorName') || Parse.User.current().get('username'),
					'time': this.get('time') || new Date().toDateString()
				}).save(null, {
					success: function(blog) {
						BlogApp.navigate('admin', { trigger: true });
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

		BlogView = Parse.View.extend({

			className: 'blog-post',

			template: _.template($('#blog-tpl').html()),

			render: function(){
				var attributes = this.model.toJSON();
				this.$el.html(this.template(attributes));		
			}

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

			events: {
				'click .edit': 'edit'
			},

			edit: function(e) {
				nav(e);
			},

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
						BlogApp.navigate('admin', { trigger: true });
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
				BlogApp.navigate('add', { trigger: true });
			},

			render: function(){
				var attributes = this.model.toJSON();
				this.$el.html(this.template(attributes));
			}

		}),

		WriteBlogView = Parse.View.extend({

			template: _.template($('#write-tpl').html()),

			events: {
				'submit .form-write': 'submit'
			},

			submit: function(e) {
				e.preventDefault();

				var data = $(e.target).serializeArray();
				this.model = this.model || new Blog();
				this.model.update(data[0].value, data[1].value);
			},

			render: function(){
				var attributes;
				if (this.model) {
					attributes = this.model.toJSON();
					attributes.form_title = 'Edit Blog';	
				} else {
					attributes = {
						form_title: 'Add a Blog',
						title: '',
						content: ''
					}
				}
				this.$el.html(this.template(attributes));
			}

		}),

		BlogRouter = Parse.Router.extend({

			initialize: function(options){
				this.blogs = new Blogs();
			},

			start: function(){
				Parse.history.start({pushState: true});
				BlogApp.navigate('', { trigger: true });
			},

			routes: {
				'': 'index',
				'admin': 'admin',
				'login': 'login',
				'add': 'add',
				'edit/:url': 'edit'
			},

			index: function() {
				this.blogs.fetch({
					success: function(blogs) {
						var blogsView = new BlogsView({ collection: blogs });
						blogsView.render();
						$container.html(blogsView.el);
					},
					error: function(blogs, error) {
						console.log(error);
					}
				})
			},

			admin: function() {

				var currentUser = Parse.User.current();

				if ( !currentUser ) {
				   BlogApp.navigate('login', { trigger: true });
				} else {
				    var welcomeView = new WelcomeView({ model: currentUser });
					welcomeView.render();
					$container.html(welcomeView.el);

					this.blogs.fetch({
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

			},

			login: function() {
				var loginView = new LoginView();
				loginView.render();
				$container.html(loginView.el);
			},

			add: function () {
				if (!Parse.User.current()) {
					BlogApp.navigate('login', { trigger: true });
				} else {
					var writeBlogView = new WriteBlogView();
					writeBlogView.render();
					$container.html(writeBlogView.el);
				}
			},

			edit: function (url) {
				if (!Parse.User.current()) {
					BlogApp.navigate('login', { trigger: true });
				} else {
					var blog = this.blogs.filter( function(blog) {
						return blog.id == url;
					})[0];
					var writeBlogView = new WriteBlogView({ model: blog });
					writeBlogView.render();
					$container.html(writeBlogView.el);
				}
			}
		}),

		BlogApp = new BlogRouter(),

		nav = function (e) {
			e.preventDefault();
			var href = $(e.target).attr('href');
			BlogApp.navigate(href, { trigger: true });
		};

	BlogApp.start();

	$(document).on('click', '.blog-nav-item', function(e) {
		nav(e);
		$(this).addClass('active').siblings().removeClass('active');
	});

});
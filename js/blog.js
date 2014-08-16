$(function() {

	Parse.$ = jQuery;

	Parse.initialize(
		'MuLlfET9KdSdwJ70aol03zHmu5bNTGprdu5jZpec', 
		'NslqpkwkAsRP3gxw5pSlf8gw9PJhKqNW6UbikTK3');

	var BlogApp = new (Parse.View.extend({

		Models: {},
		Collections: {},
		Views: {},
		nodes: {},

		// template: _.template($('#master-tpl').html()),

		events: {
			'click .blog-nav-item': function(e) {
				$(e.target).addClass('active').siblings().removeClass('active');
			},
		},

		// render: function() {
		// 	this.$el.html(this.template());
		// },

		start: function() {
			var router = new this.Router;
			router.start();
		}

	}))({el: document.body});

	BlogApp.nodes.$container = BlogApp.$el.find('.main-container');

	BlogApp.Models.Blog = Parse.Object.extend('Blog', {

		update: function(title, content) {

			if ( !this.get('ACL') ) {
				var blogACL = new Parse.ACL(Parse.User.current());
				blogACL.setPublicReadAccess(true);
				this.setACL(blogACL);
			}

			this.set({
				'title': title,
				'url': title.toLowerCase()
							.replace(/[^\w ]+/g,'')
							.replace(/ +/g,'-'),
				'content': content,
				'author': this.get('author') || Parse.User.current(),
				'authorName': this.get('authorName') || Parse.User.current().get('username'),
				'time': this.get('time') || new Date().toDateString()
			}).save(null, {
				success: function(blog) {
					Parse.history.navigate('#/admin', { trigger: true });
				},
				error: function(blog, error) {
					console.log(error);
				}
			});
		}

	});

	BlogApp.Collections.Blogs = Parse.Collection.extend({
		model: BlogApp.Models.Blog,
		query: (new Parse.Query(BlogApp.Models.Blog)).descending('createdAt')
	});

	BlogApp.Views.Blog = Parse.View.extend({

		className: 'blog-post',

		template: _.template($('#blog-tpl').html()),

		render: function(){
			var attributes = this.model.toJSON();
			this.$el.html(this.template(attributes));		
		}

	});

	BlogApp.Views.Blogs = Parse.View.extend({
		
		renderOne: function(blog){
			var blogView = new BlogApp.Views.Blog({ model: blog });
			blogView.render();
			this.$el.append(blogView.el);
		},

		render: function(){ 
			this.collection.forEach(this.renderOne, this);
		},

	});

	BlogApp.Views.BlogAdmin = Parse.View.extend({

		tagName: 'tr',

		template: _.template($('#blog-admin-tpl').html()),

		render: function(){
			var attributes = this.model.toJSON();
			this.$el.html(this.template(attributes));		
		}

	});

	BlogApp.Views.BlogsAdmin = Parse.View.extend({
		
		tagName: 'tbody',

		renderOne: function(blog){
			var blogAdminView = new BlogApp.Views.BlogAdmin({ model: blog });
			blogAdminView.render();
			this.$el.append(blogAdminView.el);
		},

		render: function(){ 
			this.collection.forEach(this.renderOne, this);
		},

	});

	BlogApp.Views.Login = Parse.View.extend({

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
					Parse.history.navigate('#/admin', { trigger: true });
				},
				error: function(user, error) {
					console.log(error);
				}
			});

		},

		render: function(){
			this.$el.html(this.template());		
		}

	});

	BlogApp.Views.Welcome = Parse.View.extend({

		template: _.template($('#welcome-tpl').html()),

		render: function(){
			var attributes = this.model.toJSON();
			this.$el.html(this.template(attributes));
		}

	});

	BlogApp.Views.WriteBlog = Parse.View.extend({

		template: _.template($('#write-tpl').html()),

		events: {
			'submit .form-write': 'submit'
		},

		submit: function(e) {
			e.preventDefault();

			var data = $(e.target).serializeArray();
			this.model = this.model || new BlogApp.Models.Blog();
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

	});

	BlogApp.Router = Parse.Router.extend({

		initialize: function(options){
			this.blogs = new BlogApp.Collections.Blogs();
		},

		start: function(){
			Parse.history.start({root: '/tutorial_blog/'});
		},

		routes: {
			'': 'index',
			'admin': 'admin',
			'login': 'login',
			'logout': 'logout',
			'add': 'add',
			'edit/:url': 'edit',
			'del/:del': 'del'
		},

		index: function() {
			this.blogs.fetch({
				success: function(blogs) {
					var blogsView = new BlogApp.Views.Blogs({ collection: blogs });
					blogsView.render();
					BlogApp.nodes.$container.html(blogsView.el);
				},
				error: function(blogs, error) {
					console.log(error);
				}
			})
		},

		admin: function() {

			var currentUser = Parse.User.current();

			if ( !currentUser ) {
			   Parse.history.navigate('#/login', { trigger: true });
			} else {
			    var welcomeView = new BlogApp.Views.Welcome({ model: currentUser });
				welcomeView.render();
				BlogApp.nodes.$container.html(welcomeView.el);

				this.blogs.fetch({
					success: function(blogs) {
						var blogsAdminView = new BlogApp.Views.BlogsAdmin({ collection: blogs }),
							$table = $('.blog-admin-list');
						blogsAdminView.render();
						$table.append(blogsAdminView.el);
					},
					error: function(blogs, error) {
						console.log(error);
					}
				});
			}

		},

		login: function() {
			var loginView = new BlogApp.Views.Login();
			loginView.render();
			BlogApp.nodes.$container.html(loginView.el);
		},

		logout: function () {
			Parse.User.logOut();
			Parse.history.navigate('#/login', { trigger: true });
		},

		add: function () {
			if (!Parse.User.current()) {
				Parse.history.navigate('#/login', { trigger: true });
			} else {
				var writeBlogView = new BlogApp.Views.WriteBlog();
				writeBlogView.render();
				BlogApp.nodes.$container.html(writeBlogView.el);
			}
		},

		edit: function (url) {
			if (!Parse.User.current()) {
				Parse.history.navigate('#/login', { trigger: true });
			} else {
				var blog = this.blogs.filter( function(blog) {
					return blog.get('url') == url;
				})[0];
				var writeBlogView = new BlogApp.Views.WriteBlog({ model: blog });
				writeBlogView.render();
				BlogApp.nodes.$container.html(writeBlogView.el);
			}
		},

		del: function (url) {
			if (!Parse.User.current()) {
				Parse.history.navigate('#/login', { trigger: true });
			} else {
				var blog = this.blogs.filter( function(blog) {
					return blog.get('url') == url;
				})[0];
				blog.destroy({
					success: function(blog) {
						Parse.history.navigate('#/admin', { trigger: true });
					},
					error: function(blog, error) {
						console.log(error);
					}
				});
			}
		}
	});

	BlogApp.start();

});
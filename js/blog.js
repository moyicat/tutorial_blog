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
		fn: {},

		template: Handlebars.compile($('#master-tpl').html()),

		render: function() {
			this.$el.html(this.template());
		},

		start: function() {
			this.render();
			this.$container = this.$el.find('.main-container');
			this.$sidebar = this.$el.find('.blog-sidebar');
			this.$nav = this.$el.find('.blog-nav-item');
			var router = new this.Router;
			router.start();
			this.fn.getSidebar();
		}

	}))({el: document.body});

	BlogApp.Models.Blog = Parse.Object.extend('Blog', {

		update: function(form) {

			if ( !this.get('ACL') ) {
				var blogACL = new Parse.ACL(Parse.User.current());
				blogACL.setPublicReadAccess(true);
				this.setACL(blogACL);
			}

			BlogApp.category.id = form.category;

			this.set({
				'title': form.title,
				'url': form.title.toLowerCase()
							.replace(/[^\w ]+/g,'')
							.replace(/ +/g,'-'),
				'category': BlogApp.category,
				'content': form.content,
				'author': this.get('author') || Parse.User.current(),
				'authorName': this.get('authorName') || Parse.User.current().get('username'),
				'time': this.get('time') || new Date().toDateString()
			}).save(null, {
				success: function(blog) {
					Parse.history.navigate('#/admin', { trigger: true });
					window.location.reload();
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

	BlogApp.Models.Comment = Parse.Object.extend('Comment', {
		
		update: function(form) {

			this.set({
				'authorName': form.authorName,
				'email': form.email,
				'content': form.content,
				'blog': BlogApp.blog,
				'time': new Date().toDateString()
			}).save(null, {
				success: function(comment) {
					window.location.reload();
				},
				error: function(comment, error) {
					console.log(error);
				}
			});

		}

	});

	BlogApp.Collections.Comments = Parse.Collection.extend({
		model: BlogApp.Models.Comment
	});

	BlogApp.Models.Category = Parse.Object.extend('Category');

	BlogApp.Collections.Categories = Parse.Collection.extend({
		model: BlogApp.Models.Category
	});

	BlogApp.Views.Blogs = Parse.View.extend({

		className: 'blog-posts',

		template: Handlebars.compile($('#blogs-tpl').html()),
		
		render: function(){ 
			var collection = { blog: this.collection.toJSON() };
			this.$el.html(this.template(collection));
		},

	});

	BlogApp.Views.Blog = Parse.View.extend({

		template: Handlebars.compile($('#blog-tpl').html()),

		events: {
			'submit .form-comment': 'submit'
		},

		submit: function(e) {
			e.preventDefault();

			var data = $(e.target).serializeArray();
			this.comment = new BlogApp.Models.Comment();
			this.comment.update({
				authorName: data[0].value, 
				email: data[1].value,
				content: data[2].value
			});
		},

		render: function() { 
			var self = this,
				attributes = this.model.toJSON(),
				query = new Parse.Query(BlogApp.Models.Comment);
			query.equalTo("blog", this.model);
			var collection = query.collection();
			collection.fetch().then(function(comments) {
				attributes.comment = comments.toJSON();
				self.$el.html(self.template(attributes));		
			});
		},

	});

	BlogApp.Views.Categories = Parse.View.extend({

		className: 'sidebar-module',

		template: Handlebars.compile($('#nav-categories-tpl').html()),

		render: function() {
			var collection = { category: this.collection.toJSON() };
			this.$el.html(this.template(collection));
		}

	});

	BlogApp.Views.CategoriesSelect = Parse.View.extend({

		tagName: 'select',

		className: 'form-control',

		attributes: {
			'name': 'category'
		},

		template: Handlebars.compile($('#select-categories-tpl').html()),

		render: function() {
			var collection = { category: this.collection.toJSON() };
			collection.category.forEach(function(c) {
				if ( !BlogApp.blog.attributes.category ) return;
				if ( c.objectId === BlogApp.blog.attributes.category.id ) {
					c.selected = true;
				}
			});
			this.$el.html(this.template(collection));
		}

	});

	BlogApp.Views.BlogsAdmin = Parse.View.extend({

		tagName: 'table',

		className: 'table',

		template: Handlebars.compile($('#blogs-admin-tpl').html()),

		render: function() {
			var collection = { blog: this.collection.toJSON() };
			this.$el.html(this.template(collection));
		}

	});

	BlogApp.Views.Login = Parse.View.extend({

		template: Handlebars.compile($('#login-tpl').html()),

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
					alert(error.message);
				}
			});

		},

		render: function(){
			this.$el.html(this.template());		
		}

	});

	BlogApp.Views.Welcome = Parse.View.extend({

		template: Handlebars.compile($('#welcome-tpl').html()),

		render: function(){
			var self = this,
				attributes = this.model.toJSON();
			BlogApp.blogs.fetch().then(function(blogs) {
				attributes.blogs = BlogApp.fn.renderView({
					View: BlogApp.Views.BlogsAdmin,
					data: { collection: blogs },
					notInsert: true
				});
				self.$el.html(self.template(attributes));
			});
		}

	});

	BlogApp.Views.WriteBlog = Parse.View.extend({

		template: Handlebars.compile($('#write-tpl').html()),

		events: {
			'submit .form-write': 'submit'
		},

		submit: function(e) {
			e.preventDefault();
			var data = $(e.target).serializeArray();
			this.model = this.model || new BlogApp.Models.Blog();
			this.model.update({
				title: data[0].value, 
				category: data[1].value,
				content: data[2].value
			});
		},

		render: function(){
			var self = this,
				attributes;
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
			BlogApp.categories.fetch().then(function(categories) {
				attributes.categoriesSelect = BlogApp.fn.renderView({
					View: BlogApp.Views.CategoriesSelect,
					data: { collection: categories },
					notInsert: true
				});
				self.$el.html(self.template(attributes));
				self.$el.find('textarea').wysihtml5();
			});
		}
	});

	BlogApp.Router = Parse.Router.extend({

		initialize: function(options){
			BlogApp.blog = new BlogApp.Models.Blog();
			BlogApp.blogs = new BlogApp.Collections.Blogs();
			BlogApp.category = new BlogApp.Models.Category();
			BlogApp.categories = new BlogApp.Collections.Categories();
			BlogApp.query = {
				blog: new Parse.Query(BlogApp.Models.Blog),
				category: new Parse.Query(BlogApp.Models.Category)
			};
		},
		
		start: function(){
			Parse.history.start({root: '/tutorial_blog/'});
		},

		routes: {
			'': 'index',
			'blog/:url': 'blog',
			'category/:url': 'category',
			'archive/:year/:month': 'archive',
			'admin': 'admin',
			'login': 'login',
			'logout': 'logout',
			'add': 'add',
			'edit/:url': 'edit',
			'del/:del': 'del'
		},

		index: function() {
			BlogApp.fn.setPageType('blog');
			BlogApp.blogs.fetch().then(function(blogs) {
				BlogApp.fn.renderView({
					View: BlogApp.Views.Blogs,
					data: { collection: blogs }
				});
			});
		},

		blog: function (url) {
			BlogApp.fn.setPageType('blog');
			BlogApp.query.blog.equalTo("url", url).find().then(function(blog) {
				BlogApp.fn.renderView({
					View: BlogApp.Views.Blog,
					data: { model: blog[0] }
				});
			});
			BlogApp.blog = blog[0];
		},

		category: function(url){
			BlogApp.fn.setPageType('blog');
			BlogApp.query.category.equalTo('url', url);
			BlogApp.query.blog.matchesQuery('category', BlogApp.query.category);
			var blogs = BlogApp.query.blog.collection();
			blogs.fetch().then(function(blogs) {
				BlogApp.fn.renderView({
					View: BlogApp.Views.Blogs,
					data: { collection: blogs }
				});
			});
		},

		login: function() {
			BlogApp.fn.setPageType('login');
			BlogApp.fn.renderView({
				View: BlogApp.Views.Login
			});
		},

		logout: function () {
			Parse.User.logOut();
			Parse.history.navigate('#/login', { trigger: true });
		},

		admin: function() {
			BlogApp.fn.setPageType('admin');
			var currentUser = Parse.User.current();
			BlogApp.fn.renderView({
				View: BlogApp.Views.Welcome,
				data: { model: currentUser }
			});
		},

		add: function () {
			BlogApp.fn.setPageType('admin');
			BlogApp.fn.renderView({
				View: BlogApp.Views.WriteBlog
			});
		},

		edit: function (url) {
			BlogApp.fn.setPageType('admin');
			BlogApp.query.blog.equalTo("url", url).find().then(function(blog) {
				BlogApp.fn.renderView({
					View: BlogApp.Views.WriteBlog,
					data: { model: blog[0] }
				});
				BlogApp.blog = blog[0];
			});
		},

		del: function (url) {
			BlogApp.fn.setPageType('admin');
			var query = new Parse.Query(BlogApp.Models.Blog);
			BlogApp.query.blog.equalTo("url", url).find().then(function(blog) {
				blog[0].destroy()
				.then(function(blog) {
					Parse.history.navigate('#/admin', { trigger: true });
					window.location.reload();
				});
			});
		}

	});

	BlogApp.fn.renderView = function(options) {
		var View = options.View,
			data = options.data 			|| null,
			$container = options.$container || BlogApp.$container,
			notInsert = options.notInsert,
			view = new View(data);
		view.render();
		if (notInsert) {
			return view.el.outerHTML;
		} else {
			$container.html(view.el);
		}
	};

	BlogApp.fn.getSidebar = function() {
		BlogApp.categories.fetch().then(function(categories){
			BlogApp.fn.renderView({
				View: BlogApp.Views.Categories,
				data: { collection: categories },
				$container: BlogApp.$sidebar
			});
		});
	};

	BlogApp.fn.setPageType = function(type) {
		if (type === "blog") {
			BlogApp.$nav.eq(0).addClass('active')
				   .siblings().removeClass('active');
		} else {
			BlogApp.$nav.eq(1).addClass('active')
				   .siblings().removeClass('active');
		}
		if (type === "admin") {
			BlogApp.fn.checkLogin();
		}
	};

	BlogApp.fn.checkLogin = function() {
		var currentUser = Parse.User.current();
		if (!currentUser) {
			Parse.history.navigate('#/login', { trigger: true });
		} else {
			return;
		}
	};

	BlogApp.start();

});
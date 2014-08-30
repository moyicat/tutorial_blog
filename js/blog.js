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

		events: {
			'click .blog-nav-item': function(e) {
				$(e.target).addClass('active').siblings().removeClass('active');
			},
		},

		render: function() {
			this.$el.html(this.template());
		},

		start: function() {
			this.render();
			this.$container = this.$el.find('.main-container');
			this.$sidebar = this.$el.find('.blog-sidebar');
			var router = new this.Router;
			router.start();
			router.loadSidebar();
		}

	}))({el: document.body});

	BlogApp.Models.Blog = Parse.Object.extend('Blog', {

		update: function(form) {

			if ( !this.get('ACL') ) {
				var blogACL = new Parse.ACL(Parse.User.current());
				blogACL.setPublicReadAccess(true);
				this.setACL(blogACL);
			}

			var d = new Date(),
				category = BlogApp.categories.filter( function(category) {
					return category.id == form.category;
				})[0];

			this.set({
				'title': form.title,
				'url': form.title.toLowerCase()
							.replace(/[^\w ]+/g,'')
							.replace(/ +/g,'-'),
				'category': category,
				'content': form.content,
				'author': this.get('author') || Parse.User.current(),
				'authorName': this.get('authorName') || Parse.User.current().get('username'),
				'time': this.get('time') || d.toDateString(),
				'month': this.get('month') || d.getMonth(),
				'year': this.get('year') || d.getFullYear()
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

	BlogApp.Models.Comment = Parse.Object.extend('Comment', {
		update: function(form) {
			var d = new Date();

			this.set({
				'authorName': form.authorName,
				'email': form.email,
				'content': form.content,
				'blog': BlogApp.blog,
				'time': d.toDateString()
			}).save(null, {
				success: function(comment) {
					window.location.reload();
				},
				error: function(comment, error) {
					console.log(error);
				}
			})
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

		submit: function (e) {
			e.preventDefault();

			var data = $(e.target).serializeArray();
			this.comment = new BlogApp.Models.Comment();
			this.comment.update({
				authorName: data[0].value, 
				email: data[1].value,
				content: data[2].value
			});
		},

		render: function (){ 
			var self = this,
				attributes = this.model.toJSON(),
				query = new Parse.Query(BlogApp.Models.Comment);
			query.equalTo("blog", this.model);
			var collection = query.collection();
			collection.fetch({
				success: function(comments) {
					attributes.comment = comments.toJSON();
					self.$el.html(self.template(attributes));		
				}
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

	BlogApp.Views.Archives = Parse.View.extend({

		className: 'sidebar-module',

		template: Handlebars.compile($('#nav-archives-tpl').html()),

		render: function() {
			var archMo,
				archYr,
				collection = { archive: [] };
			this.collection.forEach(function(blog){
				if ( blog.get('month') === archMo && blog.get('year') === archYr ) {
					return;
				} else {
					var json = blog.toJSON();
					json.monthString = BlogApp.fn.toMonthString(json.month);
					collection.archive.push(json);
					archMo = blog.get('month');
					archYr = blog.get('year');
				}
			});
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
			collection.category.forEach(function(c){
				if ( BlogApp.blog && c.objectId === BlogApp.blog.attributes.category.id ) {
					c.selected = true;
				} else {
					return;
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
					console.log(error);
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
			BlogApp.fn.getCollection(BlogApp.blogs, function(blogs){
				var blogsAdminView = new BlogApp.Views.BlogsAdmin({ collection: blogs });
				blogsAdminView.render();
				attributes.blogs = blogsAdminView.el.outerHTML;
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
			BlogApp.fn.getCollection(BlogApp.categories, function(categories){
				var categoriesSelect = new BlogApp.Views.CategoriesSelect({ collection: categories });
				categoriesSelect.render();
				attributes.categoriesSelect = categoriesSelect.el.outerHTML;
				self.$el.html(self.template(attributes));
				self.$el.find('textarea').wysihtml5();
			});
			
		}

	});

	BlogApp.Router = Parse.Router.extend({

		initialize: function(options){
			BlogApp.blogs = new BlogApp.Collections.Blogs();
			BlogApp.categories = new BlogApp.Collections.Categories();
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
			BlogApp.fn.getCollection(BlogApp.blogs, function(blogs){
				var blogsView = new BlogApp.Views.Blogs({ collection: blogs });
				blogsView.render();
				BlogApp.$container.html(blogsView.el);
			});
		},

		blog: function (url) {

			BlogApp.fn.getCollection(BlogApp.blogs, function(blogs){

				BlogApp.blog = BlogApp.blogs.filter(function(blog) {
					return blog.get('url') == url;
				})[0];
				var blogView = new BlogApp.Views.Blog({ model: BlogApp.blog });
				blogView.render();
				BlogApp.$container.html(blogView.el);

			});
		},

		category: function(url){
			var innerQuery = new Parse.Query(BlogApp.Models.Category),
				query = new Parse.Query(BlogApp.Models.Blog);
			innerQuery.equalTo('url', url);
			query.matchesQuery('category', innerQuery);
			var blogs = query.collection();
			blogs.fetch({
				success: function(blogs) {
					var blogsView = new BlogApp.Views.Blogs({ collection: blogs });
					blogsView.render();
					BlogApp.$container.html(blogsView.el);
				}, 
				error: function(blogs, error) {
					console.log(error);
				}
			})
		},

		archive: function(year, month) {
			var query = new Parse.Query(BlogApp.Models.Blog);
			query.equalTo('year', parseInt(year, 10));
			query.equalTo('month', parseInt(month, 10));
			var blogs = query.collection();
			blogs.fetch({
				success: function(blogs) {
					var blogsView = new BlogApp.Views.Blogs({ collection: blogs });
					blogsView.render();
					BlogApp.$container.html(blogsView.el);
				}, 
				error: function(blogs, error) {
					console.log(error);
				}
			})
		},

		login: function() {
			var loginView = new BlogApp.Views.Login();
			loginView.render();
			BlogApp.$container.html(loginView.el);
		},

		logout: function () {
			Parse.User.logOut();
			Parse.history.navigate('#/login', { trigger: true });
		},

		admin: function() {

			var currentUser = BlogApp.fn.checkLogin();

			var welcomeView = new BlogApp.Views.Welcome({ model: currentUser });
			welcomeView.render();
			BlogApp.$container.html(welcomeView.el);

		},

		add: function () {
			BlogApp.fn.checkLogin();
			var writeBlogView = new BlogApp.Views.WriteBlog();
			writeBlogView.render();
			BlogApp.$container.html(writeBlogView.el);
		},

		edit: function (url) {
			BlogApp.fn.checkLogin();
			BlogApp.blog = BlogApp.blogs.filter( function(blog) {
				return blog.get('url') == url;
			})[0];
			var writeBlogView = new BlogApp.Views.WriteBlog({ model: BlogApp.blog });
			writeBlogView.render();
			BlogApp.$container.html(writeBlogView.el);
		},

		del: function (url) {
			BlogApp.fn.checkLogin();
			var blog = BlogApp.blogs.filter( function(blog) {
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
		},

		loadSidebar: function() {
			BlogApp.fn.getCollection(BlogApp.categories, function(categories){
				var categoriesView = new BlogApp.Views.Categories({ collection: categories });
					categoriesView.render();
					BlogApp.$sidebar.append(categoriesView.el);
			});
			BlogApp.fn.getCollection(BlogApp.blogs, function(blogs){
				var archivesView = new BlogApp.Views.Archives({ collection: blogs });
				archivesView.render();
				BlogApp.$sidebar.append(archivesView.el);
			});
		}

	});

	BlogApp.fn.toMonthString = function(n) {
		return ['January',
				'February',
				'March',
				'April',
				'May',
				'June',
				'July',
				'August',
				'September',
				'October',
				'November',
				'December'][n];
	};

	BlogApp.fn.getCollection = function(collection, callback) {
		if (collection.length) {
			callback(collection);
		} else {
			collection.fetch({
				success: function (collection) {
					callback(collection);
				},
				error: function(collection, error) {
					console.log(error);
					return;
				}
			})
		}
	}

	BlogApp.fn.checkLogin = function() {
		var currentUser = Parse.User.current();
		if (!currentUser) {
			Parse.history.navigate('#/login', { trigger: true });
		} else {
			return currentUser;
		}
	}

	BlogApp.start();

});
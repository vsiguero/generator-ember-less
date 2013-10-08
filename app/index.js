'use strict';
var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');

var EmberLessGenerator = module.exports = function EmberLessGenerator(args, options) {
  yeoman.generators.Base.apply(this, arguments);

  if (this.appname.match(/^[Ee]mber$/)) {
    this.appname += '_app';
  }

  this.hookFor('ember-less:router');

  // setup the test-framework property, Gruntfile template will need this
  this.testFramework = options['test-framework'] || 'mocha';

  // for hooks to resolve on mocha by default
  if (!options['test-framework']) {
    options['test-framework'] = 'mocha';
  }

  // hook for CoffeeScript
  this.options.coffee = options.coffee;

  // hook for karma test runner
  this.options.karma = options.karma;

  // resolved to mocha by default (could be switched to jasmine for instance)
  this.hookFor('test-framework', { as: 'app' });

  this.indexFile = this.readFileAsString(path.join(this.sourceRoot(), 'index.html'));
  this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));

  // this holds the list of scripts we want to include in components.js
  this.bowerScripts = [
    'bower_components/console-polyfill/index.js',
    'bower_components/jquery/jquery.js',
    'bower_components/handlebars/handlebars.js',
    'bower_components/ember/ember.js'
  ];

  this.on('end', function () {
    this.installDependencies({ skipInstall: options['skip-install'] });
  });
};

util.inherits(EmberLessGenerator, yeoman.generators.Base);

EmberLessGenerator.prototype._getJSPath = function _getJSPath(file) {
  return file + (this.options.coffee ? '.coffee' : '.js');
};

EmberLessGenerator.prototype.welcome = function welcome() {
  // welcome message
  console.log(this.yeoman);
};

EmberLessGenerator.prototype.askFor = function askFor() {
  var cb = this.async();

  var prompts = [];

  prompts.push({
    type : "input",
    name : "name",
    message : "Your project name",
    default : this.appname // Default to current folder name
  });

  prompts.push({
    name : "emberModelLib",
    type : "list",
    message : "Which model/store libe do you want to use?",
    choices : [ "Ember-Data", "Ember-Model" ],
    filter : function(v) { return v.toLowerCase(); }
  });

  prompts.push({
    type: 'confirm',
    name: 'lessBootstrap',
    message: 'Would you like to include Twitter Bootstrap 3.0.0?',
    default: true
  });

  prompts.push({
    type: 'confirm',
    name: 'emberBootstrap',
    message: 'Would you like to include Ember-components Bootstrap for Ember?',
    default: true
  });

  prompts.push({
    type: 'confirm',
    name: 'lessBootswatch',
    message: 'Would you like to include Bootswatch templates for Bootstrap 3.0.0?',
    default: true
  });

  prompts.push({
    type: 'confirm',
    name: 'useRsync',
    message: 'Would you like to use rsync deployment to server using SSH?',
    default: true
  });

  prompts.push({
    type : 'input',
    name : 'deployServer',
    message : 'Your project deployment server full URL',
    default : 'my-server.com',
    when : function (answers) {
      return answers.useRsync;
    }
  });  

  prompts.push({
    type :  'input',
    name :  'deployUser',
    message : 'Your project deployment SSH / Rsync username',
    default : 'myusername',
    when : function (answers) {
      return answers.useRsync;
    }
  });   

  prompts.push({
    type : 'input',
    name : 'deployDir',
    message : 'Your project deployment absolute path',
    default : '/my/server/path/to-deploy-folder/',
    when : function (answers) {
      return answers.useRsync;
    }
  });      

  this.prompt(prompts, function (props) {
    this.config.set(props);
    this.lessBootstrap = props.lessBootstrap;
    this.emberBootstrap = props.emberBootstrap;
    this.lessBootswatch = props.lessBootswatch;
    this.emberModelLib = props.emberModelLib;
    this.useRsync = props.useRsync;    
    this.deployDir = props.deployDir;    
    this.deployUser = props.deployUser;    
    this.deployServer = props.deployServer;    

    this.pkg.name = this.config.get("name");

    cb();
  }.bind(this));
};

EmberLessGenerator.prototype.createDirLayout = function createDirLayout() {
  this.mkdir('app/templates');
  this.mkdir('app/styles');
  this.mkdir('app/images');
  this.mkdir('app/scripts');
  this.mkdir('app/scripts/models');
  this.mkdir('app/scripts/controllers');
  this.mkdir('app/scripts/routes');
  this.mkdir('app/scripts/views');
};

EmberLessGenerator.prototype.git = function git() {
  this.copy('gitignore', '.gitignore');
  this.copy('gitattributes', '.gitattributes');
};

EmberLessGenerator.prototype.bower = function bower() {
  this.copy('bowerrc', '.bowerrc');
  this.copy('_bower.json', 'bower.json');
};

EmberLessGenerator.prototype.packageFile = function packageFile() {
  this.copy('_package.json', 'package.json');
};

EmberLessGenerator.prototype.jshint = function jshint() {
  this.copy('_jshintrc', '.jshintrc');
};

EmberLessGenerator.prototype.tests = function tests() {
  if (this.options.karma) {
    this.mkdir('test');
    this.mkdir('test/support');
    this.mkdir('test/integration');
    this.copy('karma.conf.js', 'karma.conf.js');

    this.template(this._getJSPath('test/_initializer'), this._getJSPath('test/support/initializer'));
    this.template(this._getJSPath('test/integration/_index'), this._getJSPath('test/integration/index'));
  }
};

EmberLessGenerator.prototype.editorConfig = function editorConfig() {
  this.copy('editorconfig', '.editorconfig');
};

EmberLessGenerator.prototype.gruntfile = function gruntfile() {
  this.template('Gruntfile.js');
};

EmberLessGenerator.prototype.templates = function templates() {
  this.copy('hbs/application.hbs', 'app/templates/application.hbs');
  this.copy('hbs/index.hbs', 'app/templates/index.hbs');
};

EmberLessGenerator.prototype.writeIndex = function writeIndex() {
  var mainCssFiles = [];
  if (this.lessBootstrap) {
    mainCssFiles.push('styles/style.css');
  } else {
    mainCssFiles.push('styles/normalize.css');
    mainCssFiles.push('styles/style.css');
  }

  this.indexFile = this.appendStyles(this.indexFile, 'styles/main.css', mainCssFiles);

  if (this.config.get("emberModelLib") === 'ember-data') {
    this.bowerScripts.push(
      'bower_components/ember-data-shim/ember-data.js'
    );
  } else if (this.config.get("emberModelLib") === 'ember-model') {
    this.bowerScripts.push(
      'bower_components/ember-model/ember-model.js'
    );
  } 

  this.indexFile = this.appendScripts(this.indexFile, 'scripts/components.js', this.bowerScripts);

  this.indexFile = this.appendFiles(this.indexFile, 'js', 'scripts/templates.js', ['scripts/compiled-templates.js'], null, '.tmp');
  this.indexFile = this.appendFiles(this.indexFile, 'js', 'scripts/main.js', ['scripts/combined-scripts.js'], null, '.tmp');
};

EmberLessGenerator.prototype.bootstrapJavaScript = function bootstrapJavaScript() {
  if (!this.lessBootstrap) {
    return;  // Skip if disabled.
  }
  // Wire Twitter Bootstrap plugins
  this.indexFile = this.appendScripts(this.indexFile, 'scripts/plugins.js', [
    'bower_components/bootstrap/js/affix.js',
    'bower_components/bootstrap/js/alert.js',
    'bower_components/bootstrap/js/dropdown.js',
    'bower_components/bootstrap/js/tooltip.js',
    'bower_components/bootstrap/js/modal.js',
    'bower_components/bootstrap/js/transition.js',
    'bower_components/bootstrap/js/button.js',
    'bower_components/bootstrap/js/popover.js',
    'bower_components/bootstrap/js/carousel.js',
    'bower_components/bootstrap/js/scrollspy.js',
    'bower_components/bootstrap/js/collapse.js',
    'bower_components/bootstrap/js/tab.js'
  ]);

  if (!this.emberBootstrap) {
    return;  // Skip if disabled.
  }
  // Wire Ember Components - Bootstrap for Ember
  this.indexFile = this.appendScripts(this.indexFile, 'scripts/plugins.js', [
    'bower_components/ember-addons.bs_for_ember/dist/js/bs-core.max.js',
    'bower_components/ember-addons.bs_for_ember/dist/js/bs-basic.max.js',
    'bower_components/ember-addons.bs_for_ember/dist/js/bs-alert.max.js',
    'bower_components/ember-addons.bs_for_ember/dist/js/bs-badge.max.js',
    'bower_components/ember-addons.bs_for_ember/dist/js/bs-button.max.js',
    'bower_components/ember-addons.bs_for_ember/dist/js/bs-label.max.js',
    'bower_components/ember-addons.bs_for_ember/dist/js/bs-list-group.max.js',
    'bower_components/ember-addons.bs_for_ember/dist/js/bs-modal.max.js',
    'bower_components/ember-addons.bs_for_ember/dist/js/bs-nav.max.js',
    'bower_components/ember-addons.bs_for_ember/dist/js/bs-progressbar.max.js',
    'bower_components/ember-addons.bs_for_ember/dist/js/bs-notifications.max.js',
    'bower_components/ember-addons.bs_for_ember/dist/js/bs-wizard.max.js'
  ]);
};

EmberLessGenerator.prototype.all = function all() {
  this.write('app/index.html', this.indexFile);

  if (this.lessBootstrap) {
    this.copy('styles/style_bootstrap.less', 'app/styles/style.less');
  } else {
    this.copy('styles/normalize.css', 'app/styles/normalize.css');
    this.copy('styles/style.css', 'app/styles/style.css');
  }

  this.copy(this._getJSPath('scripts/app'), this._getJSPath('app/scripts/app'));
  this.copy(this._getJSPath('scripts/store'), this._getJSPath('app/scripts/store'));
  this.copy(this._getJSPath('scripts/routes/application_route'), this._getJSPath('app/scripts/routes/application_route'));
};

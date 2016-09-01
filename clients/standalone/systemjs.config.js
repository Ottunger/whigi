/**
 * Configuration for angular to load app files.
 * @module systemjs.config
 * @author Mathonet Grégoire
 */

(function(global) {
  var map = {
    'app': 'app',
    'utils': 'utils',
    '@angular': 'node_modules/@angular',
    'rxjs': 'node_modules/rxjs',
    'ng2-translate': 'node_modules/ng2-translate',
    'ng2-datetime-picker': 'node_modules/ng2-datetime-picker/dist',
    'angular2-notifications': 'node_modules/angular2-notifications'
  };
  var packages = {
    'app': {main: 'main.js', defaultExtension: 'js'},
    'utils': {defaultExtension: 'js'},
    'rxjs': {defaultExtension: 'js'},
    'ng2-translate': {main: 'ng2-translate.js', defaultExtension: 'js'},
    'ng2-datetime-picker': {main: 'index.js', defaultExtension: 'js'},
    'angular2-notifications': {main: 'components.js', defaultExtension: 'js'}
  };
  var ngPackageNames = [
    'common',
    'compiler',
    'core',
    'forms',
    'http',
    'platform-browser',
    'platform-browser-dynamic',
    'router',
    'router-deprecated',
    'upgrade',
  ];
  function packIndex(pkgName) {
    packages['@angular/' + pkgName] = {main: 'index.js', defaultExtension: 'js'};
  }
  function packUmd(pkgName) {
    packages['@angular/' + pkgName] = {main: 'bundles/' + pkgName + '.umd.js', defaultExtension: 'js'};
  }
  var setPackageConfig = System.packageWithIndex ? packIndex : packUmd;

  ngPackageNames.forEach(setPackageConfig);

  var config = {
    map: map,
    packages: packages
  };
  System.config(config);
})(this);
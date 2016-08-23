/**
 * Configuration for angular to load app files.
 * @module systemjs.config
 * @author Mathonet Grégoire
 */

(function(global) {
  var map = {
    'app': 'app',
    '@angular': 'node_modules/@angular',
    'rxjs': 'node_modules/rxjs',
    'ng2-translate': 'node_modules/ng2-translate',
    'bootstrap': 'node_modules/bootstrap',
    'notifications': 'node_modules/angular2-notifications'
  };
  var packages = {
    'app': {main: 'main.js', defaultExtension: 'js'},
    'rxjs': {defaultExtension: 'js'},
    'ng2-translate': {main: 'ng2-translate.js', defaultExtension: 'js'},
    'bootstrap': {defaultExtension: 'js'},
    'notifications': {main: 'components.js', defaultExtension: 'js'}
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
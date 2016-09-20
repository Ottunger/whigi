// Angular 2
import '@angular/platform-browser';
import '@angular/platform-browser-dynamic';
import '@angular/core';
import '@angular/common';
import '@angular/http';
import '@angular/router';

// RxJS
import 'rxjs';

// Other vendors for example jQuery, Lodash or Bootstrap
// You can import js, ts, css, sass, ...
import 'angular2-notifications';

window.aesjs = require('../js/aesjs.min.js');
window.JSEncrypt = require('../js/jsencrypt.min.js');
window.sha256 = require('../js/sha256.js').hash;
window.download = require('../js/download.min.js');
window.Clipboard = require('../js/clipboard.min.js');
window.$ = window.jQuery = require('../js/jquery.slim.min.js');
window.moment = require('../js/moment.js');
require('../js/moment.locales/moment.locales.js');
require('../js/bootstrap-datetimepicker.min.js');

import '../css/bootstrap.min.css';
import '../css/bootstrap-datetimepicker.min.css';
import '../css/one-page-wonder.css';

import '../fonts/glyphicons-halflings-regular.eot';
import '../fonts/glyphicons-halflings-regular.svg';
import '../fonts/glyphicons-halflings-regular.ttf';
import '../fonts/glyphicons-halflings-regular.woff';
import '../fonts/glyphicons-halflings-regular.woff2';
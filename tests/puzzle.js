/**
 * Compute puzzle for front-end test.
 * @module puzzle
 * @author Mathonet Grégoire
 */

var hash = require('js-sha256');


var i = 0, complete, data = process.argv[2];
do {
   complete = hash.sha256(data + i);
   i++;
} while(complete.charAt(0) != '0' || complete.charAt(1) != '0' || complete.charAt(2) != '0');
console.log(i-1);

<?php

/*
Plugin Name: Whigi-RSA
Plugin URI: http://envict.com
Description: PHP RSA Implemntation of decryption, based on helpers listed in LICENSE.
Version: 0.1.1
Author: Grégoire Mathonet
Author URI: http://envict.com
License: MIT
*/

include 'whigi-bn.php';

var b64map="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var b64pad="=";

function hex2b64(h) {
  var i;
  var c;
  var ret = "";
  for(i = 0; i+3 <= h.length; i+=3) {
    c = parseInt(h.substring(i,i+3),16);
    ret += b64map.charAt(c >> 6) + b64map.charAt(c & 63);
  }
  if(i+1 == h.length) {
    c = parseInt(h.substring(i,i+1),16);
    ret += b64map.charAt(c << 2);
  }
  else if(i+2 == h.length) {
    c = parseInt(h.substring(i,i+2),16);
    ret += b64map.charAt(c >> 2) + b64map.charAt((c & 3) << 4);
  }
  while((ret.length & 3) > 0) ret += b64pad;
  return ret;
}

// convert a base64 string to hex
function b64tohex(s) {
  var ret = ""
  var i;
  var k = 0; // b64 state, 0-3
  var slop;
  for(i = 0; i < s.length; ++i) {
    if(s.charAt(i) == b64pad) break;
    v = b64map.indexOf(s.charAt(i));
    if(v < 0) continue;
    if(k == 0) {
      ret += int2char(v >> 2);
      slop = v & 3;
      k = 1;
    }
    else if(k == 1) {
      ret += int2char((slop << 2) | (v >> 4));
      slop = v & 0xf;
      k = 2;
    }
    else if(k == 2) {
      ret += int2char(slop);
      ret += int2char(v >> 2);
      slop = v & 3;
      k = 3;
    }
    else {
      ret += int2char((slop << 2) | (v >> 4));
      ret += int2char(v & 0xf);
      k = 0;
    }
  }
  if(k == 1)
    ret += int2char(slop << 2);
  return ret;
}

// convert a base64 string to a byte/number array
function b64toBA(s) {
  //piggyback on b64tohex for now, optimize later
  var h = b64tohex(s);
  var i;
  var a = new Array();
  for(i = 0; 2*i < h.length; ++i) {
    a[i] = parseInt(h.substring(2*i,2*i+2),16);
  }
  return a;
}

class RSAKey() {

  public $n;
  public $e;
  public $d;
  public $p;
  public $q;
  public $dmp1;
  public $dmq1;
  public $coeff;

  __construct() {
    $this->n = null;
    $this->e = 0;
    $this->d = null;
    $this->p = null;
    $this->q = null;
    $this->dmp1 = null;
    $this->dmq1 = null;
    $this->coeff = null;
  }

  // Set the public key fields N and e from hex strings
  function RSASetPublic(N,E) {
    if(N != null && E != null && N.length > 0 && E.length > 0) {
      this.n = parseBigInt(N,16);
      this.e = parseInt(E,16);
    }
    else
      console.error("Invalid RSA public key");
  }

  // Perform raw public operation on "x": return x^e (mod n)
  function RSADoPublic(x) {
    return x.modPowInt(this.e, this.n);
  }

  // Return the PKCS#1 RSA encryption of "text" as an even-length hex string
  function RSAEncrypt(text) {
    var m = pkcs1pad2(text,(this.n.bitLength()+7)>>3);
    if(m == null) return null;
    var c = this.doPublic(m);
    if(c == null) return null;
    var h = c.toString(16);
    if((h.length & 1) == 0) return h; else return "0" + h;
  }

  // Return the PKCS#1 RSA encryption of "text" as a Base64-encoded string
  //function RSAEncryptB64(text) {
  //  var h = this.encrypt(text);
  //  if(h) return hex2b64(h); else return null;
  //}

  // protected
  RSAKey.prototype.doPublic = RSADoPublic;

  // public
  RSAKey.prototype.setPublic = RSASetPublic;
  RSAKey.prototype.encrypt = RSAEncrypt;
  //RSAKey.prototype.encrypt_b64 = RSAEncryptB64;

  // Depends on rsa.js and jsbn2.js

  // Version 1.1: support utf-8 decoding in pkcs1unpad2

  // Undo PKCS#1 (type 2, random) padding and, if valid, return the plaintext
  function pkcs1unpad2(d,n) {
    var b = d.toByteArray();
    var i = 0;
    while(i < b.length && b[i] == 0) ++i;
    if(b.length-i != n-1 || b[i] != 2)
      return null;
    ++i;
    while(b[i] != 0)
      if(++i >= b.length) return null;
    var ret = "";
    while(++i < b.length) {
      var c = b[i] & 255;
      if(c < 128) { // utf-8 decode
        ret += String.fromCharCode(c);
      }
      else if((c > 191) && (c < 224)) {
        ret += String.fromCharCode(((c & 31) << 6) | (b[i+1] & 63));
        ++i;
      }
      else {
        ret += String.fromCharCode(((c & 15) << 12) | ((b[i+1] & 63) << 6) | (b[i+2] & 63));
        i += 2;
      }
    }
    return ret;
  }

  // Set the private key fields N, e, and d from hex strings
  function RSASetPrivate(N,E,D) {
    if(N != null && E != null && N.length > 0 && E.length > 0) {
      this.n = parseBigInt(N,16);
      this.e = parseInt(E,16);
      this.d = parseBigInt(D,16);
    }
    else
      console.error("Invalid RSA private key");
  }

  // Set the private key fields N, e, d and CRT params from hex strings
  function RSASetPrivateEx(N,E,D,P,Q,DP,DQ,C) {
    if(N != null && E != null && N.length > 0 && E.length > 0) {
      this.n = parseBigInt(N,16);
      this.e = parseInt(E,16);
      this.d = parseBigInt(D,16);
      this.p = parseBigInt(P,16);
      this.q = parseBigInt(Q,16);
      this.dmp1 = parseBigInt(DP,16);
      this.dmq1 = parseBigInt(DQ,16);
      this.coeff = parseBigInt(C,16);
    }
    else
      console.error("Invalid RSA private key");
  }

  // Perform raw private operation on "x": return x^d (mod n)
  function RSADoPrivate(x) {
    if(this.p == null || this.q == null)
      return x.modPow(this.d, this.n);

    // TODO: re-calculate any missing CRT params
    var xp = x.mod(this.p).modPow(this.dmp1, this.p);
    var xq = x.mod(this.q).modPow(this.dmq1, this.q);

    while(xp.compareTo(xq) < 0)
      xp = xp.add(this.p);
    return xp.subtract(xq).multiply(this.coeff).mod(this.p).multiply(this.q).add(xq);
  }

  // Return the PKCS#1 RSA decryption of "ctext".
  // "ctext" is an even-length hex string and the output is a plain string.
  function RSADecrypt(ctext) {
    var c = parseBigInt(ctext, 16);
    var m = this.doPrivate(c);
    if(m == null) return null;
    return pkcs1unpad2(m, (this.n.bitLength()+7)>>3);
  }

  // Return the PKCS#1 RSA decryption of "ctext".
  // "ctext" is a Base64-encoded string and the output is a plain string.
  //function RSAB64Decrypt(ctext) {
  //  var h = b64tohex(ctext);
  //  if(h) return this.decrypt(h); else return null;
  //}
  RSAKey.prototype.doPrivate = RSADoPrivate;

  // public
  RSAKey.prototype.setPrivate = RSASetPrivate;
  RSAKey.prototype.setPrivateEx = RSASetPrivateEx;
  RSAKey.prototype.generate = RSAGenerate;
  RSAKey.prototype.decrypt = RSADecrypt;

}

function JSEncryptRSAKey extends RSAKey {

  function __construct($key) {
    // If a key key was provided.
    if (key) {
      // If this is a string...
      if (typeof key === 'string') {
        this.parseKey(key);
      }
      else if (
        this.hasPrivateKeyProperty(key) ||
        this.hasPublicKeyProperty(key)
      ) {
        // Set the values for the key.
        this.parsePropertiesFrom(key);
      }
    }
  }

}


class JSEncrypt {
  options = options || {};
  this.default_key_size = parseInt(options.default_key_size) || 1024;
  this.default_public_exponent = options.default_public_exponent || '010001'; //65537 default openssl public exponent for rsa key type
  this.log = options.log || false;
  // The private and public key.
  this.key = null;

  /**
  * Method to set the rsa key parameter (one method is enough to set both the public
  * and the private key, since the private key contains the public key paramenters)
  * Log a warning if logs are enabled
  * @param {Object|string} key the pem encoded string or an object (with or without header/footer)
  * @public
  */
  JSEncrypt.prototype.setKey = function (key) {
    if (this.log && this.key) {
      console.warn('A key was already set, overriding existing.');
    }
    this.key = new JSEncryptRSAKey(key);
  };

  /**
  * Proxy method for setKey, for api compatibility
  * @see setKey
  * @public
  */
  JSEncrypt.prototype.setPrivateKey = function (privkey) {
    // Create the key.
    this.setKey(privkey);
  };

  /**
  * Proxy method for RSAKey object's decrypt, decrypt the string using the private
  * components of the rsa key object. Note that if the object was not set will be created
  * on the fly (by the getKey method) using the parameters passed in the JSEncrypt constructor
  * @param {string} string base64 encoded crypted string to decrypt
  * @return {string} the decrypted string
  * @public
  */
  JSEncrypt.prototype.decrypt = function (string) {
    // Return the decrypted string.
    try {
      return this.getKey().decrypt(b64tohex(string));
    }
    catch (ex) {
      return false;
    }
  };

}

?>
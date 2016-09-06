<?php

/*
Plugin Name: Whigi-
Plugin URI: http://envict->com
Description: PHP Big Number Implemntation for decryption, based on helpers listed in LICENSE->
Version: 0->1->1
Author: Grégoire Math$ONEt
Author URI: http://envict->com
License: MIT
*/

function nbi() {
  return new BigInteger(null);
}

$BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
$BI_RC = array();
$rr = ord("0");
for($vv = 0; $vv <= 9; ++$vv)
  $BI_RC[$rr++] = $vv;
$rr = ord("a");
for($vv = 10; $vv < 36; ++$vv)
  $BI_RC[$rr++] = $vv;
$rr = ord("A");
for($vv = 10; $vv < 36; ++$vv)
  $BI_RC[$rr++] = $vv;

function int2char($n) {
  return substr($BI_RM, $n, 1);
}
function intAt($s, $i) {
  $c = $BI_RC[ord(substr($s, $i, 1))];
  return ($c==null)? -1 : $c;
}

function nbv($i) {
  $r = nbi();
  $r->fromInt($i);
  return $r;
}

function nbits($x) {
  $r = 1;
  if(($t=$x>>16) != 0) { $x = $t; $r += 16; }
  if(($t=$x>>8) != 0) { $x = $t; $r += 8; }
  if(($t=$x>>4) != 0) { $x = $t; $r += 4; }
  if(($t=$x>>2) != 0) { $x = $t; $r += 2; }
  if(($t=$x>>1) != 0) { $x = $t; $r += 1; }
  return $r;
}
function lbit($x) {
  if($x == 0) return -1;
  $r = 0;
  if(($x&0xffff) == 0) { $x >>= 16; $r += 16; }
  if(($x&0xff) == 0) { $x >>= 8; $r += 8; }
  if(($x&0xf) == 0) { $x >>= 4; $r += 4; }
  if(($x&3) == 0) { $x >>= 2; $r += 2; }
  if(($x&1) == 0) ++$r;
  return $r;
}
function cbit($x) {
  $r = 0;
  while($x != 0) { $x &= $x-1; ++$r; }
  return $r;
}

$lowprimes = array(2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509,521,523,541,547,557,563,569,571,577,587,593,599,601,607,613,617,619,631,641,643,647,653,659,661,673,677,683,691,701,709,719,727,733,739,743,751,757,761,769,773,787,797,809,811,821,823,827,829,839,853,857,859,863,877,881,883,887,907,911,919,929,937,941,947,953,967,971,977,983,991,997);
$lplim = (1<<26)/$lowprimes[count($lowprimes)-1];

function op_and($x, $y) {
  return $x & $y;
}
function op_or($x, $y) {
  return $x | $y;
}
function op_xor($x, $y) {
  return $x^$y;
}
function op_andnot($x, $y) {
  return $x & ~$y;
}

class BigInteger extends ArrayObject {

  public static $ZERO;
  public static $ONE;
  public static $LN2 = 0.69314718056;

  public $DB;
  public $DM;
  public $DV;
  public $BI_FP;
  public $FV;
  public $F1;
  public $F2;

  function __construct($a, $b = null, $c = null) {
    $this->DB = 26;
    $this->DM = ((1<<26)-1);
    $this->DV = (1<<26);
    $this->BI_FP = 52;
    $this->FV = pow(2, 52);
    $this->F1 = 52-26;
    $this->F2 = 2*26-52;

    if($a != null) {
      if(is_int($a)) {
        $this->fromNumber($a, $b, $c);
      } elseif($b == null && !is_string($a)) {
        $this->fromString($a, 256);
      }
    } else {
      $this->fromString($a, $b);
    }
  }

  function am($i, $x, $w, $j, $c, $n) {
    while(--$n >= 0) {
      $v = $x * $$this[$i++] + $w[$j] + $c;
      $c = floor($v/0x4000000);
      $w[$j++] = $v & 0x3ffffff;
    }
    return $c;
  }

  function copyTo($r) {
    for($i = $this->t - 1; $i >= 0; --$i)
      $r[$i] = $$this[$i];
    $r->t = $this->t;
    $r->s = $this->s;
  }

  function fromInt($x) {
    $this->t = 1;
    $this->s = ($x<0)?-1:0;
    if($x > 0)
      $this[0] = $x;
    elseif($x < -1)
      $this[0] = $x + $this->DV;
    else
      $this->t = 0;
  }

  function fromString($s, $b) {
    $k;
    if($b == 16) $k = 4;
    elseif($b == 8) $k = 3;
    elseif($b == 256) $k = 8;
    elseif($b == 2) $k = 1;
    elseif($b == 32) $k = 5;
    elseif($b == 4) $k = 2;
    else {
      $this->fromRadix($s, $b);
      return;
    }
    $this->t = 0;
    $this->s = 0;
    $i = strlen($s);
    $mi = false;
    $sh = 0;
    while(--$i >= 0) {
      $x = ($k == 8)? $s[$i]&0xff : intAt($s, $i);
      if($x < 0) {
        if(substr($s, $i, 1) == "-") $mi = true;
        continue;
      }
      $mi = false;
      if($sh == 0)
        $$this[$this->t++] = $x;
      elseif($sh+$k > $this->DB) {
        $$this[$this->t-1] |= ($x&((1<<($this->DB-$sh))-1))<<$sh;
        $$this[$this->t++] = ($x>>($this->DB-$sh));
      }
      else
        $$this[$this->t-1] |= $x<<$sh;
      $sh += $k;
      if($sh >= $this->DB) $sh -= $this->DB;
    }
    if($k == 8 && ($s[0]&0x80) != 0) {
      $this->s = -1;
      if($sh > 0) $$this[$this->t-1] |= ((1<<($this->DB-$sh))-1)<<$sh;
    }
    $this->clamp();
    if($mi)
      BigInteger::$ZERO->subTo($this, $this);
  }

  function clamp() {
    $c = $this->s & $this->DM;
    while($this->t > 0 && $$this[$this->t-1] == $c)
      --$this->t;
  }

  function negate() {
    $r = nbi(); BigInteger::$ZERO->subTo($this, $r); return $r;
  }

  function abs() {
    return ($this->s<0)?$this->negate():$this;
  }

  function compareTo($a) {
    $r = $this->s-$a->s;
    if($r != 0) return $r;
    $i = $this->t;
    $r = $i-$a->t;
    if($r != 0) return ($this->s<0)?-$r:$r;
    while(--$i >= 0) if(($r=$$this[$i]-$a[$i]) != 0) return $r;
    return 0;
  }

  function bitLength() {
    if($this->t <= 0) return 0;
    return $this->DB*($this->t-1)+nbits($$this[$this->t-1]^($this->s & $this->DM));
  }

  function dlShiftTo($n, $r) {
    for($i = $this->t-1; $i >= 0; --$i) $r[$i+$n] = $$this[$i];
    for($i = $n-1; $i >= 0; --$i) $r[i] = 0;
    $r->t = $this->t+$n;
    $r->s = $this->s;
  }

  function drShiftTo($n, $r) {
    for($i = $n; $i < $this->t; ++$i) $r[$i-$n] = $$this[$i];
    $r->t = max($this->t-$n,0);
    $r->s = $this->s;
  }

  function lShiftTo($n, $r) {
    $bs = $n % $this->DB;
    $cbs = $this->DB-$bs;
    $bm = (1<<$cbs)-1;
    $ds = floor($n/$this->DB);
    $c = ($this->s<<$bs) & $this->DM;
    for($i = $this->t-1; $i >= 0; --$i) {
      $r[$i+$ds+1] = ($$this[$i]>>$cbs) | $c;
      $c = ($$this[$i] & $bm)<<$bs;
    }
    for($i = $ds-1; $i >= 0; --$i) $r[$i] = 0;
    $r[$ds] = $c;
    $r->t = $this->t+$ds+1;
    $r->s = $this->s;
    $r->clamp();
  }

  function rShiftTo($n, $r) {
    $r->s = $this->s;
    $ds = floor($n/$this->DB);
    if($ds >= $this->t) { $r->t = 0; return; }
    $bs = n%$this->DB;
    $cbs = $this->DB-$bs;
    $bm = (1<<$bs)-1;
    $r[0] = $$this[$ds]>>$bs;
    for($i = $ds+1; $i < $this->t; ++$i) {
      $r[$i-$ds-1] |= ($$this[i] & $bm)<<$cbs;
      $r[$i-$ds] = $$this[i]>>$bs;
    }
    if($bs > 0) $r[$this->t-$ds-1] |= ($this->s & $bm)<<$cbs;
    $r->t = $this->t-$ds;
    $r->clamp();
  }

  function subTo($a, $r) {
    $i = 0;
    $c = 0;
    $m = min($a->t,$this->t);
    while($i < $m) {
      $c += $$this[$i]-$a[$i];
      $r[$i++] = $c & $this->DM;
      $c >>= $this->DB;
    }
    if($a->t < $this->t) {
      $c -= $a->s;
      while($i < $this->t) {
        $c += $$this[$i];
        $r[$i++] = $c & $this->DM;
        $c >>= $this->DB;
      }
      $c += $this->s;
    } else {
      $c += $this->s;
      while($i < $a->t) {
        $c -= $a[$i];
        $r[$i++] = $c & $this->DM;
        $c >>= $this->DB;
      }
      $c -= $a->s;
    }
    $r->s = ($c<0)?-1:0;
    if($c < -1) $r[$i++] = $this->DV+$c;
    elseif($c > 0) $r[$i++] = $c;
    $r->t = $i;
    $r->clamp();
  }

  function multiplyTo($a, $r) {
    $x = $this->abs();
    $y = $a->abs();
    $i = $x->t;
    $r->t = $i+$y->t;
    while(--$i >= 0) $r[$i] = 0;
    for($i = 0; $i < $y->t; ++$i) $r[$i+$x->t] = $x->am(0, $y[$i], $r, $i, 0, $x->t);
    $r->s = 0;
    $r->clamp();
    if($this->s != $a->s) BigInteger::$ZERO->subTo($r, $r);
  }

  function squareTo($r) {
    $x = $this->abs();
    $i = $r->t = 2*$x->t;
    while(--$i >= 0) $r[$i] = 0;
    for($i = 0; $i < $x->t-1; ++$i) {
      $c = $x->am($i, $x[$i], $r, 2*$i, 0, 1);
      if(($r[$i+$x->t]+=$x->am($i+1, 2*$x[$i], $r, 2*$i+1, $c, $x->t-$i-1)) >= $x->DV) {
        $r[$i+$x->t] -= $x->DV;
        $r[$i+$x->t+1] = 1;
      }
    }
    if($r->t > 0) $r[$r->t-1] += $x->am($i, $x[i], $r, 2*$i,0,1);
    $r->s = 0;
    $r->clamp();
  }

  function divRemTo($m, $q, $r) {
    $pm = $m->abs();
    if($pm->t <= 0) return;
    $pt = $this->abs();
    if($pt->t < $pm->t) {
      if($q != null) $q->fromInt(0);
      if($r != null) $this->copyTo($r);
      return;
    }
    if($r == null) $r = nbi();
    $y = nbi();
    $ts = $this->s;
    $ms = $m->s;
    $nsh = $this->DB - nbits($pm[$pm->t-1]);
    if($nsh > 0) { $pm->lShiftTo($nsh, $y); $pt->lShiftTo($nsh, $r); }
    else { $pm->copyTo($y); $pt->copyTo($r); }
    $ys = $y->t;
    $y0 = $y[$ys-1];
    if($y0 == 0) return;
    $yt = $y0*(1<<$this->F1)+(($ys>1)?$y[$ys-2]>>$this->F2:0);
    $d1 = $this->FV/$yt;
    $d2 = (1<<$this->F1)/$yt;
    $e = 1<<$this->F2;
    $i = $r->t;
    $j = $i-$ys;
    $t = ($q==null)?nbi():$q;
    $y->dlShiftTo($j, $t);
    if($r->compareTo($t) >= 0) {
      $r[$r->t++] = 1;
      $r->subTo($t, $r);
    }
    BigInteger::$ONE->dlShiftTo($ys, $t);
    $t->subTo($y, $y);
    while($y->t < $ys) $y[$y->t++] = 0;
    while(--$j >= 0) {
      $qd = ($r[--$i]==$y0)?$this->DM:floor($r[i]*$d1+($r[i-1]+$e)*$d2);
      if(($r[i]+=$y->am(0, $qd, $r, $j, 0, $ys)) < $qd) {
        $y->dlShiftTo($j, $t);
        $r->subTo($t, $r);
        while($r[$i] < --$qd) $r->subTo($t, $r);
      }
    }
    if($q != null) {
      $r->drShiftTo($ys, $q);
      if($ts != $ms) BigInteger::$ZERO->subTo($q, $q);
    }
    $r->t = $ys;
    $r->clamp();
    if($nsh > 0) $r->rShiftTo($nsh, $r);
    if($ts < 0) BigInteger::$ZERO->subTo($r, $r);
  }

  function mod($a) {
    $r = nbi();
    $this->abs()->divRemTo($a, null, $r);
    if($this->s < 0 && $r->compareTo(BigInteger::$ZERO) > 0) $a->subTo($r, $r);
    return r;
  }

  function invDigit() {
    if($this->t < 1) return 0;
    $x = $$this[0];
    if(($x & 1) == 0) return 0;
    $y = $x & 3;
    $y = ($y*(2-($x&0xf)*$y))&0xf;
    $y = ($y*(2-($x&0xff)*y))&0xff;
    $y = ($y*(2-((($x&0xffff)*$y)&0xffff)))&0xffff;
    $y = ($y*(2 - $x*$y % $this->DV)) % $this->DV;
    return ($y>0)? $this->DV-$y : -$y;
  }

  function isEven() {
    return (($this->t>0)?($$this[0] & 1):$this->s) == 0;
  }

  function exp($e, $z) {
    if($e > 0xffffffff || $e < 1) return BigInteger::$ONE;
    $r = nbi();
    $r2 = nbi();
    $g = $z->convert($this);
    $i = nbits($e)-1;
    $g->copyTo($r);
    while(--$i >= 0) {
      $z->sqrTo($r, $r2);
      if(($e & (1<<$i)) > 0) $z->mulTo($r2, $g, $r);
      else { $t = $r; $r = $r2; $r2 = $t; }
    }
    return $z->revert($r);
  }

  function modPowInt($e, $m) {
    if($e < 256 || $m->isEven())
      $z = new Classic($m);
    else
      $z = new Montgomery($m);
    return $this->exp($e, $z);
  }

  function modPow($e, $m) {
    $i = $e->bitLength();
    $r = nbv(1);
    if($i <= 0) return $r;
    elseif($i < 18) $k = 1;
    elseif($i < 48) $k = 3;
    elseif($i < 144) $k = 4;
    elseif($i < 768) $k = 5;
    else $k = 6;
    if($i < 8)
      $z = new Classic($m);
    elseif($m->isEven())
      $z = new Barrett($m);
    else
      $z = new Montgomery($m);

    $g = array();
    $n = 3;
    $k1 = k-1;
    $km = (1<<k)-1;
    $g[1] = $z->convert($this);
    if($k > 1) {
      $g2 = nbi();
      $z->sqrTo($g[1], $g2);
      while($n <= $km) {
        $g[$n] = nbi();
        $z->mulTo($g2, $g[$n-2], $g[$n]);
        $n += 2;
      }
    }

    $j = $e->t-1;
    $is1 = true;
    $r2 = nbi();
    $i = nbits($e[$j])-1;
    while($j >= 0) {
      if($i >= $k1) $w = ($e[$j]>>($i-$k1)) & $km;
      else {
        $w = ($e[$j] & ((1<<($i+1))-1))<<($k1-$i);
        if($j > 0) $w |= $e[$j-1]>>($this->DB+$i-$k1);
      }

      $n = $k;
      while(($w&1) == 0) { $w >>= 1; --$n; }
      if(($i -= $n) < 0) { $i += $this->DB; --$j; }
      if($is1) {
        $g[$w]->copyTo($r);
        $is1 = false;
      } else {
        while($n > 1) { $z->sqrTo($r, $r2); $z->sqrTo($r2, $r); $n -= 2; }
        if($n > 0) $z->sqrTo($r, $r2); else { $t = $r; $r = $r2; $r2 = $t; }
        $z->mulTo($r2, $g[w], $r);
      }

      while($j >= 0 && ($e[$j]&(1<<$i)) == 0) {
        $z->sqrTo($r, $r2); $t = $r; $r = $r2; $r2 = $t;
        if(--$i < 0) { $i = $this->DB-1; --$j; }
      }
    }
    return $z->revert($r);
  }

  function gcd($a) {
    $x = ($this->s<0)?$this->negate():$this->wpclone();
    $y = ($a->s<0)?$a->negate():$a->wpclone();
    if($x->compareTo($y) < 0) { $t = $x; $x = $y; $y = $t; }
    $i = $x->getLowestSetBit();
    $g = $y->getLowestSetBit();
    if($g < 0) return $x;
    if($i < $g) $g = $i;
    if($g > 0) {
      $x->rShiftTo($g, $x);
      $y->rShiftTo($g, $y);
    }
    while($x->signum() > 0) {
      if(($i = $x->getLowestSetBit()) > 0) $x->rShiftTo($i, $x);
      if(($i = $y->getLowestSetBit()) > 0) $y->rShiftTo($i, $y);
      if($x->compareTo($y) >= 0) {
        $x->subTo($y, $x);
        $x->rShiftTo(1, $x);
      } else {
        $y->subTo($x, $y);
        $y->rShiftTo(1, $y);
      }
    }
    if($g > 0) $y->lShiftTo($g, $y);
    return y;
  }

  function modInt($n) {
    if($n <= 0) return 0;
    $d = $this->DV%$n;
    $r = ($this->s<0)?$n-1:0;
    if($this->t > 0)
      if($d == 0) $r = $this[0]%$n;
      else for($i = $this->t-1; $i >= 0; --$i) $r = ($d*$r+$this[i])%$n;
    return $r;
  }

  function modInverse($m) {
    $ac = $m->isEven();
    if(($this->isEven() && $ac) || $m->signum() == 0) return BigInteger::$ZERO;
    $u = $m->wpclone();
    $v = $this->wpclone();
    $a = nbv(1);
    $b = nbv(0);
    $c = nbv(0);
    $d = nbv(1);
    while($u->signum() != 0) {
      while($u->isEven()) {
        $u->rShiftTo(1, $u);
        if($ac) {
          if(!$a->isEven() || !$b->isEven()) { $a->addTo($this, $a); $b->subTo($m, $b); }
          $a->rShiftTo(1, $a);
        }
        elseif(!$b->isEven()) $b->subTo($m, $b);
        $b->rShiftTo(1, $b);
      }
      while($v->isEven()) {
        $v->rShiftTo(1, $v);
        if($ac) {
          if(!$c->isEven() || !$d->isEven()) { $c->addTo($this, $c); $d->subTo($m, $d); }
          $c->rShiftTo(1, $c);
        }
        elseif(!$d->isEven()) $d->subTo($m, $d);
        $d->rShiftTo(1, $d);
      }
      if($u->compareTo($v) >= 0) {
        $u->subTo($v, $u);
        if($ac) $a->subTo($c, $a);
        $b->subTo($d, $b);
      }
      else {
        $v->subTo($u, $v);
        if($ac) $c->subTo($a, $c);
        $d->subTo($b, $d);
      }
    }
    if($v->compareTo(BigInteger::$ONE) != 0) return BigInteger::$ZERO;
    if($d->compareTo(m) >= 0) return $d->subtract($m);
    if($d->signum() < 0) $d->addTo($m, $d); else return $d;
    if($d->signum() < 0) return $d->add($m); else return $d;
  }

  function isProbablePrime($t) {
    $x = $this->abs();
    if($x->t == 1 && $x[0] <= $lowprimes[count($lowprimes)-1]) {
      for($i = 0; $i < count($lowprimes); ++$i)
        if($x[0] == $lowprimes[$i]) return true;
      return false;
    }
    if($x->isEven()) return false;
    $i = 1;
    while($i < count($lowprimes)) {
      $m = $lowprimes[$i];
      $j = $i+1;
      while($j < count($lowprimes) && $m < $lplim) $m *= $lowprimes[$j++];
      $m = $x->modInt($m);
      while($i < $j) if($m%$lowprimes[$i++] == 0) return false;
    }
    return $x->millerRabin($t);
  }

  function millerRabin($t) {
    $n1 = $this->subtract(BigInteger::$ONE);
    $k = $n1->getLowestSetBit();
    if($k <= 0) return false;
    $r = $n1->shiftRight($k);
    $t = ($t+1)>>1;
    if($t > count($lowprimes)) $t = count($lowprimes);
    $a = nbi();
    for($i = 0; $i < $t; ++$i) {
      $a->fromInt($lowprimes[floor(random()*count($lowprimes))]);
      $y = $a->modPow($r, $this);
      if($y->compareTo(BigInteger::$ONE) != 0 && $y->compareTo($n1) != 0) {
        $j = 1;
        while($j++ < $k && $y->compareTo($n1) != 0) {
          $y = $y->modPowInt(2, $this);
          if($y->compareTo(BigInteger::$ONE) == 0) return false;
        }
        if($y->compareTo($n1) != 0) return false;
      }
    }
    return true;
  }

  function wpclone() {
    $r = nbi(); $this->copyTo($r);
    return r;
  }

  function intValue() {
    if($this->s < 0) {
      if($this->t == 1) return $this[0]-$this->DV;
      elseif($this->t == 0) return -1;
    }
    elseif($this->t == 1) return $this[0];
    elseif($this->t == 0) return 0;
    return (($this[1]&((1<<(32-$this->DB))-1))<<$this->DB)|$this[0];
  }

  function byteValue() {
    return ($this->t==0)?$this->s:($this[0]<<24)>>24;
  }

  function shortValue() {
    return ($this->t==0)?$this->s:($this[0]<<16)>>16;
  }

  function chunkSize($r) {
    return floor(BigInteger::$LN2*$this->DB/log($r));
  }

  function sigNum() {
    if($this->s < 0) return -1;
    elseif($this->t <= 0 || ($this->t == 1 && $this[0] <= 0)) return 0;
    else return 1;
  }

  function toRadix($b = null) {
    if($b == null) $b = 10;
    if($this->signum() == 0 || $b < 2 || $b > 36) return "0";
    $cs = $this->chunkSize($b);
    $a = pow($b, $cs);
    $d = nbv($a);
    $y = nbi();
    $z = nbi();
    $r = "";
    $this->divRemTo($d, $y, $z);
    while($y->signum() > 0) {
      $r = substr(base_convert(strval($a+$z->intValue()), 10, $b), 0, 1) + $r;
      $y->divRemTo($d, $y, $z);
    }
    return $z->intValue()->toString($b) + $r;
  }

  function fromRadix($s, $b) {
    $this->fromInt(0);
    if($b == null) $b = 10;
    $cs = $this->chunkSize($b);
    $d = pow($b, $cs);
    $mi = false;
    $j = 0;
    $w = 0;
    for($i = 0; $i < strlen($s); ++$i) {
      $x = intAt($s, $i);
      if($x < 0) {
        if(substr($s, $i, 1) == "-" && $this->signum() == 0) $mi = true;
        continue;
      }
      $w = $b*$w+$x;
      if(++$j >= $cs) {
        $this->dMultiply($d);
        $this->dAddOffset($w, 0);
        $j = 0;
        $w = 0;
      }
    }
    if($j > 0) {
      $this->dMultiply(pow($b, $j));
      $this->dAddOffset($w, 0);
    }
    if($mi) BigInteger::$ZERO->subTo($this, $this);
  }

  function fromNumber($a, $b, $c) {
    if(is_int($b)) {
      if($a < 2) $this->fromInt(1);
      else {
        $this->fromNumber($a, $c);
        if(!$this->testBit($a-1))
          $this->bitwiseTo(BigInteger::$ONE->shiftLeft($a-1), $op_or, $this);
        if($this->isEven()) $this->dAddOffset(1, 0);
        while(!$this->isProbablePrime($b)) {
          $this->dAddOffset(2, 0);
          if($this->bitLength() > $a) $this->subTo(BigInteger::$ONE->shiftLeft($a-1), $this);
        }
      }
    } else {
      $x = array();
      $t = $a&7;
      $x->length = ($a>>3)+1;
      $b->nextBytes($x);
      if($t > 0) $x[0] &= ((1<<$t)-1); else $x[0] = 0;
      $this->fromString($x, 256);
    }
  }

  function toByteArray() {
    $i = $this->t;
    $r = array();
    $r[0] = $this->s;
    $p = $this->DB-($i*$this->DB)%8;
    $k = 0;
    if($i-- > 0) {
      if($p < $this->DB && ($d = $this[i]>>$p) != ($this->s & $this->DM)>>$p)
        $r[$k++] = $d|($this->s<<($this->DB-$p));
      while($i >= 0) {
        if($p < 8) {
          $d = ($this[i]&((1<<$p)-1))<<(8-$p);
          $d |= $this[--$i]>>($p+=$this->DB-8);
        } else {
          $d = ($this[i]>>($p-=8))&0xff;
          if($p <= 0) { $p += $this->DB; --$i; }
        }
        if(($d&0x80) != 0) $d |= -256;
        if($k == 0 && ($this->s&0x80) != ($d&0x80)) ++$k;
        if($k > 0 || $d != $this->s) $r[$k++] = $d;
      }
    }
    return $r;
  }

  function equals($a) {
    return($this->compareTo($a)==0);
  }

  function min($a) {
    return($this->compareTo($a)<0)?$this:$a;
  }

  function max($a) {
    return($this->compareTo($a)>0)?$this:$a;
  }

  function bitwiseTo($a, $op, $r) {
    $m = min($a->t,$this->t);
    for($i = 0; $i < $m; ++$i) $r[$i] = op($this[$i],$a[$i]);
    if($a->t < $this->t) {
      $f = $a->s & $this->DM;
      for($i = $m; $i < $this->t; ++$i) $r[$i] = op($this[$i], $f);
      $r->t = $this->t;
    } else {
      $f = $this->s & $this->DM;
      for($i = $m; $i < $a->t; ++$i) $r[$i] = op($f, $a[$i]);
      $r->t = $a->t;
    }
    $r->s = op($this->s, $a->s);
    $r->clamp();
  }

  function iAnd($a) {
    $r = nbi(); $this->bitwiseTo($a, 'op_and', $r); return $r;
  }

  function iOr($a) {
    $r = nbi(); $this->bitwiseTo($a, 'op_or', $r); return $r;
  }

  function iXor($a) {
    $r = nbi(); $this->bitwiseTo($a, 'op_xor', $r); return $r;
  }

  function iAndNot($a) {
    $r = nbi(); $this->bitwiseTo($a, 'op_andnot', $r); return $r;
  }

  function fNot() {
    $r = nbi();
    for($i = 0; $i < $this->t; ++$i) $r[$i] = $this->DM &~ $this[$i];
    $r->t = $this->t;
    $r->s = ~$this->s;
    return $r;
  }

  function shiftLeft($n) {
    $r = nbi();
    if($n < 0) $this->rShiftTo(-$n, $r); else $this->lShiftTo($n, $r);
    return $r;
  }

  function shiftRight($n) {
    $r = nbi();
    if($n < 0) $this->lShiftTo(-$n, $r); else $this->rShiftTo($n, $r);
    return $r;
  }

  function getLowestSetBit() {
    for($i = 0; $i < $this->t; ++$i)
      if($this[$i] != 0) return $i*$this->DB+lbit($this[$i]);
    if($this->s < 0) return $this->t*$this->DB;
    return -1;
  }

  function bitCount() {
    $r = 0;
    $x = $this->s & $this->DM;
    for($i = 0; $i < $this->t; ++$i) $r += cbit($this[$i]^$x);
    return $r;
  }

  function testBit($n) {
    $j = floor($n/$this->DB);
    if($j >= $this->t) return($this->s!=0);
    return(($this[$j]&(1<<($n%$this->DB)))!=0);
  }

  function changeBit($n, $op) {
    $r = BigInteger::$ONE->shiftLeft($n);
    $this->bitwiseTo($r, $op, $r);
    return r;
  }

  function setBit($n) {
    return $this->changeBit($n, 'op_or');
  }

  function clearBit($n) {
    return $this->changeBit($n, 'op_andnot');
  }

  function flipBit($n) {
    return $this->changeBit($n, 'op_xor');
  }

  function addTo($a, $r) {
    $i = 0;
    $c = 0;
    $m = min($a->t,$this->t);
    while($i < $m) {
      $c += $this[$i]+$a[$i];
      $r[$i++] = $c & $this->DM;
      $c >>= $this->DB;
    }
    if($a->t < $this->t) {
      $c += $a->s;
      while($i < $this->t) {
        $c += $this[$i];
        $r[$i++] = $c & $this->DM;
        $c >>= $this->DB;
      }
      $c += $this->s;
    } else {
      $c += $this->s;
      while(i < $a->t) {
        $c += $a[$i];
        $r[$i++] = $c & $this->DM;
        $c >>= $this->DB;
      }
      $c += $a->s;
    }
    $r->s = ($c<0)?-1:0;
    if($c > 0) $r[$i++] = $c;
    elseif($c < -1) $r[$i++] = $this->DV+$c;
    $r->t = $i;
    $r->clamp();
  }

  function add($a) {
    $r = nbi(); $this->addTo($a, $r); return $r;
  }

  function subtract($a) {
    $r = nbi(); $this->subTo($a, $r); return $r;
  }

  function multiply($a) {
    $r = nbi(); $this->multiplyTo($a, $r); return $r;
  }

  function square() {
    $r = nbi(); $this->squareTo(r); return $r;
  }

  function divide($a) {
    $r = nbi(); $this->divRemTo($a, $r, null); return $r;
  }

  function remainder($a) {
    $r = nbi(); $this->divRemTo($a, null, $r); return $r;
  }

  function divideAndRemainder($a) {
    $q = nbi();
    $r = nbi();
    $this->divRemTo($a, $q, $r);
    return array($q, $r);
  }

  function dMultiply($n) {
    $this[$this->t] = $this->am(0, $n-1, $this, 0, 0, $this->t);
    ++$this->t;
    $this->clamp();
  }

  function dAddOffset($n, $w) {
    if($n == 0) return;
    while($this->t <= $w) $this[$this->t++] = 0;
    $this[$w] += $n;
    while($this[$w] >= $this->DV) {
      $this[$w] -= $this->DV;
      if(++$w >= $this->t) $this[$this->t++] = 0;
      ++$this[$w];
    }
  }

  function ow($e) {
    return $this->exp($e, new NullExp());
  }

  function multiplyLowerTo($a, $n, $r) {
    $i = min($this->t + $a->t, $n);
    $r->s = 0;
    $r->t = $i;
    while($i > 0) $r[--$i] = 0;
    for($j = $r->t-$this->t; $i < $j; ++$i) $r[$i+$this->t] = $this->am(0, $a[$i], $r, $i, 0, $this->t);
    for($j = min($a->t,$n); $i < $j; ++$i) $this->am(0, $a[$i], $r, $i, 0, $n-i);
    $r->clamp();
  }

  function multiplyUpperTo($a, $n, $r) {
    --$n;
    $i = $r->t = $this->t+$a->t-$n;
    $r->s = 0;
    while(--$i >= 0) $r[$i] = 0;
    for($i = max($n-$this->t,0); $i < $a->t; ++$i)
      $r[$this->t+$i-$n] = $this->am($n-i, $a[$i], $r, 0, 0, $this->t+$i-$n);
    $r->clamp();
    $r->drShiftTo(1, $r);
  }

}

class Classic {

  public $m;

  function __construct($m) {
    $this->m = $m;
  }

  function convert($x) {
    if($x->s < 0 || $x->compareTo($this->m) >= 0) return $x->mod($this->m);
    else return $x;
  }

  function revert($x) {
    return $x;
  }

  function reduce($x) {
    $x->divRemTo($this->m, $null, $x);
  }

  function mulTo($x, $y, $r) {
    $x->multiplyTo($y, $r); $this->reduce($r);
  }

  function sqrTo($x, $r) {
    $x->squareTo($r); $this->reduce($r);
  }

}

class Montgomery {

  public $m;
  public $mp;
  public $mpl;
  public $mph;
  public $um;
  public $mt2;

  function __construct($m) {
    $this->m = $m;
    $this->mp = $m->invDigit();
    $this->mpl = $this->mp&0x7fff;
    $this->mph = $this->mp>>15;
    $this->um = (1<<($m->DB-15))-1;
    $this->mt2 = 2*$m->t;
  }

  function convert($x) {
    $r = nbi();
    $x->abs()->dlShiftTo($this->m->t, $r);
    $r->divRemTo($this->m, null, $r);
    if($x->s < 0 && $r->compareTo(BigInteger::$ZERO) > 0) $this->m->subTo($r, $r);
    return r;
  }

  function revert($x) {
    $r = nbi();
    $x->copyTo($r);
    $this->reduce($r);
    return $r;
  }

  function reduce($x) {
    while($x->t <= $this->mt2)
      $x[$x->t++] = 0;
    for($i = 0; $i < $this->m->t; ++$i) {
      $j = $x[$i] & 0x7fff;
      $u0 = ($j*$this->mpl + ((($j*$this->mph+($x[$i]>>15)*$this->mpl) & $this->um)<<15)) & $x->DM;
      $j = $i+$this->m->t;
      $x[$j] += $this->m->am(0, $u0, $x, $i, 0, $this->m->t);
      while($x[$j] >= $x->DV) { $x[j] -= $x->DV; $x[++$j]++; }
    }
    $x->clamp();
    $x->drShiftTo($this->m->t, $x);
    if($x->compareTo($this->m) >= 0) $x->subTo($this->m, $x);
  }

  function sqrTo($x, $r) {
    $x->squareTo($r); $this->reduce($r);
  }

  function mulTo($x, $y, $r) {
    $x->multiplyTo($y, $r); $this->reduce($r);
  }

}

class NullExp {

  function convert($x) {
    return $x;
  }

  function revert($x) {
    return $x;
  }

  function mulTo($x, $y, $r) {
    $x->multiplyTo($y, $r);
  }
  function sqrTo($x, $r) {
    $x->squareTo($r);
  }

}

class Barrett {

  public $m;
  public $r2;
  public $q3;
  public $mu;

  function __construct($m) {
    $this->r2 = nbi();
    $this->q3 = nbi();
    BigInteger::$ONE->dlShiftTo(2*$m->t,$this->r2);
    $this->mu = $this->r2->divide($m);
    $this->m = $m;
  }

  function convert($x) {
    if($x->s < 0 || $x->t > 2*$this->m->t) return $x->mod($this->m);
    elseif($x->compareTo($this->m) < 0) return $x;
    else { $r = nbi(); $x->copyTo($r); $this->reduce($r); return $r; }
  }

  function revert($x) {
    return $x;
  }

  function reduce($x) {
    $x->drShiftTo($this->m->t-1,$this->r2);
    if($x->t > $this->m->t+1) { $x->t = $this->m->t+1; $x->clamp(); }
    $this->mu->multiplyUpperTo($this->r2, $this->m->t+1, $this->q3);
    $this->m->multiplyLowerTo($this->q3, $this->m->t+1, $this->r2);
    while($x->compareTo($this->r2) < 0) $x->dAddOffset(1, $this->m->t+1);
    $x->subTo($this->r2,$x);
    while($x->compareTo($this->m) >= 0) $x->subTo($this->m, $x);
  }

  function sqrTo($x, $r) {
    $x->squareTo($r); $this->reduce($r);
  }

  function mulTo($x, $y, $r) {
    $x->multiplyTo($y, $r); $this->reduce($r);
  }

}

BigInteger::$ZERO = nbv(0);
BigInteger::$ONE = nbv(1);

?>
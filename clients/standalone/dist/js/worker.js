self.importScripts('aesjs.min.js');

function chunkify(a, n, balanced) {
    if (n < 2)
        return [a];
    var len = a.length, out = [], i = 0, size;
    if (len % n === 0) {
        size = Math.floor(len / n);
        while (i < len) {
            out.push(a.slice(i, i += size));
        }
    }
    else if(balanced) {
        while(i < len) {
            size = Math.ceil((len - i) / n--);
            out.push(a.slice(i, i += size));
        }
    }

    else {
        n--;
        size = Math.floor(len / n);
        if(len % size === 0)
            size--;
        while(i < size * n) {
            out.push(a.slice(i, i += size));
        }
        out.push(a.slice(size * n));
    }
    return out;
}

onmessage = function(msg) {
    try {
        var data = msg.data[0], key = msg.data[1], encrypt = msg.data[2];
        var encrypter = new self.aesjs.ModeOfOperation.ctr(key, new self.aesjs.Counter(0));

        if(encrypt) {
            var num = self.aesjs.util.convertStringToBytes(data);
            var len = num.length, split, ret = [];

            if(len < 100) {
                postMessage([0, 0]);
                ret = encrypter.encrypt(num);
                postMessage([2, ret]);
            } else {
                postMessage([0, 1]);
                var parts = chunkify(num, 100, false);
                for(var i = 0; i < parts.length; i++) {
                    ret = ret.concat(encrypter.encrypt(parts[i]));
                    if(i % 20 == 0)
                        postMessage([1, i]);
                }
                postMessage([2, ret]);
            }
        } else {
            var len = data.length, split, ret = [];

            if(len < 100) {
                postMessage([0, 0]);
                ret = encrypter.decrypt(data);
                postMessage([2, self.aesjs.util.convertBytesToString(ret)]);
            } else {
                postMessage([0, 1]);
                var parts = chunkify(data, 100, false);
                for(var i = 0; i < parts.length; i++) {
                    ret = ret.concat(encrypter.decrypt(parts[i]));
                    if(i % 20 == 0)
                        postMessage([1, i]);
                }
                postMessage([2, self.aesjs.util.convertBytesToString(ret)]);
            }
        }
    } catch(e) {
        console.log(e);
        postMessage([3, JSON.stringify(e.stack.replace(/^[^\(]+?[\n$]/gm, '')
            .replace(/^\s+at\s+/gm, '')
            .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
            .split('\n'))]);
    }
    close();
}
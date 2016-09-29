//var g = ...;
//var gp = ...;

var go = {}, gpo = {};
for(var i = 0; i < g.length; i++) {
    go[g[i].path] = [g[i]];
    delete go[g[i].path].path;
}
console.log(JSON.stringify(go));
for(var i = 0; i < gp.length; i++) {
    gpo[gp[i].path] = gp[i];
    delete gpo[gp[i].path].path;
}
console.log(JSON.stringify(gpo));
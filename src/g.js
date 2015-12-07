'use strict';

var _ = require('lodash');
var vg = require('./libraries/vg/vg');
var img = require('./libraries/img/img');

var g = {};

// Commands
function importCommands(module) {
    for (var k in module) {
        g[k] = module[k];
    }
}

for (var k in vg) {
    g[k] = vg[k];
}
delete g['delete'];

for (var k in img) {
    g[k] = img[k];
}

importCommands(require('./libraries/math'));
importCommands(require('./libraries/string'));
importCommands(require('./libraries/list'));
importCommands(require('./libraries/data'));
importCommands(require('./libraries/image'));
importCommands(require('./libraries/graphics'));
importCommands(require('./libraries/easing'));

g.importSVG = function (svgString) {
    return g.svg.parseString(svgString);
};

g.importImage = function (image) {
    var layer = g.Layer.fromImage(image);
    return new g.Img(layer.toCanvas());
};

g.importText = function (string) {
    return string ? String(string) : '';
};

g.importCSV = function (csvString, delimiter) {
    // Split the row, taking quotes into account.
    function splitRow(s, delimiter) {
        var row = [], c, col = '', i, inString = false;
        s = s.trim();
        for (i = 0; i < s.length; i += 1) {
            c = s[i];
            if (c === '"') {
                if (s[i+1] === '"') {
                    col += '"';
                    i += 1;
                } else {
                    inString = !inString;
                }
            } else if (c === delimiter) {
                if (!inString) {
                    row.push(col);
                    col = '';
                } else {
                    col += c;
                }
            } else {
                col += c;
            }
        }
        row.push(col);
        return row;
    }

    var rows, header;
    delimiter = delimiter || ',';

    if (!csvString) return null;
    rows = csvString.split(/\r\n|\r|\n/g);
    header = splitRow(rows[0], delimiter);
    rows = rows.slice(1);

    rows = _.reject(rows, _.isEmpty);

    rows = _.map(rows, function (row) {
        var cols, m = {};
        cols = _.map(splitRow(row, delimiter), function (col) {
            return isNaN(col) ? col : parseFloat(col);
        });
        _.each(cols, function (col, index) {
            m[header[index]] = col;
        });
        return m;
    });
    return rows;
};

g.merge = function () {
    var objects = _.flatten(arguments, true);
    if (Array.isArray(objects)) {
        objects = _.reject(objects, _.isEmpty);
        if (objects.length > 0) {
            var o = objects[0];
            if (o && (o.commands || o.shapes)) {
                return vg.merge(objects);
            } else if (o instanceof img.Img) {
                return img.merge(objects);
            }
        }
    }
    return null;
};

g.mix = function (a, b, t) {
    t = t !== undefined ? t : 0.5;
    if (typeof a === 'number') {
        return (a * (1 - t)) + (b * t);
    } else if (typeof a === 'object') {
        var result = {};
        var keys = Object.keys(a);
        for (var i = 0, n = keys.length; i < n; i += 1) {
            var k = keys[i];
            var va = a[k];
            var vb = b[k];
            if (va !== undefined && vb !== undefined) {
                result[k] = g.mix(va, vb, t);
            }
        }
        return result;
    } else {
        return 0;
    }
};

module.exports = g;
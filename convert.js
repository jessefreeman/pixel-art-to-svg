const fs = require('fs');
const path = require("path");
const chokidar = require('chokidar');
PNG = require("pngjs").PNG;

const scale = 8;

// One-liner for current directory
chokidar.watch('in/*.png', {
    ignored: 'node_modules'}).on('all', (event, path) => {
        toSVG(path, scale);
});

let svgTemplate = 
    '<?xml version="1.0" encoding="UTF-8" ?>\n' +
    '<svg version="1.1" width="{0}" height="{1}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">\n' +
    '{2}'+
    '\n</svg>';

let svgRect = '<rect x="{0}" y="{1}" width="{2}" height="{3}" fill="{4}"/>'

function toSVG(filePath, scale)
{
    
    var basePath = path.dirname(filePath);
    var baseName = path.basename(basePath);
    var extension = path.extname(filePath);
    var fileName = path.basename(filePath, extension);

    // console.log("convert png", filePath, basePath, file);

    fs.createReadStream(filePath)
    .pipe(new PNG())
    .on("parsed", function () {

        let newWidth = this.width * scale;
        let newHeight = this.height * scale;
        let pixelSize = scale;

        // svg shapes
        let shapes = [];

        // svg shapes grouped by colors
        let layers = {};

        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                var idx = (this.width * y + x) << 2;
        
                let r = this.data[idx];
                let g = this.data[idx + 1];
                let b = this.data[idx + 2];

                let hex = rgbToHex(r, g, b);
                
                // Create a new layer array
if(layers[hex] == null)
{
    layers[hex] = []
}

                let newRect = svgRect.format(x * scale, y * scale, pixelSize, pixelSize, hex);
                
shapes.push(newRect);

layers[hex].push(newRect);


            }
        }

        // Copy the template string so we don't corrupt it in the loop
        let svg = svgTemplate.format(newWidth, newHeight, shapes.join('\n'));

        var dest = ["out", fileName+"-"+scale+"x.svg"].join(path.sep);

        fs.writeFile(dest, svg, function (err) {
            if (err) return console.log(err);
            console.log(filePath, "to", dest);
        });
        // Loop through layers and write the files

        for (const layer in layers) {
            
            let layerName = layer.substring(1);
            svg = svgTemplate.format(newWidth, newHeight, layers[layer].join('\n'));
            
            dest = ["out", fileName+"-"+scale+"x." + layerName+ ".svg"].join(path.sep);

            fs.writeFile(dest, svg, function (err) {
                if (err) return console.log(err);
                console.log(filePath, "to", dest);
            });

        }

    });

    
}

function decToHex(value) {
    if (value > 255) {
        return 'FF';
    } else if (value < 0) {
        return '00';
    } else {
        return value.toString(16).padStart(2, '0').toUpperCase();
    }
}

function rgbToHex(r, g, b) {
    return '#' + decToHex(r) + decToHex(g) + decToHex(b);
}

// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ?
                args[number] :
                match;
        });
    };
}
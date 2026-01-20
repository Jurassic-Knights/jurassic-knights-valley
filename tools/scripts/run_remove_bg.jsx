// run_remove_bg.jsx
// Open image, remove background using native API, scale to fit canvas with 10px margin, save as PNG, close
// Loops through all image pairs in config file
// Alignment: Characters, Dinosaurs, and Resources (res_) align to bottom; everything else centers

#target photoshop

// Suppress dialogs and prevent focus stealing
app.displayDialogs = DialogModes.NO;
app.bringToFront = false;

function unlockBackgroundLayer(doc) {
    var layer = doc.activeLayer;
    if (layer.isBackgroundLayer) {
        layer.isBackgroundLayer = false;
    }
}

function selectSubject() {
    var idautoCutout = stringIDToTypeID("autoCutout");
    var desc = new ActionDescriptor();
    desc.putInteger(stringIDToTypeID("sampleAllLayers"), 0);
    executeAction(idautoCutout, desc, DialogModes.NO);
}

function invertSelection(doc) {
    doc.selection.invert();
}

function expandSelection(doc, pixels) {
    doc.selection.expand(UnitValue(pixels, "px"));
}

function deleteSelection(doc) {
    var idDlt = charIDToTypeID("Dlt ");
    executeAction(idDlt, undefined, DialogModes.NO);
}

function removeBackground(doc) {
    unlockBackgroundLayer(doc);
    selectSubject();
    invertSelection(doc);
    try {
        expandSelection(doc, 1);
    } catch (e) { }
    try {
        deleteSelection(doc);
    } catch (e) { }
    doc.selection.deselect();
}

function shouldAlignBottom(filename) {
    var lowerName = filename.toLowerCase();

    if (lowerName.indexOf("npc_") === 0) return true;
    if (lowerName.indexOf("merchant_") === 0) return true;
    if (lowerName.indexOf("dino_") === 0) return true;
    if (lowerName.indexOf("res_") === 0) return true;
    if (lowerName.indexOf("building_") === 0) return true;

    return false;
}

function scaleAndPositionContent(doc, margin, alignBottom) {
    var canvasWidth = doc.width.as("px");
    var canvasHeight = doc.height.as("px");

    var layer = doc.activeLayer;
    var bounds = layer.bounds;
    var contentLeft = bounds[0].as("px");
    var contentTop = bounds[1].as("px");
    var contentRight = bounds[2].as("px");
    var contentBottom = bounds[3].as("px");

    var contentWidth = contentRight - contentLeft;
    var contentHeight = contentBottom - contentTop;

    var targetWidth = canvasWidth - (margin * 2);
    var targetHeight = canvasHeight - (margin * 2);

    var scaleX = targetWidth / contentWidth;
    var scaleY = targetHeight / contentHeight;
    var scaleFactor = Math.min(scaleX, scaleY);

    // Scale up if smaller than target (scaleFactor > 1)
    // Scale down if larger than canvas (to fit within margins)
    if (scaleFactor !== 1) {
        // Only scale if needed
        if (scaleFactor > 1 || contentWidth > targetWidth || contentHeight > targetHeight) {
            var scalePercent = scaleFactor * 100;
            layer.resize(scalePercent, scalePercent, AnchorPosition.MIDDLECENTER);
        }
    }

    // ALWAYS apply positioning after any scaling
    var newBounds = layer.bounds;
    var newLeft = newBounds[0].as("px");
    var newTop = newBounds[1].as("px");
    var newRight = newBounds[2].as("px");
    var newBottom = newBounds[3].as("px");

    var newContentWidth = newRight - newLeft;
    var newContentHeight = newBottom - newTop;

    // Center horizontally
    var offsetX = (canvasWidth - newContentWidth) / 2 - newLeft;

    // Vertical alignment: bottom for characters/dinos/resources, center for others
    var offsetY;
    if (alignBottom) {
        // Position so content bottom is exactly (canvasHeight - margin) from top
        // Which means content bottom is exactly 'margin' pixels from canvas bottom
        var targetBottom = canvasHeight - margin;
        var targetTop = targetBottom - newContentHeight;
        offsetY = targetTop - newTop;
    } else {
        offsetY = (canvasHeight - newContentHeight) / 2 - newTop;  // Center vertically
    }

    layer.translate(offsetX, offsetY);
}

var configFile = new File(Folder.temp + "/ps_remove_bg_config.txt");
if (configFile.exists) {
    configFile.encoding = "UTF-8";
    configFile.open("r");

    var lines = [];
    while (!configFile.eof) {
        var line = configFile.readln();
        if (line && line.length > 0) {
            lines.push(line);
        }
    }
    configFile.close();

    for (var i = 0; i < lines.length; i += 2) {
        var inputPath = lines[i];
        var outputPath = lines[i + 1];

        if (!inputPath || !outputPath) continue;

        var inputFile = new File(inputPath);
        if (inputFile.exists) {
            try {
                var doc = app.open(inputFile);

                removeBackground(doc);

                // Determine alignment based on filename
                var filename = inputFile.name;
                var alignBottom = shouldAlignBottom(filename);

                scaleAndPositionContent(doc, 10, alignBottom);

                var outputFile = new File(outputPath);
                var pngOpts = new PNGSaveOptions();
                pngOpts.compression = 6;
                doc.saveAs(outputFile, pngOpts, true, Extension.LOWERCASE);

                doc.close(SaveOptions.DONOTSAVECHANGES);
            } catch (e) {
                // Continue to next image if one fails
            }
        }
    }
}

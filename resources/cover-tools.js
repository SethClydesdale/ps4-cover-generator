// # PS4 COVER GENERATOR TOOLS #
(function (window, document) {
  
  window.PS_Cover = {
    isPS4 : /PlayStation 4/.test(navigator.userAgent),

    canvas : document.getElementById('ps4-cover-photo'),

    cache : {
      bgColor : document.getElementById('cover-bg-color'),
      saveCover : document.getElementById('save-cover'),
      autoSave : document.getElementById('cover-auto-save'),
      settings : document.getElementById('canvas-settings').getElementsByTagName('INPUT'),
      coverTools : document.getElementById('cover-tools'),
      layerSettings : document.getElementById('layer-settings'),
      layerList : document.getElementById('layer-list'),
      layerTotal : document.getElementById('layer-total'),

      Images : {},
      updateInput : {},
    },

    // used to draw images, text, etc.. onto the canvas
    draw : function () {
      PS_Cover.ctx.fillStyle = PS_Cover.cache.bgColor.value;
      PS_Cover.ctx.fillRect(0, 0, PS_Cover.canvas.width, PS_Cover.canvas.height);

      // draw images onto the canvas
      for (var i = PS_Cover.cache.layers.length - 1, img, data; i > -1; i--) {
        data = PS_Cover.cache.layers[i].dataset;

        switch (data.type) {
          case 'text' :
            PS_Cover.ctx.font = data.size + 'px ' + data.font;

            PS_Cover.transform({
              width : PS_Cover.ctx.measureText(data.value).width,
              height : -(+data.size / 1.5),
              rotate : +data.rotate,
              flipH : +data.flipH,
              flipV : +data.flipV,
              opacity : +data.opacity / 100,
              blend : data.blend,
              shadow : data.shadow,
              x : data.x,
              y : data.y

            }, function () {
              var fill = data.nofill == 'true' ? 'stroke' : 'fill';

              PS_Cover.ctx[fill + 'Style'] = (data.gradient && !/^D:/.test(data.gradient)) ? PS_Cover.gradient.set(data) : data.color;
              PS_Cover.ctx[fill + 'Text'](data.value, data.x, data.y);
            });
            break;


          case 'image' :
            img = PS_Cover.cache.layers[i].firstChild;

            if (!img.dataset.last || img.dataset.last != data.value) {
              img.dataset.last = data.value;
              img.src = data.value;
            }

            PS_Cover.loadImage(img, data.x, data.y, {
              width : img.naturalWidth,
              height : img.naturalHeight,
              scale : +data.scale / 100,
              rotate : +data.rotate,
              flipH : +data.flipH,
              flipV : +data.flipV,
              opacity : +data.opacity / 100,
              blend : data.blend,
              shadow : data.shadow,
              x : data.x,
              y : data.y
            });
            break;


          case 'shape' :
            PS_Cover.transform({
              width : data.width,
              height : data.height,
              scale : +data.scale / 100,
              rotate : +data.rotate,
              flipH : +data.flipH,
              flipV : +data.flipV,
              opacity : +data.opacity / 100,
              blend : data.blend,
              shadow : data.shadow,
              x : data.x,
              y : data.y

            }, function () {
              var fill = data.nofill == 'true' ? 'stroke' : 'fill',
                  color = (data.gradient && !/^D:/.test(data.gradient)) ? PS_Cover.gradient.set(data) : data.color,
                  thumb = PS_Cover.cache.layers[i].firstChild.getContext('2d');

              PS_Cover.drawShape(data.value, {
                style : fill,
                color : color,
                x : +data.x,
                y : +data.y,
                height : +data.height,
                width : +data.width
              }, PS_Cover.ctx);

              thumb.clearRect(0, 0, 40, 40);
              PS_Cover.drawShape(data.value, {
                style : fill,
                color : color,
                x : /tri|arc/.test(data.value) ? 20 : 5,
                y : data.value == 'arc' ? 20 : 5,
                height : 30,
                width : 30
              }, thumb);

            });
            break;
        }

      }

    },


    // draw a shape onto the canvas
    drawShape : function (shape, config, ctx) {
      ctx.beginPath();
      ctx[config.style + 'Style'] = config.color;

      switch (shape) {
        case 'rect' :
          ctx.rect(config.x, config.y, config.width, config.height);
          break;

        case 'tri' :
          ctx.moveTo(config.x, config.y);
          ctx.lineTo(config.x - (config.width / 2), config.y + config.height);
          ctx.lineTo(config.x + (config.width / 2), config.y + config.height);
          ctx.closePath();
          break;

        case 'arc' :
          ctx.arc(config.x, config.y, (config.width + config.height) / 4, 0, 2 * Math.PI);
          break;
      }

      ctx[config.style]();
    },


    // wait for images to load before drawing them
    loadImage : function (img, x, y, transformData) {
      if (img.complete) {
        PS_Cover.transform(transformData, function () {
          PS_Cover.ctx.drawImage(img, x, y);
        });

      } else if (!img.onload) {
        img.onload = function () {
          PS_Cover.transform(transformData, function () {
            PS_Cover.ctx.drawImage(img, x, y);
          });

          // onload delays the addition of this layer
          // so draw again to update the layer position of the image
          PS_Cover.draw();
        };
      }
    },


    // update the input of elements and draw the new value to the canvas
    updateInput : function (caller) {
      if (caller != PS_Cover.cache.updateInput.lastCaller) {
        PS_Cover.cache.updateInput = {
          lastCaller : caller,
          type : caller.className.replace(/cover-input-/g, ''),
          fa : caller.parentNode.querySelector('.fa-caller')
        };
      }

      var selected = caller.tagName == 'SELECT' ? caller.options[caller.selectedIndex] : null,
          value = caller[caller.type == 'checkbox' ? 'checked' : 'value'];

      if (PS_Cover.cache.updateInput.type == 'font' && !selected.dataset.loaded) {
        PS_Cover.cache.activeLayer.style.fontFamily = value;
        PS_Cover.cache.activeLayer.dataset[PS_Cover.cache.updateInput.type] = value;
        PS_Cover.draw();

      } else {
        if (PS_Cover.cache.updateInput.type == 'font') {
          PS_Cover.cache.activeLayer.style.fontFamily = value;
        }

        if (PS_Cover.cache.updateInput.type == 'value') {
          PS_Cover.cache.activeLayer.lastChild.innerHTML =
          PS_Cover.cache.activeLayer.dataset.type == 'image' ? value.split('/').pop() :
          selected ? selected.innerHTML :
          value;
        }

        PS_Cover.cache.activeLayer.dataset[PS_Cover.cache.updateInput.type] = value;
        PS_Cover.draw();
      }

      // show fontawesome icon toggler
      if (PS_Cover.cache.updateInput.type == 'font') {
        if (value == 'FontAwesome' && PS_Cover.cache.updateInput.fa && PS_Cover.cache.updateInput.fa.style.display == 'none') {
          PS_Cover.cache.updateInput.fa.style.display = '';
        } else if (PS_Cover.cache.updateInput.fa && PS_Cover.cache.updateInput.fa.style.display != 'none') {
          PS_Cover.cache.updateInput.fa.style.display = 'none';
        }
      }

    },


    // updates the layer's shadow
    updateShadow : function (caller) {
      var color = document.getElementById('layer-shadow-color').previousSibling.style.backgroundColor,
          opacity = +document.getElementById('layer-shadow-opacity').value / 100;

      PS_Cover.cache.activeLayer.dataset.shadow =
      (document.getElementById('layer-shadow').checked ? '' : 'D:')+
      document.getElementById('layer-shadow-x').value+
      '|'+
      document.getElementById('layer-shadow-y').value+
      '|'+
      document.getElementById('layer-shadow-blur').value+
      '|'+
      (
        /rgba/.test(color) ? color.replace(/(?:\d+\.)\d+\)/, opacity + ')') :
                             color.replace(')', ', ' + opacity + ')').replace('rgb', 'rgba')
      );

      PS_Cover.draw();
    },


    gradient : {

      // changes the gradient type
      change : function (caller) {
        var parent = caller.parentsUntil('.layer-popup'),
            text = caller.parentsUntil('.main-layer-input').querySelector('.cover-input-value[type="text"]');

        switch (caller.options[caller.selectedIndex].innerHTML) {
          case 'Linear' :
            parent.querySelector('.gradient-x-start').value = 0;
            parent.querySelector('.gradient-y-start').value = 0;
            parent.querySelector('.gradient-x-end').value = 100;
            parent.querySelector('.gradient-y-end').value = 0;
            break;

          case 'Radial' :
            parent.querySelector('.gradient-x-start').value = 50;
            parent.querySelector('.gradient-y-start').value = 50;
            parent.querySelector('.gradient-x-end').value = 50;
            parent.querySelector('.gradient-y-end').value = 50;
            parent.querySelector('.gradient-r-start').value = text ? 120 : 50;
            parent.querySelector('.gradient-r-end').value = 0;
            break;
        }

        PS_Cover.gradient.update(caller);
      },


      // updates the layer's gradient
      update : function (caller) {
        caller = caller.parentsUntil('.layer-popup');

        var stop = caller.querySelectorAll('.color-stop'),
            i = 0,
            j = stop.length,
            gradient = caller.querySelector('input[type="checkbox"]').checked ? '' : 'D:',
            color;

        for (; i < j; i++) {
          color = stop[i].querySelector('.color-inpicker-box').style.backgroundColor;
          opacity = stop[i].querySelector('.layer-gradient-opacity').value / 100;
          gradient +=
          (
            /rgba/.test(color) ? color.replace(/(?:\d+\.)\d+\)/, opacity + ')') :
                                 color.replace(')', ', ' + opacity + ')').replace('rgb', 'rgba')
          ) + (i == j - 1 ? '' : '|');
        }

        PS_Cover.cache.activeLayer.dataset.gradient = gradient +';'+
        caller.querySelector('.gradient-type').value+
        '|'+
        caller.querySelector('.gradient-x-start').value+
        '|'+
        caller.querySelector('.gradient-y-start').value+
        '|'+
        caller.querySelector('.gradient-x-end').value+
        '|'+
        caller.querySelector('.gradient-y-end').value+
        '|'+
        caller.querySelector('.gradient-r-start').value+
        '|'+
        caller.querySelector('.gradient-r-end').value;

        PS_Cover.draw();
      },


      // returns a gradient
      set : function (data) {
        var settings = data.gradient.split(';'),
        stops = settings[0].split('|'),
        offsets = settings[1].split('|'),
        x = data.width ? +data.width : PS_Cover.ctx.measureText(data.value).width,
        y = data.height ? +data.height : -(+data.size / 1.5),
        k, j;

        gradient = offsets[0] == 'Linear' ?
                   PS_Cover.ctx.createLinearGradient(
                     +data.x + (x * offsets[1] / 100) * 2,
                     +data.y + (y * offsets[2] / 100) * 2,
                     +data.x + (x * offsets[3] / 100) * 2,
                     +data.y + (y * offsets[4] / 100) * 2
                   ) :
                   PS_Cover.ctx.createRadialGradient(
                     +data.x + (x * offsets[1] / 100),
                     +data.y + (y * offsets[2] / 100),
                     ((x + y) / 2) * offsets[5] / 100,
                     +data.x + (y * offsets[3] / 100),
                     +data.y + (x * offsets[4] / 100),
                     ((x + y) / 2) * offsets[6] / 100
                   );

        for (k = 0, j = stops.length; k < j; k++) {
          gradient.addColorStop(k / j, stops[k]);
        }

        return gradient;
      },


      // adds a color stop to the gradient editor
      addColorStop : function (caller) {
        var stops = caller.parentNode.previousSibling;

        stops.insertAdjacentHTML('beforeend',
          PS_Cover.templates.gradient.color_stop
          .replace('{COLOR}', PS_Cover.randomColor())
          .replace('{OPACITY}', 100)
        );

        ColorInpicker.init(stops, {
          hide : true
        });

        PS_Cover.gradient.update(caller);
      },


      // removes a color stop from the gradient editor
      deleteColorStop : function (caller) {
        var parent = caller.parentsUntil('.gradient-stops');
        parent.removeChild(caller.parentNode);

        PS_Cover.gradient.update(parent);
      },


      // moves a color stop in the gradient editor
      moveColorStop : function (caller) {
        var parent = caller.parentsUntil('.gradient-stops'),
            row = caller.parentNode,
            next = row.nextSibling;

        if (/fa-sort-asc/.test(caller.className)) {
          parent.insertBefore(row, row.previousSibling);

        } else {
          (next && next.nextSibling) ? parent.insertBefore(row, next.nextSibling) :
                                       parent.appendChild(row);
        }

        PS_Cover.gradient.update(parent);
      }
    },


    // adjusts the scale, rotation, etc.. of a single canvas element
    transform : function (config, callback) {
      PS_Cover.ctx.save();

      if (!/^D:/.test(config.shadow)) {
        config.shadow = config.shadow.split('|');
        PS_Cover.ctx.shadowColor = config.shadow[3];
        PS_Cover.ctx.shadowBlur = config.shadow[2];
        PS_Cover.ctx.shadowOffsetX = config.shadow[0];
        PS_Cover.ctx.shadowOffsetY = config.shadow[1];
      }

      if (config.blend) {
        PS_Cover.ctx.globalCompositeOperation = config.blend;
      }

      if (typeof config.opacity != 'undefined') {
        PS_Cover.ctx.globalAlpha = config.opacity;
      }

      if (typeof config.scale != 'undefined') {
        PS_Cover.ctx.scale(config.scale, config.scale);
      }

      if (typeof config.rotate != 'undefined') {
        PS_Cover.ctx.translate(config.x, config.y);
        PS_Cover.ctx.rotate(config.rotate * Math.PI / 180);
        PS_Cover.ctx.translate(-config.x, -config.y);
      }

      if (config.flipH || config.flipV) {
        PS_Cover.ctx.translate(
          config.flipH ? Math.abs(config.x - (config.width * -1)) : config.x,
          config.flipV ? Math.abs(config.y - (config.height * -1)) : config.y
        );
        PS_Cover.ctx.scale(config.flipH ? -1 : 1, config.flipV ? -1 : 1);
        PS_Cover.ctx.translate(-config.x, -config.y);
      }

      callback();
      PS_Cover.ctx.restore();
    },


    // flips a layer vertically or horizontally
    flipLayer : function (caller) {
      var method = /level-up/.test(caller.className) ? 'flipV' : 'flipH';

      PS_Cover.cache.activeLayer.dataset[method] = +PS_Cover.cache.activeLayer.dataset[method] ? 0 : 1;
      PS_Cover.draw();
    },


    // rotate the specified layer
    rotateLayer : function (caller, amount) {

      if (!PS_Cover.rotating && caller != 'stop' && amount == 1) {
        PS_Cover.rotating = true;

        PS_Cover.rotator = window.setInterval(function () {
          var total = +PS_Cover.cache.activeLayer.dataset.rotate + amount;
          PS_Cover.cache.activeLayer.dataset.rotate = total > 360 ? 0 : total;
          PS_Cover.draw();
        }, 10);

      } else if (PS_Cover.rotating && caller == 'stop') {
        PS_Cover.rotating = false;
        window.clearInterval(PS_Cover.rotator);

      } else if (amount == 90) {
        var total = +PS_Cover.cache.activeLayer.dataset.rotate;

        if (total < 90) {
          total = 90;
        } else if (total < 180) {
          total = 180;
        } else if (total < 270) {
          total = 270;
        } else if (total < 360 || total > 360) {
          total = 0;
        }

        PS_Cover.cache.activeLayer.dataset.rotate = total;
        PS_Cover.draw();
      }
    },


    // moves the image, text, etc.. in the specified direction
    move : function (caller) {
      if (!PS_Cover.moving && caller != 'stop') {
        PS_Cover.moving = true;

        var row = caller.parentsUntil('#layer-settings'),
            raw = {
              x : row.querySelector('.cover-input-x'),
              y : row.querySelector('.cover-input-y')
            },
            coord = /up|down/.test(caller.className) ? 'y' : 'x',
            amount = /up|left/.test(caller.className) ? -1 : +1;

        PS_Cover.mover = window.setInterval(function () {
          PS_Cover.cache.activeLayer.dataset[coord] = +PS_Cover.cache.activeLayer.dataset[coord] + amount;
          raw[coord].value = PS_Cover.cache.activeLayer.dataset[coord];
          PS_Cover.draw();
        }, 1);

      } else if (PS_Cover.moving && caller == 'stop') {
        PS_Cover.moving = false;
        window.clearInterval(PS_Cover.mover);
      }
    },


    // function for adding new layers
    add : function (type, settings) {
      settings = settings ? settings : {};

      var firstChild = PS_Cover.cache.layerList.firstChild,
          row = document.createElement('DIV'),
          defaultAttrs =
          'class="cover-layer ' + type + '-layer"'+
          'data-type="' + type + '"'+
          'data-blend="' + ( settings.blend || '' ) + '"'+
          'data-opacity="' + ( settings.opacity || 100 ) + '"'+
          'data-shadow="' + ( settings.shadow || 'D:0|0|0|rgba(0, 0, 0, 1)' ) + '"'+
          'data-rotate="' + ( settings.rotate || 0 ) + '"'+
          'data-flip-h="' + ( settings.flipH || 0 ) + '"'+
          'data-flip-v="' + ( settings.flipV || 0 ) + '"'+
          'data-x="' + ( settings.x || 0 ) + '"'+
          'data-y="' + ( settings.y || 0 ) + '"'+
          'href="#"'+
          'onclick="PS_Cover.openLayer(this); return false;"',

          val = settings.value || '';

      // add a new layer based on the chosen type
      switch (type) {
        case 'text' :
          row.innerHTML =
          '<a '+
            'data-value="' + val + '"'+
            'data-color="' + (settings.color || PS_Cover.randomColor()) + '"'+
            'data-gradient="' + ( settings.gradient || 'D:rgba(255, 255, 255, 1)|rgba(102, 102, 102, 1);Horizontal|0|0|100|0|50|0' ) + '"'+
            'data-nofill="' + ( settings.nofill || false ) + '"'+
            'data-size="' + ( settings.size || 40 ) + '"'+
            'data-font="' + ( settings.font || 'PlayStation' ) + '"'+
            'data-y="' + ( settings.y || '40' ) + '"'+
            defaultAttrs+
          '>'+
            '<i class="layer-thumb fa fa-font"></i>'+
            '<span class="layer-value">' + val + '</span>'+
          '</a>';
          break;


        case 'image' :
          row.innerHTML =
          '<a '+
            'data-value="' + val + '"'+
            'data-scale="' + ( settings.scale || 100 ) + '"'+
            defaultAttrs+
          '>'+
            '<img class="layer-thumb" src="' + val + '" alt="" ' + (window.location.protocol != 'file:' ? 'crossorigin="anonymous"' : '') + '>'+
            '<span class="layer-value">' + val.split('/').pop() + '</span>'+
          '</a>';
          break;

        case 'shape' :
          row.innerHTML =
          '<a '+
            'data-value="' + (val || 'rect') + '"'+
            'data-color="' + PS_Cover.randomColor() + '"'+
            'data-gradient="' + ( settings.gradient || 'D:rgba(255, 255, 255, 1)|rgba(102, 102, 102, 1);Horizontal|0|0|100|0|50|0' ) + '"'+
            'data-nofill="' + ( settings.nofill || false ) + '"'+
            'data-scale="' + ( settings.scale || 100 ) + '"'+
            'data-height="' + ( settings.height || '50' ) + '"'+
            'data-width="' + ( settings.width || '50' ) + '"'+
            defaultAttrs+
          '>'+
            '<canvas class="layer-thumb" width="40" height="40"></canvas>'+
            '<span class="layer-value">Rectangle</span>'+
          '</a>';
          break;
      }

      // add the new layer to the layers list
      row = row.firstChild;
      firstChild ? PS_Cover.cache.layerList.insertBefore(row, firstChild) : PS_Cover.cache.layerList.appendChild(row);
      PS_Cover.cache.layers = PS_Cover.cache.layerList.querySelectorAll('.cover-layer');

      if (!settings.noOpen) {
        PS_Cover.openLayer(row);
      }

      PS_Cover.updateLayerCount();
      PS_Cover.draw();
    },


    // opens the tools for editing the selected layer
    openLayer : function (caller) {
      var data = caller.dataset,
          shadow = data.shadow.replace('D:', '').split('|'),

          coords = PS_Cover.templates.layer_coords
          .replace('value="0"', 'value="' + data.x + '"')
          .replace('value="0"', 'value="' + data.y + '"'),

          shared_tools = PS_Cover.templates.shared_tools
          .replace('value="' + data.blend + '"', 'value="' + data.blend + '" selected')
          .replace('value="100"', 'value="' + data.opacity + '"')
          .replace('id="layer-shadow"', 'id="layer-shadow"' + (/^D:/.test(data.shadow) ? '' : ' checked'))
          .replace('{SHADOW_X}', shadow[0])
          .replace('{SHADOW_Y}', shadow[1])
          .replace('{SHADOW_BLUR}', shadow[2])
          .replace('{SHADOW_COLOR}', shadow[3])
          .replace('{SHADOW_OPACITY}', shadow[3] && shadow[3].replace(/rgb\(|\)/g, '').split(',').pop() * 100),

          gradient = data.gradient ? PS_Cover.templates.gradient.editor : '';


      if (gradient) {
        var settings = data.gradient.replace('D:', '').split(';')
            stop = settings[0].split('|'),
            offset = settings[1].split('|')
            i = 0,
            j = stop.length,
            gradients = '';

        if (stop) {
          for (; i < j; i++) {
            gradients += PS_Cover.templates.gradient.color_stop
                         .replace('{COLOR}', stop[i])
                         .replace('{OPACITY}', stop[i].replace(/rgb\(|\)/g, '').split(',').pop() * 100);
          }

          gradient = gradient
                     .replace('id="layer-gradient"', 'id="layer-gradient"' + (/^D:/.test(data.gradient) ? '' : ' checked'))
                     .replace('{GRADIENTS}', gradients);

        } else {
          gradient = gradient.replace('{GRADIENTS}',
            PS_Cover.templates.gradient.color_stop.replace('{COLOR}', '#FFFFFF').replace('{OPACITY}', 100)+
            PS_Cover.templates.gradient.color_stop.replace('{COLOR}', '#666666').replace('{OPACITY}', 100)
          );
        }

        gradient = gradient
                  .replace('value="' + offset[0] + '"', 'value="' + offset[0] + '" selected')
                  .replace('{START-OFFSET-X}', offset[1])
                  .replace('{START-OFFSET-Y}', offset[2])
                  .replace('{END-OFFSET-X}', offset[3])
                  .replace('{END-OFFSET-Y}', offset[4])
                  .replace('{START-OFFSET-R}', offset[5])
                  .replace('{END-OFFSET-R}', offset[6]);
      }


      switch (data.type) {
        case 'text' :
          for (var opts = '', i = 0, j = PS_Cover.fonts.length; i < j; i++) {
            opts += '<option value="' + PS_Cover.fonts[i] + '"' + ( data.font == PS_Cover.fonts[i] ? ' selected' : '' ) + '>' + PS_Cover.fonts[i] + '</option>';
          }

          PS_Cover.cache.layerSettings.innerHTML = '<div class="main-layer-input">'+
            '<input class="cover-input-value" type="text" value="' + data.value + '" oninput="PS_Cover.updateInput(this);">'+
            '<a href="#" class="fa fa-eyedropper tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-color color-inpicker" type="text" value="' + data.color + '" oninput="PS_Cover.updateInput(this);">'+
            gradient+
            '<a href="#" class="fa fa-adjust tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-nofill" type="checkbox" onchange="PS_Cover.updateInput(this);" ' + ( data.nofill == 'true' ? 'checked' : '' ) + '>'+
            PS_Cover.templates.layer_controls+
          '</div>'+
          '<div class="cover-input-tools clear">'+
            shared_tools+
            '<a href="#" class="fa fa-text-height tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-size" type="number" value="' + data.size + '" oninput="PS_Cover.updateInput(this);" min="0">'+
            '<a href="#" class="fa fa-font tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><a class="fa fa-smile-o fa-caller layer-button" href="#" onclick="PS_Cover.FontAwesome.call(this);return false;" ' + (data.font == 'FontAwesome' ? '' : 'style="display:none;"') + '></a>'+
            '<select class="cover-input-font" onchange="PS_Cover.updateInput(this);">'+
              opts+
            '</select>'+
            coords +
          '</div>';
          break;


        case 'image' :
          PS_Cover.cache.layerSettings.innerHTML =
          '<div class="main-layer-input">'+
            '<input class="cover-input-value" type="text" value="' + data.value + '" oninput="PS_Cover.updateInput(this);">'+
            '<a class="fa fa-search image-caller layer-button" href="#" onclick="PS_Cover.Images.call(this);return false;"></a>'+
            PS_Cover.templates.layer_controls+
          '</div>'+
          '<div class="cover-input-tools clear">'+
            shared_tools+
            '<a href="#" class="fa fa-arrows tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-scale" type="number" value="' + data.scale + '" oninput="PS_Cover.updateInput(this);" min="0">'+
            coords +
          '</div>';

          // open the image selector
          if (!data.value) {
            PS_Cover.Images.call(PS_Cover.cache.layerSettings.querySelector('.image-caller'));
          }
          break;


        case 'shape' :
          var opts =
          '<option value="rect">Rectangle</option>'+
          '<option value="tri">Triangle</option>'+
          '<option value="arc">Circle</option>';

          PS_Cover.cache.layerSettings.innerHTML =
          '<div class="main-layer-input">'+
            '<select class="cover-input-value" onchange="PS_Cover.updateInput(this);">'+
              opts.replace('value="' + data.value + '"', 'value="' + data.value + '" selected')+
            '</select>'+
            '<a href="#" class="fa fa-eyedropper tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-color color-inpicker" type="text" value="' + data.color + '" oninput="PS_Cover.updateInput(this);">'+
            gradient+
            '<a href="#" class="fa fa-adjust tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-nofill" type="checkbox" onchange="PS_Cover.updateInput(this);" ' + ( data.nofill == 'true' ? 'checked' : '' ) + '>'+
            PS_Cover.templates.layer_controls+
          '</div>'+
          '<div class="cover-input-tools clear">'+
            shared_tools+
            '<a href="#" class="fa fa-arrows tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-scale" type="number" value="' + data.scale + '" oninput="PS_Cover.updateInput(this);" min="0">'+
            '<a href="#" class="fa fa-arrows-h tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-width" type="number" value="' + data.width + '" oninput="PS_Cover.updateInput(this);" min="0">'+
            '<a href="#" class="fa fa-arrows-v tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-height" type="number" value="' + data.height + '" oninput="PS_Cover.updateInput(this);" min="0">'+
            coords +
          '</div>';
          break;
      }

      // set and replace the activeLayer
      if (PS_Cover.cache.activeLayer) {
        PS_Cover.cache.activeLayer.className = PS_Cover.cache.activeLayer.className.replace(' activeLayer', '');
      }

      caller.className += ' activeLayer';
      PS_Cover.cache.activeLayer = caller;

      // various modifications to the layer elements are below
      replaceCheckboxes(); // replace checkboxes w/custom ones

      // create color pickers
      ColorInpicker.init(PS_Cover.cache.layerSettings, {
        hide : true
      });

      // ps4 specific modifications
      if (PS_Cover.isPS4) {
        Inumber.init(); // create number input arrows
      }

      // scoll to the current layer
      if (!PS_Cover.loadingPreset) {
        PS_Cover.jumpToLayer(PS_Cover.cache.activeLayer);
      }

    },


    // loads a preset
    loadPreset : function (caller, skipConfirmation) {
      if (skipConfirmation || confirm('Would you like to load the ' + ( caller ? caller.options[caller.selectedIndex].innerHTML : 'default' ) + ' preset? Your current progress will be lost.')) {
        var color = '#000000';

        PS_Cover.deleteLayers(true);
        PS_Cover.loadingPreset = true;

        switch (caller ? caller.value : '') {
          case 'gravity-rush' :
            color = '#007700';

            PS_Cover.add('image', {
              value : 'resources/images/gravity-rush/grw-00.jpg',
              y : -570
            });

            PS_Cover.add('image', {
              value : 'resources/images/gravity-rush/gr-logo.png',
              x : 0,
              y : 60,
              opacity : 50,
              rotate : 340
            });

            PS_Cover.add('text', {
              value : 'YOUR NAME HERE',
              color : '#004400',
              size : 30,
              font : 'Luckiest Guy',
              x : 30,
              y : 400,
              opacity : 80,
              rotate : 270
            });

            break;


          case 'persona-5' :
            color = '#CC0000';

            PS_Cover.add('image', {
              value : 'resources/images/persona/p5w-00.jpg'
            });

            PS_Cover.add('text', {
              value : 'SIGN YOUR NAME HERE',
              color : '#000000',
              font : 'Love Ya Like A Sister',
              x : 85,
              y : 140,
              rotate : 350
            });

            break;


          case 'uncharted-4' :
            color = '#003377';

            PS_Cover.add('image', {
              value : 'resources/images/uncharted/uc4-00.jpg'
            });

            PS_Cover.add('image', {
              value : 'resources/images/uncharted/uc-logo.png',
              opacity : 80,
              rotate : 320,
              x : 10,
              y : 140
            });

            PS_Cover.add('text', {
              value : 'YOUR NAME HERE',
              color : '#FFFFFF',
              font : 'Fredericka the Great',
              x : 380,
              y : 310
            });

            break;


          default :
            color = '#0077CC';

            PS_Cover.add('image', {
              value : 'resources/images/ps4.png',
              x : (PS_Cover.canvas.width / 2) - 100,
              y : (PS_Cover.canvas.height / 2) - 100
            });

            PS_Cover.add('text', {
              value : 'PS4 Cover Generator',
              color : '#FFFFFF',
              x : (PS_Cover.canvas.width / 2) - 175,
              y : 120
            });

            break;
        }

        PS_Cover.cache.bgColor.value = color;

        if (PS_Cover.cache.bgColor.previousSibling.className == 'color-inpicker-box') {
          PS_Cover.cache.bgColor.previousSibling.style.backgroundColor = color;
        }


        window.setTimeout(PS_Cover.draw, 100);

        PS_Cover.loadingPreset = false;
      }
    },


    // move layers up / down
    moveLayer : function (where, caller) {
      switch (where.toLowerCase()) {
        case 'up' :
          PS_Cover.cache.layerList.insertBefore(PS_Cover.cache.activeLayer, PS_Cover.cache.activeLayer.previousSibling);
          break;

        case 'down' :
          var next = PS_Cover.cache.activeLayer.nextSibling;

          if (PS_Cover.cache.layerList.lastChild == PS_Cover.cache.activeLayer) {
            PS_Cover.cache.layerList.insertBefore(PS_Cover.cache.activeLayer, PS_Cover.cache.layerList.firstChild);

          } else if (next && next.nextSibling) {
            PS_Cover.cache.layerList.insertBefore(PS_Cover.cache.activeLayer, next.nextSibling);

          } else {
            PS_Cover.cache.layerList.appendChild(PS_Cover.cache.activeLayer);
          }
          break;
      }

      PS_Cover.cache.layers = PS_Cover.cache.layerList.querySelectorAll('.cover-layer');
      PS_Cover.jumpToLayer(PS_Cover.cache.activeLayer);
      PS_Cover.draw();
    },


    // delete the specified layer
    deleteLayer : function (node, skipConfirmation) {
      if (skipConfirmation || confirm('You are about to delete this layer.\nDo you want to continue?')) {
        var next = PS_Cover.cache.activeLayer.previousSibling ?
                   PS_Cover.cache.activeLayer.previousSibling :
                   PS_Cover.cache.activeLayer.nextSibling ?
                   PS_Cover.cache.activeLayer.nextSibling :
                   null;

        PS_Cover.cache.layerList.removeChild(node || PS_Cover.cache.activeLayer);

        if (next) {
          PS_Cover.openLayer(next);

        } else {
          PS_Cover.cache.layerSettings.innerHTML = PS_Cover.templates.no_layers;
        }

        PS_Cover.cache.layers = PS_Cover.cache.layerList.querySelectorAll('.cover-layer');
        PS_Cover.updateLayerCount();
        PS_Cover.draw();
      }
    },


    // delete all layers
    deleteLayers : function (skipConfirmation) {
      if (skipConfirmation || confirm('You are about to delete all layers.\nDo you want to continue?')) {
        PS_Cover.cache.layerList.innerHTML = '';
        PS_Cover.cache.layerSettings.innerHTML = PS_Cover.templates.no_layers;
        PS_Cover.cache.layers = PS_Cover.cache.layerList.querySelectorAll('.cover-layer');
        PS_Cover.updateLayerCount();
        PS_Cover.draw();
      }
    },


    // updates the layer count
    updateLayerCount : function () {
      PS_Cover.cache.layerTotal.innerHTML = '(' + PS_Cover.cache.layers.length + ')';
    },


    // jumps to the specified layer
    jumpToLayer : function (layer) {
      layer = typeof layer == 'number' ? PS_Cover.cache.layers[layer] : layer;

      if (layer) {
        PS_Cover.cache.coverTools.scrollTop = PS_Cover.cache.layerSettings.offsetTop - 68;
        PS_Cover.cache.layerList.scrollTop = layer.offsetTop - 41;
      }
    },


    // build and call the FontAwesome icon list
    // FontAwesome created by Dave Gandy : http://fontawesome.io/
    FontAwesome : {

      // call the fontawesome icon list to the textarea
      call : function (caller) {
        if (!PS_Cover.FontAwesome.list) {
          PS_Cover.FontAwesome.build();
        }

        var list = document.getElementById('fontawesome-iconlist');

        if (list) {
          list.parentNode.removeChild(list);

        } else {
          PS_Cover.FontAwesome.list.style.left = caller.offsetLeft + caller.getBoundingClientRect().width + 'px';
          PS_Cover.FontAwesome.list.style.top = caller.offsetTop - 60 + 'px';
          caller.parentNode.insertBefore(PS_Cover.FontAwesome.list, caller);
        }
      },


      // build the fontawesome icon list
      build : function () {
        var fa = ['','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','',''],

        list = document.createElement('DIV'),
        html = '',
        i = 0,
        j = fa.length;

        for (; i < j; i++) {
          html += '<a class="fa fa-icon-opt" href="#" onclick="PS_Cover.FontAwesome.insert(this); return false;">' + fa[i] + '</a>';
        }

        list.id = 'fontawesome-iconlist';
        list.className = 'fa-icon-list layer-popup';
        list.innerHTML = html;

        list.addEventListener('mouseleave', function () {
          this.parentNode.removeChild(this);
        });

        PS_Cover.FontAwesome.list = list;
      },


      // insert the icon into the input area
      insert : function (caller) {
        var input = caller.parentsUntil('#layer-settings').querySelector('.cover-input-value');

        input.value += ' ' + caller.innerHTML;
        PS_Cover.updateInput(input);
        PS_Cover.draw();
      }
    },


    // image resources for use in cover images
    Images : {
      
      // imgur API
      imgur : {
        id : 'ed9dcc4c9eba401', // client id
        fullyLoaded : false, // indicates if the search list has been fully loaded
        
        query : '', // current query
        page : 1, // current page
        thumbnail : 't', // thumbnail size (listed below are sizes)
        // s = 90x90
        // b = 160x160
        // t = 160x160
        // m = 320x320
        // l = 640x640
        // h = 1024x1024
        
        
        // set up imgur search
        init : function () {
          PS_Cover.cache.Images.modal.innerHTML =
          '<h1 id="select-image-title">Imgur Search</h1>'+
          '<a class="select-image-button select-image-back" href="#" onclick="PS_Cover.Images.close();PS_Cover.Images.call();return false;"><i class="fa fa-chevron-left"></i> Back</a>'
          + PS_Cover.templates.Images.close +
          '<div id="select-image-container">'+
            '<div id="imgur-search-form"><input type="text" id="imgur-search" oninput="PS_Cover.Images.imgur.search(this.value);" placeholder="Search..."></div>'+
            '<div id="select-image-list" class="clear"></div>'+
          '</div>';

          // add more images while scrolling
          PS_Cover.cache.Images.imageContent = document.getElementById('select-image-container');
          PS_Cover.cache.Images.imageList = document.getElementById('select-image-list');
          PS_Cover.cache.Images.title = document.getElementById('select-image-title');

          PS_Cover.cache.Images.imageContent.addEventListener('scroll', function () {
            if (this.scrollHeight - this.scrollTop === this.clientHeight && !PS_Cover.Images.imgur.fullyLoaded) {
              PS_Cover.Images.imgur.search(PS_Cover.Images.imgur.query, true);
            }
          });
        },
        
        // perform a search on imgur
        search : function (query, nextPage) {
          
          // initial search
          if (!nextPage) {
            
            // abort ongoing timeouts
            if (PS_Cover.Images.imgur.timeout) {
              clearTimeout(PS_Cover.Images.imgur.timeout);
              delete PS_Cover.Images.imgur.timeout;
            }
            
            // abort ongoing searches
            if (PS_Cover.Images.imgur.request) {
              PS_Cover.Images.imgur.request.abort();
              delete PS_Cover.Images.imgur.request;
            }
            
            // setup search data
            PS_Cover.Images.imgur.query = encodeURIComponent(query);
            PS_Cover.Images.imgur.page = 1;
            PS_Cover.cache.Images.imageList.dataset.fullyLoaded = false;
            PS_Cover.Images.imgur.fullyLoaded = false;
            
            PS_Cover.cache.Images.imageList.innerHTML = '<div id="imgur-message">Loading...</div><a class="select-image-action select-image-load" href="#" onclick="PS_Cover.Images.imgur.search(PS_Cover.Images.imgur.query, true); return false;">Load More</a>';
            
            // wait 100ms before sending a request (in case the user is still typing)
            PS_Cover.Images.imgur.timeout = setTimeout(function () {
              PS_Cover.Images.imgur.add();
              delete PS_Cover.Images.imgur.timeout; // add images to the selector
            }, 100);
          }
          
          // load more images for the query if a request isn't currently ongoing
          else if (!PS_Cover.Images.imgur.request) {
            PS_Cover.cache.Images.imageList.lastChild.insertAdjacentHTML('beforebegin', '<div id="imgur-message">Loading...</div>');
            
            PS_Cover.Images.imgur.page++; // increment the page number to load new images
            PS_Cover.Images.imgur.add();
          }
        },
        
        
        // add new images from imgur
        add : function () {
          PS_Cover.Images.imgur.request = get('https://api.imgur.com/3/gallery/search/top/' + PS_Cover.Images.imgur.page + '/?q=' + PS_Cover.Images.imgur.query + '&client_id=' + PS_Cover.Images.imgur.id, function (data) {
            var imgur = JSON.parse(data).data,
                placeholder = document.getElementById('imgur-message'),
                i = 0,
                j = imgur.length,
                k, l,
                str = '';
            
            // removes loading placeholder
            if (placeholder) {
              PS_Cover.cache.Images.imageList.removeChild(placeholder);
            }
            
            // parse the images
            if (j) {
              
              for (; i < j; i++) {

                // add a single image
                if (imgur[i].type && /image/.test(imgur[i].type) && !/gif/.test(imgur[i].type)) {
                  str += '<a class="select-image-option" href="#" onclick="PS_Cover.Images.insert(this.firstChild, true);return false;"><img src="https://i.imgur.com/' + imgur[i].id + PS_Cover.Images.imgur.thumbnail + '.' + imgur[i].type.split('/').pop() + '" alt=""></a>';
                }

                // add multiple images
                else if (imgur[i].images) {
                  for (k = 0, l = imgur[i].images.length; k < l; k++) {
                    if (/image/.test(imgur[i].images[k].type) && !/gif/.test(imgur[i].images[k].type)) {
                      str += '<a class="select-image-option" href="#" onclick="PS_Cover.Images.insert(this.firstChild, true);return false;"><img src="https://i.imgur.com/' + imgur[i].images[k].id + PS_Cover.Images.imgur.thumbnail + '.' + imgur[i].images[k].type.split('/').pop() + '" alt=""></a>'
                    }
                  }
                }
              }

              // add the images to the selector
              PS_Cover.cache.Images.imageList.lastChild.insertAdjacentHTML('beforebegin', str);
            }
            
            // otherwise the list has been fully loaded
            else {
              PS_Cover.cache.Images.imageList.dataset.fullyLoaded = true;
              PS_Cover.Images.imgur.fullyLoaded = true;
              
              // if the page is = to 1, it means no results were found
              // in which case we should notify the user
              if (PS_Cover.Images.imgur.page == 1) {
                PS_Cover.cache.Images.imageList.innerHTML = '<div id="imgur-message">No images could be found for this query. :(</div>';
              }
              
              // otherwise let the user know they viewed all entries for this query
              else if (!document.getElementById('imgur-message')) {
                PS_Cover.cache.Images.imageList.lastChild.insertAdjacentHTML('beforebegin', '<div id="imgur-message">You have viewed all results for this query.</div>');
              }
            }

            // delete the request object so new requests can be sent
            delete PS_Cover.Images.imgur.request;
          });
        }
        
      },
      

      // call and build the image overlay
      call : function (caller) {
        if (!PS_Cover.Images.list) {
          var script = document.createElement('SCRIPT');
          script.src = 'resources/images-list.min.js';
          document.body.appendChild(script);
        }

        if (!document.getElementById('select-image-modal')) {
          var overlay = document.createElement('DIV'),
              modal = document.createElement('DIV'),
              str = '<h1 id="select-image-title">Select a Category</h1>'
                    + PS_Cover.templates.Images.close +
                    '<div id="select-image-container">'+
                      '<div id="select-image-list" class="clear">'+
                        '<p id="select-image-stats"></p>',
              i, len;

          overlay.addEventListener('click', PS_Cover.Images.close);
          overlay.id = 'select-image-overlay';
          overlay.className = 'overlay';
          modal.id = 'select-image-modal';

          if (PS_Cover.Images.list) {
            PS_Cover.Images.total = [0, 0];
            
            // add imgur search
            str += '<a class="select-image-category" href="#" onclick="PS_Cover.Images.imgur.init();return false;" style="background-image:url(resources/images/imgur-logo.png)"><span class="select-image-total">Search</span></a>';

            // add categories
            for (i in PS_Cover.Images.list) {
              len = PS_Cover.Images.list[i].images.length + 1;

              PS_Cover.Images.total[0]++;
              PS_Cover.Images.total[1] += len;

              str += '<a class="select-image-category" href="#" onclick="PS_Cover.Images.get(\'' + i + '\');return false;" style="background-image:url(' + PS_Cover.Images.host + i + '/' + PS_Cover.Images.list[i].thumb + ')"><span class="select-image-total">' + len + ' images</span></a>';
            }
          } else {
            str +=
              '<p class="loading"><i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i></p>'+
              '<p class="loading">Loading images...</p>';
          }

          modal.innerHTML = str + '</div></div>' + PS_Cover.templates.Images.request;

          PS_Cover.cache.Images.overlay = overlay;
          PS_Cover.cache.Images.modal = modal;

          if (caller) {
            PS_Cover.Images.caller = caller;
          }

          document.body.appendChild(PS_Cover.cache.Images.overlay);
          document.body.appendChild(PS_Cover.cache.Images.modal);
          document.body.style.overflow = 'hidden';

          // show image selector stats
          if (PS_Cover.Images.total) {
            document.getElementById('select-image-stats').innerHTML = 'Choose from over <b>' + PS_Cover.Images.total[1] + '</b> images in <b>' + PS_Cover.Images.total[0] + '</b> categories.';
          }

          if (!document.querySelector('.select-image-category')) {
            window.setTimeout(function() {
              PS_Cover.Images.close();
              PS_Cover.Images.call();
            }, 100);
          }
        }

      },


      // get a category's images
      get : function (category) {
        PS_Cover.Images.index = -1;
        PS_Cover.Images.adding = false;
        PS_Cover.Images.catg = category;

        PS_Cover.cache.Images.modal.innerHTML =
        '<h1 id="select-image-title">Select an Image</h1>'+
        '<a class="select-image-button select-image-back" href="#" onclick="PS_Cover.Images.close();PS_Cover.Images.call();return false;"><i class="fa fa-chevron-left"></i> Back</a>'
        + PS_Cover.templates.Images.close +
        '<div id="select-image-container">'+
          '<div id="select-image-list" class="clear">'+
            '<a class="select-image-option" href="#" onclick="PS_Cover.Images.insert(this.firstChild);return false;"><img src="' + PS_Cover.Images.host + category + '/' + PS_Cover.Images.list[category].thumb + '" alt=""></a>'+
            '<a class="select-image-action select-image-load" href="#" onclick="PS_Cover.Images.add(30); return false;">Load More</a>'+
          '</div>'+
        '</div>' +
        PS_Cover.templates.Images.request;

        // add more images while scrolling
        PS_Cover.cache.Images.imageContent = document.getElementById('select-image-container');
        PS_Cover.cache.Images.imageList = document.getElementById('select-image-list');
        PS_Cover.cache.Images.title = document.getElementById('select-image-title');

        PS_Cover.cache.Images.imageContent.addEventListener('scroll', function () {
          if (this.scrollHeight - this.scrollTop === this.clientHeight) {
            PS_Cover.Images.add(30);
          }
        });

        PS_Cover.Images.add(29);
      },


      add : function (amount) {
        if (!PS_Cover.Images.adding && PS_Cover.Images.index < PS_Cover.Images.list[PS_Cover.Images.catg].images.length) {
          PS_Cover.Images.adding = true;

          var max = PS_Cover.Images.list[PS_Cover.Images.catg].images.length + 1,
              min,
              str = '',
              i = 0;

          for (; i < amount; i++) {
            if (PS_Cover.Images.list[PS_Cover.Images.catg].images[++PS_Cover.Images.index]) {
              str += '<a class="select-image-option" href="#" onclick="PS_Cover.Images.insert(this.firstChild);return false;"><img src="' + PS_Cover.Images.host + PS_Cover.Images.catg + '/' + PS_Cover.Images.list[PS_Cover.Images.catg].images[PS_Cover.Images.index].replace(/(\.[^\.]*?)$/, '_tn.jpg') + '" data-ext="' + PS_Cover.Images.list[PS_Cover.Images.catg].images[PS_Cover.Images.index].split('.').pop() + '" alt=""></a>';
            } else {
              break;
            }
          }

          min = PS_Cover.Images.index + 2;

          PS_Cover.cache.Images.title.innerHTML = 'Select an Image (' + (min > max ? max : min) + '/' + max + ')';
          PS_Cover.cache.Images.imageList.lastChild.insertAdjacentHTML('beforebegin', str);

          PS_Cover.Images.adding = false;
        }

        if (!PS_Cover.cache.Images.imageList.dataset.fullyLoaded && PS_Cover.Images.index >= PS_Cover.Images.list[PS_Cover.Images.catg].images.length - 1) {
          PS_Cover.cache.Images.imageList.dataset.fullyLoaded = true;
        }
      },


      // insert the image url into the input
      insert : function (img, imgur) {
        var input = PS_Cover.Images.caller.previousSibling,
            src = img.getAttribute('src'),
            regex = /_tn\.jpg$/;
        
        // convert the imgur image from a thumbnail
        if (imgur) {
          src = src.replace(PS_Cover.Images.imgur.thumbnail + '.', '.');
        }
        
        // convert the image from a thumbnail
        else {
          src = regex.test(src) ? src.replace(regex, '.' + img.dataset.ext) : src;
        }

        PS_Cover.Images.close();
        input.value = src;
        PS_Cover.updateInput(input);
        PS_Cover.draw();
      },


      // close the image selector
      close : function () {
        if (document.getElementById('select-image-modal')) {
          document.body.removeChild(PS_Cover.cache.Images.overlay);
          document.body.removeChild(PS_Cover.cache.Images.modal);
          document.body.style.overflow = '';
        }
      }

    },


    togglePopup : function (caller) {
      var popup = caller.nextSibling;

      if (popup.className == 'layer-popup') {
        popup.style.display = popup.style.display == 'none' ? 'block' : 'none';
        popup.style.left = caller.offsetLeft + caller.getBoundingClientRect().width + 'px';
        popup.style.top = (caller.offsetTop - (popup.getBoundingClientRect().height / 2) + 20) + 'px';

        if (!popup.onmouseleave) {
          popup.onmouseleave = function () {
            this.style.display = 'none';
            PS_Cover.cache.coverTools.style.overflow = '';
          };
        }

        if (!popup.onmouseenter) {
          popup.onmouseenter = function () {
            PS_Cover.cache.coverTools.style.overflow = 'hidden';
          }
        }
      }
    },


    // html templates
    templates : {

      no_layers : '<p id="no-layers">There are no layers to modify. Why not add one by using the buttons above?</p>',

      layer_controls :
      '<div class="layer-controls">'+

        '<span class="layer-flip-box two-buttons">'+
          '<a class="fa fa-level-up" href="#" onclick="PS_Cover.flipLayer(this); return false;"></a>'+
          '<a class="fa fa-level-down fa-rotate-90" href="#" onclick="PS_Cover.flipLayer(this); return false;"></a>'+
        '</span>'+

        '<span class="layer-rotate-box two-buttons">'+
          '<a class="fa fa-rotate-right" onmousedown="PS_Cover.rotateLayer(this, 1);" onmouseup="PS_Cover.rotateLayer(\'stop\');" onmouseleave="PS_Cover.rotateLayer(\'stop\');"></a>'+
          '<a class="fa fa-refresh" href="#" onclick="PS_Cover.rotateLayer(this, 90); return false;"></a>'+
        '</span>'+

        '<span class="arrow-box four-buttons">'+
          '<a class="fa fa-arrow-up" onmousedown="PS_Cover.move(this);" onmouseup="PS_Cover.move(\'stop\');" onmouseleave="PS_Cover.move(\'stop\');"></a>'+
          '<a class="fa fa-arrow-down" onmousedown="PS_Cover.move(this);" onmouseup="PS_Cover.move(\'stop\');" onmouseleave="PS_Cover.move(\'stop\');"></a>'+
          '<a class="fa fa-arrow-left" onmousedown="PS_Cover.move(this);" onmouseup="PS_Cover.move(\'stop\');" onmouseleave="PS_Cover.move(\'stop\');"></a>'+
          '<a class="fa fa-arrow-right" onmousedown="PS_Cover.move(this);" onmouseup="PS_Cover.move(\'stop\');" onmouseleave="PS_Cover.move(\'stop\');"></a>'+
        '</span>'+

        '<span class="layer-move-box two-buttons">'+
          '<a class="fa fa-sort-asc" href="#" onclick="PS_Cover.moveLayer(\'up\', this); return false;"></a>'+
          '<a class="fa fa-sort-desc" href="#" onclick="PS_Cover.moveLayer(\'down\', this); return false;"></a>'+
        '</span>'+

        '<a class="fa fa-times" href="#" onclick="PS_Cover.deleteLayer(); return false;"></a>'+
      '</div>',

      shared_tools :
      '<a href="#" class="fa fa-square tools-icon" onclick="PS_Cover.help(this.className); return false;"></a>'+
      '<select class="cover-input-blend" onchange="PS_Cover.updateInput(this);">'+
        '<option value="">Normal</option>'+
        '<option value="darken">Darken</option>'+
        '<option value="multiply">Multiply</option>'+
        '<option value="color-burn">Color Burn</option>'+
        '<option value="lighter">Lighter</option>'+
        '<option value="lighten">Lighten</option>'+
        '<option value="screen">Screen</option>'+
        '<option value="color-dodge">Color Dodge</option>'+
        '<option value="overlay">Overlay</option>'+
        '<option value="soft-light">Soft Light</option>'+
        '<option value="hard-light">Hard Light</option>'+
        '<option value="difference">Difference</option>'+
        '<option value="exclusion">Exclusion</option>'+
        '<option value="hue">Hue</option>'+
        '<option value="saturation">Saturation</option>'+
        '<option value="color">Color</option>'+
        '<option value="luminosity">Luminosity</option>'+
        '<option value="xor">Xor</option>'+
        '<option value="destination-atop">Destination Atop</option>'+
        '<option value="copy">Copy</option>'+
      '</select>'+

      '<a href="#" class="fa fa-low-vision tools-icon" onclick="PS_Cover.help(this.className); return false;"></a>'+
      '<input class="cover-input-opacity" min="0" max="100" type="number" value="100" oninput="PS_Cover.updateInput(this);">'+

      '<a href="#" class="fa fa-shadow tools-icon" onclick="PS_Cover.help(this.className); return false;">S</a>'+
      '<a href="#" class="layer-button" onclick="PS_Cover.togglePopup(this); return false;" style="text-shadow:2px 2px 1px #999;">S</a>'+
      '<div class="layer-popup" style="display:none;">'+
        '<label for="layer-shadow">Enable Shadow : </label><input id="layer-shadow" class="enable-popup-settings" type="checkbox" onchange="PS_Cover.updateShadow(this);">'+
        '<div class="layer-popup-settings">'+
          '<div class="layer-popup-row static"><label for="layer-shadow-color">Shadow Color : </label><input id="layer-shadow-color" class="color-inpicker" type="text" value="{SHADOW_COLOR}" oninput="PS_Cover.updateShadow(this);"></div>'+
          '<div class="layer-popup-row"><label for="layer-shadow-blur">Shadow Blur : </label><input id="layer-shadow-blur" type="number" min="0" value="{SHADOW_BLUR}" oninput="PS_Cover.updateShadow(this);"></div>'+
          '<div class="layer-popup-row"><label for="layer-shadow-x">Horizontal Offset : </label><input id="layer-shadow-x" type="number" value="{SHADOW_X}" oninput="PS_Cover.updateShadow(this);"></div>'+
          '<div class="layer-popup-row"><label for="layer-shadow-y">Vertical Offset : </label><input id="layer-shadow-y" type="number" value="{SHADOW_Y}" oninput="PS_Cover.updateShadow(this);"></div>'+
          '<div class="layer-popup-row"><label for="layer-shadow-opacity">Shadow Opacity : </label><input id="layer-shadow-opacity" type="number" min="0" max="100" value="{SHADOW_OPACITY}" oninput="PS_Cover.updateShadow(this);"></div>'+
        '</div>'+
      '</div>',

      layer_coords :
      '<div class="layer-coords">'+
        '<a href="#" class="layer-coords-x tools-icon" onclick="PS_Cover.help(this.className); return false;">X</a><input class="cover-input-x" value="0" type="number" oninput="PS_Cover.updateInput(this);">'+
        '<a href="#" class="layer-coords-y tools-icon" onclick="PS_Cover.help(this.className); return false;">Y</a><input class="cover-input-y" value="0" type="number" oninput="PS_Cover.updateInput(this);">'+
      '</div>',

      gradient : {
        editor :
        '<a href="#" class="gradient-button" onclick="PS_Cover.togglePopup(this); return false;"></a>'+
        '<div class="layer-popup" style="display:none;">'+
          '<label for="layer-gradient">Enable Gradient : </label><input id="layer-gradient" class="enable-popup-settings" type="checkbox" onchange="PS_Cover.gradient.update(this);">'+
          '<div class="layer-popup-settings">'+
            '<div class="layer-popup-row">'+
              '<div class="layer-popup-title">Gradient Type</div>'+
              '<select class="gradient-type" onchange="PS_Cover.gradient.change(this);">'+
                '<option value="Linear">Linear</option>'+
                '<option value="Radial">Radial</option>'+
              '</select>'+
            '</div>'+
            '<div class="gradient-offsets clear">'+
              '<div class="layer-popup-title">Start Offsets</div>'+
              '<div class="layer-popup-row"><label>X</label><input class="gradient-x-start" type="number" value="{START-OFFSET-X}" oninput="PS_Cover.gradient.update(this);"></div>'+
              '<div class="layer-popup-row"><label>Y</label><input class="gradient-y-start" type="number" value="{START-OFFSET-Y}" oninput="PS_Cover.gradient.update(this);"></div>'+
              '<div class="layer-popup-title clear">End Offsets</div>'+
              '<div class="layer-popup-row"><label>X</label><input class="gradient-x-end" type="number" value="{END-OFFSET-X}" oninput="PS_Cover.gradient.update(this);"></div>'+
              '<div class="layer-popup-row"><label>Y</label><input class="gradient-y-end" type="number" value="{END-OFFSET-Y}" oninput="PS_Cover.gradient.update(this);"></div>'+
              '<div class="layer-popup-title clear">Radius (Radial Only)</div>'+
              '<div class="layer-popup-row"><label>X</label><input class="gradient-r-start" type="number" value="{START-OFFSET-R}" min="0" oninput="PS_Cover.gradient.update(this);"></div>'+
              '<div class="layer-popup-row"><label>Y</label><input class="gradient-r-end" type="number" value="{END-OFFSET-R}" min="0" oninput="PS_Cover.gradient.update(this);"></div>'+
            '</div>'+
            '<div class="layer-popup-title">Color Stops</div>'+
            '<div class="gradient-stops">{GRADIENTS}</div>'+
            '<p class="center"><a class="button" href="#" onclick="PS_Cover.gradient.addColorStop(this); return false;">Add Color</a></p>'+
          '</div>'+
        '</div>',

        color_stop : '<div class="layer-popup-row color-stop static">'+
          '<input class="layer-gradient-color color-inpicker" type="text" value="{COLOR}" oninput="PS_Cover.gradient.update(this);">'+
          '<input class="layer-gradient-opacity" type="number" value="{OPACITY}" min="0" max="100" oninput="PS_Cover.gradient.update(this);">'+
          '<a class="fa fa-sort-asc color-stop-button" href="#" onclick="PS_Cover.gradient.moveColorStop(this); return false;"></a>'+
          '<a class="fa fa-sort-desc color-stop-button" href="#" onclick="PS_Cover.gradient.moveColorStop(this); return false;"></a>'+
          '<a class="fa fa-times color-stop-button" href="#" onclick="PS_Cover.gradient.deleteColorStop(this); return false;"></a>'+
        '</div>'
      },

      Images : {
        close : '<a class="select-image-button select-image-close" href="#" onclick="PS_Cover.Images.close();return false;"><i class="fa fa-times"></i> Close</a>',
        request : '<div class="select-image-request"><a class="select-image-action" href="https://github.com/SethClydesdale/ps4-cover-generator/wiki/Requesting-Images" target="_blank">Request Images</a></div>'
      }
    },

    // fonts available for text
    fonts : [
      'PlayStation',
      'FontAwesome',
      'Acme',
      'Aldrich',
      'Allerta Stencil',
      'Amatic SC',
      'Antic Slab',
      'Architects Daughter',
      'Arsenal',
      'Arvo',
      'Audiowide',
      'Bangers',
      'Barrio',
      'Bevan',
      'Boogaloo',
      'Chewy',
      'Cinzel',
      'Cinzel Decorative',
      'Clicker Script',
      'Coming Soon',
      'Cookie',
      'Courier New',
      'Covered By Your Grace',
      'Dancing Script',
      'Days One',
      'Exo',
      'Fascinate Inline',
      'Fredericka the Great',
      'Fredoka One',
      'Gloria Hallelujah',
      'Graduate',
      'Great Vibes',
      'Handlee',
      'Homemade Apple',
      'Indie Flower',
      'Kanit',
      'Khand',
      'Lobster',
      'Lobster Two',
      'Love Ya Like A Sister',
      'Luckiest Guy',
      'Macondo',
      'Monda',
      'Monoton',
      'Nothing You Could Do',
      'Open Sans',
      'Orbitron',
      'Permanent Marker',
      'Philosopher',
      'Play',
      'Press Start 2P',
      'Rajdhani',
      'Raleway',
      'Revalia',
      'Righteous',
      'Roboto',
      'Ruda',
      'Russo One',
      'Satisfy',
      'Shadows Into Light',
      'Shrikhand',
      'Space Mono',
      'Special Elite',
      'Spirax',
      'Teko',
      'Tinos',
      'VT323',
      'Vidaloka',
      'Yellowtail'
    ],


    // sets the height / width of the canvas
    setDimensions : function (caller, type) {
      if (caller.value) {
        PS_Cover.canvas[type] = caller.value;

      } else {
        PS_Cover.canvas[type] = type == 'width' ? window.innerWidth : 600;
      }

      PS_Cover.draw();
    },


    // cache the user's progress to localStorage
    saveCoverImage : function () {
      if (window.localStorage && window.JSON) {
        for (var input = PS_Cover.cache.settings, i = 0, j = input.length, settings = ''; i < j; i++) {
          settings += input[i].id + ':' + (input[i].type == 'checkbox' ? input[i].checked : input[i].value) + (i == j - 1 ? '' : ';');
        }

        localStorage.savedCover = JSON.stringify({
          Layers : PS_Cover.cache.layerList.innerHTML,
          Settings : settings
        });
      }
    },


    // return a random hex or rgb color
    randomColor : function (rgb) {
      var hex = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'A', 'B', 'C', 'D', 'E', 'F'],
          len = hex.length,
          str = rgb ? 'rgb(' : '#',
          max = rgb ? 3 : 6,
          i = 0;

      for (; i < max; i++) {
        str += rgb ? Math.floor(Math.random() * 256) + (i == 2 ? '' : ',') : hex[Math.floor(Math.random() * len)];
      }

      if (rgb) {
        str += ')';
      }

      return str;
    },


    // return a helpful alert
    help : function (className) {
      if (className) {
        className = className.replace(/fa | tools-icon/g, '');

        alert({
          'fa-square' : 'Changes the blend mode of this layer.',
          'fa-low-vision' : 'Adjusts the opacity (or visibility) of this layer. (In percentages)',
          'fa-shadow' : 'Adds a shadow to the selected layer and allows you to modify it.',
          'fa-eyedropper' : 'Click the color palette to select a color.',
          'fa-adjust' : 'Click the checkbox to toggle between fill and nofill.',
          'fa-arrows' : 'Adjusts the scale (overall size) of this layer. (In percentages)',
          'fa-arrows-v' : 'Adjusts the height of this layer. (In pixels)',
          'fa-arrows-h' : 'Adjusts the width of this layer. (In pixels)',
          'fa-text-height' : 'Adjusts the font size of this layer. (In pixels)',
          'fa-font' : 'Click the drop down to select a font.',
          'layer-coords-x' : 'Adjusts the horizontal position of this layer. (In pixels)',
          'layer-coords-y' : 'Adjusts the vertical position of this layer. (In pixels)'
        }[className]);

      }
    },


    // PS4 Cover Generator Tutorial
    Tutorial : {

      // intializes the tutorial
      init : function () {
        if (PS_Cover.Tutorial.confirmed || confirm('Would you like to go through the PS4 Cover Generator Tutorial? It is recommended that you do, if this is your first time.')) {
          PS_Cover.Tutorial.confirmed = true;

          // load in the tutorial steps and resources
          if (!PS_Cover.Tutorial.step && !PS_Cover.Tutorial.script) {
            var script = document.createElement('SCRIPT');
            script.src = 'resources/tutorial.min.js';
            document.body.appendChild(script);

            PS_Cover.Tutorial.script = script;
          }

          // create the tutorial overlay, message box, and progress bar
          if (!PS_Cover.Tutorial.overlay) {
            var overlay = document.createElement('DIV'),
                bar = document.createElement('DIV'),
                msg = document.createElement('DIV'),
                frag = document.createDocumentFragment();

            overlay.id = 'tutorial-overlay';
            overlay.className = 'overlay';

            bar.id = 'tutorial-progress';
            bar.innerHTML = '<div id="tutorial-progress-bar"></div>'+
                            '<div id="tutorial-progress-text">0%</div>';

            msg.id = 'tutorial-messages';
            msg.innerHTML = '<div id="tutorial-message-box">'+
                              '<p class="loading"><i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i></p>'+
                              '<p class="loading">Loading tutorial...</p>'+
                            '</div>'+
                            '<div id="tutorial-buttons">'+
                              '<input id="tutorial-button-next" class="button" type="button" value="Next" onclick="PS_Cover.Tutorial.next();">'+
                            '</div>';

            msg.appendChild(bar);
            frag.appendChild(overlay);
            frag.appendChild(msg);
            document.body.appendChild(frag);
            document.body.className += ' inTutorial';

            PS_Cover.Tutorial.overlay = overlay;
            PS_Cover.Tutorial.bar = bar;
            PS_Cover.Tutorial.msg = msg;

            for (var a = document.querySelectorAll('.hidden[id*="tools"]'), i = 0, j = a.length; i < j; i++) {
              a[i].className = '';
            }
          }

          // move onto the first step... or wait until the tuto steps are loaded
          if (PS_Cover.Tutorial.step) {
            PS_Cover.Tutorial.progress = -1;
            PS_Cover.Tutorial.quota = PS_Cover.Tutorial.step.length - 1;
            PS_Cover.Tutorial.next();

          } else {
            window.setTimeout(PS_Cover.Tutorial.init, 100);
          }
        }
      }

    }

  };


  // preload fonts
  for (var i = 0, j = PS_Cover.fonts.length, str = '', fonts = document.createElement('DIV'); i < j; i++) {
    str += '<p style="font-family:' + PS_Cover.fonts[i] + ';">A</p>';
  }

  fonts.id = 'font-preloader';
  fonts.innerHTML = str;
  document.body.appendChild(fonts);


  // inital setup of the canvas
  PS_Cover.ctx = PS_Cover.canvas.getContext('2d');
  PS_Cover.canvas.width = window.innerWidth;
  PS_Cover.canvas.height = 600;

  document.body.className += PS_Cover.isPS4 ? ' isPS4' : ' notPS4';


  // open the cover in a new window so the user can take a screenshot / download the image
  document.getElementById('download-ps4-cover').addEventListener('click', function () {
    try {
      var image = PS_Cover.canvas.toDataURL('image/png');

      window.open().document.write(
        '<style>'+
          'body{padding:0;margin:0;background:#000;display:flex;min-height:100vh;flex-direction:column;' + ( PS_Cover.isPS4 ? 'cursor:none' : '' ) + '}'+
          '#creation-info{color:#CCC;font-size:16px;font-family:Arial;padding:6px;}'+
          '#cover-result{flex:1 0 auto;text-align:center;}'+
        '</style>'+

        '<div id="cover-result">' + (PS_Cover.isPS4 ? '' : '<a href="' + image + '" download>') + '<img src="' + image + '" alt="PS4 Cover">' + (PS_Cover.isPS4 ? '' : '</a>') + '</div>'+

        '<div id="creation-info">'+
          '<p>'+
            (
              PS_Cover.isPS4 ?
              'Press the SHARE button and choose SCREENSHOT to SAVE your cover image.' :
              'Click your cover image to save it to your computer.'
            )+
          '</p>'+
          '<p>Created with PS4 Cover Generator</p>'+
          '<p>sethclydesdale.github.io/ps4-cover-generator/</p>'+
        '</div>'
      );
      
    } catch (error) {
      window.open().document.write(
        '<p style="color:red;">' + error + '</p>'+
        '<p>Please <a href="https://github.com/SethClydesdale/ps4-cover-generator/wiki/Submitting-Suggestions-and-Feedback">contact the developer</a> for technical support.</p>'
      );
    }

  });


  // increase / decrease canvas width and redraw when the window is resized
  window.addEventListener('resize', function () {
    if (!document.getElementById('cover-width').value) {
      PS_Cover.canvas.width = window.innerWidth;
      PS_Cover.draw();
    }
  });

  // changes the width of the canvas on input
  document.getElementById('cover-width').addEventListener('input', function () {
    PS_Cover.setDimensions(this, 'width');
  });

  // changes the height of the canvas on input
  document.getElementById('cover-height').addEventListener('input', function () {
    PS_Cover.setDimensions(this, 'height');
  });

  document.getElementById('cover-preset').addEventListener('change', function () {
    PS_Cover.loadPreset(this);
    this.selectedIndex = 0;
  });


  // cover tool event handlers
  var tools = document.getElementById('cover-tools-box');

  // hide body overflow while using the tools
  tools.addEventListener('mouseover', function () {
    if (document.body.style.overflow != 'hidden') {
      document.body.style.overflow = 'hidden';
    }
  });

  // show body overflow when exiting the tools
  tools.addEventListener('mouseout', function () {
    if (document.body.style.overflow == 'hidden' && !document.getElementById('select-image-modal')) {
      document.body.style.overflow = '';
    }
  });


  // toggle demo profile
  document.getElementById('cover-show-profile').addEventListener('change', function () {
    document.getElementById('ps4-demo-profile').className = this.checked ? '' : 'hidden';
  });


  // toggle full screen
  document.getElementById('cover-go-fullscreen').addEventListener('change', function () {
    for (var a = document.querySelectorAll('body, #cover-image-box, #cover-tools-box, #cover-tools-title'), i = 0, j = a.length; i < j; i++) {
      a[i].dataset.fullscreen = this.checked;
    }
  });


  // toggle toolbox
  document.getElementById('cover-tools-title').addEventListener('click', function (e) {
    var tools = document.getElementById('cover-tools-box'),
        fullscreen = document.getElementById('cover-go-fullscreen');

    if (this.className == 'hidden') {
      this.className = '';
      tools.className = '';

    } else {
      this.className = 'hidden';
      tools.className = 'hidden';

      if (fullscreen.checked) {
        fullscreen.click();
      }
    }

    e.preventDefault();
  });


  // toggle layer list
  document.getElementById('layer-list-title').addEventListener('click', function () {
    var parent = this.parentNode;
    parent.className = parent.className == 'hidden' ? '' : 'hidden';
  });


  // draw to the canvas when the color value changes
  ColorInpicker.callback = function (input) {
    if (/cover-input-|cover-input-/.test(ColorInpicker.input.className)) {
      PS_Cover.updateInput(ColorInpicker.input);

    } else if (/layer-shadow/.test(ColorInpicker.input.id)) {
      PS_Cover.updateShadow(ColorInpicker.input);

    } else if (/layer-gradient-color/.test(ColorInpicker.input.className)) {
      PS_Cover.gradient.update(ColorInpicker.input);

    } else {
      PS_Cover.draw();
    }
  };

  // draw to the canvas when the number value changes
  if (PS_Cover.isPS4) {
    Inumber.callback = function (input) {
      if (/cover-(?:width|height)/.test(input.id)) {
        PS_Cover.setDimensions(input, input.id.split('-').pop());

      } else if (/layer-shadow/.test(input.id)) {
        PS_Cover.updateShadow(input);

      } else if (/gradient/.test(input.className)) {
        PS_Cover.gradient.update(input);

      } else {
        PS_Cover.updateInput(input);
        PS_Cover.draw();
      }
    };
  }


  // auto-saves the canvas every 15 seconds
  window.setInterval(function() {
    if (PS_Cover.cache.autoSave.checked) {
      PS_Cover.cache.saveCover.click();
    }
  }, 15000);

  // manual save button
  PS_Cover.cache.saveCover.addEventListener('click', function (e) {
    if (this.innerHTML == '<i class="fa fa-save"></i> Save') {
      that = this;
      that.innerHTML += 'd!';
      that.setAttribute('style', 'opacity:0.6;pointer-events:none;');

      PS_Cover.saveCoverImage();
      PS_Cover.draw();

      window.setTimeout(function () {
        that.innerHTML = that.innerHTML.replace('d!', '');
        that.setAttribute('style', '');
      }, 3000);
    }

    e.preventDefault();
  });

  // load the user's progress from last time
  if (window.JSON && window.localStorage && localStorage.savedCover) {
    var savedCover = JSON.parse(localStorage.savedCover);

    // add the layers to the layer list and update the node caches
    if (savedCover.Layers) {
      PS_Cover.cache.layerList.innerHTML = savedCover.Layers;
      PS_Cover.cache.layers = document.querySelectorAll('.cover-layer');
      PS_Cover.cache.activeLayer = document.querySelector('.activeLayer');

      // update the layer count and open the active layer
      PS_Cover.updateLayerCount();
      PS_Cover.openLayer(PS_Cover.cache.activeLayer);

    } else {
      PS_Cover.loadPreset(null, true);
    }

    // apply saved canvas settings
    if (savedCover.Settings) {
      for (var settings = savedCover.Settings.split(';'), i = 0, j = settings.length, prop, input; i < j; i++) {
        prop = settings[i].split(':');
        input = document.getElementById(prop[0]);

        if ((prop[1] == 'true' && !input.checked) || (prop[1] == 'false' && input.checked)) {
          input.click();

        } else {
          input.value = prop[1];

          if (/cover-(?:width|height)/.test(prop[0])) {
            PS_Cover.setDimensions(input, prop[0].split('-').pop());
          }
        }
      }
    }

    PS_Cover.draw();

  } else { // otherwise create an example
    PS_Cover.loadPreset(null, true);
  }

  replaceCheckboxes(); // replace checkboxes w/custom ones

  // create color pickers
  ColorInpicker.init(document.getElementById('cover-settings'), {
    hide : true
  });

  // auto initiate the tutorial if the page hash is #tutorial
  if (window.location.hash == '#tutorial') {
    PS_Cover.Tutorial.confirmed = true;
    PS_Cover.Tutorial.init();
  }
}(window, document));

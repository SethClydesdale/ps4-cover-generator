(function () {
  window.PS_Cover = {
    isPS4 : /PlayStation 4/.test(navigator.userAgent),

    canvas : document.getElementById('ps4-cover-photo'),

    cache : {
      bgColor : document.getElementById('cover-bg-color'),
      coverTools : document.getElementById('cover-tools'),
      coverLayers : document.getElementById('cover-layers'),
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
      for (var i = PS_Cover.cache.layers.length - 1, img, input; i > -1; i--) {
        if (/image-layer/.test(PS_Cover.cache.layers[i].className)) {
          input = PS_Cover.cache.layers[i].querySelector('.main-input');

          img = input.previousSibling;
          img.crossOrigin = 'anonymous';

          if (!img.dataset.last || img.dataset.last != input.value) {
            img.dataset.last = input.value;
            img.src = input.value;
          }

          if (input.style.borderColor) {
            input.style.borderColor = '';
          }

          PS_Cover.loadImage(img, input.dataset.x, input.dataset.y, input, {
            scale : +input.dataset.scale / 100,
            rotate : +input.dataset.rotate,
            opacity : +input.dataset.opacity / 100
          });

        } else if (/text-layer/.test(PS_Cover.cache.layers[i].className)) {
          input = PS_Cover.cache.layers[i].querySelector('.main-input');

          PS_Cover.transform({
            rotate : +input.dataset.rotate,
            opacity : +input.dataset.opacity / 100

          }, function () {
            var fill = input.dataset.nofill == 'true' ? 'stroke' : 'fill';

            PS_Cover.ctx.font = input.dataset.size + 'px ' + input.dataset.font;
            PS_Cover.ctx[fill + 'Style'] = input.dataset.color;
            PS_Cover.ctx[fill + 'Text'](input.value, input.dataset.x, input.dataset.y);
          });

        } else if (/shape-layer/.test(PS_Cover.cache.layers[i].className)) {
          input = PS_Cover.cache.layers[i].querySelector('.main-input');

          PS_Cover.transform({
            scale : +input.dataset.scale / 100,
            rotate : +input.dataset.rotate,
            opacity : +input.dataset.opacity / 100

          }, function () {
            var fill = input.dataset.nofill == 'true' ? 'stroke' : 'fill',
                thumb = input.previousSibling.getContext('2d');

            PS_Cover.drawShape(input.value, {
              style : fill,
              color : input.dataset.color,
              x : +input.dataset.x,
              y : +input.dataset.y,
              height : +input.dataset.height,
              width : +input.dataset.width
            }, PS_Cover.ctx);

            thumb.clearRect(0, 0, 40, 40);
            PS_Cover.drawShape(input.value, {
              style : fill,
              color : input.dataset.color,
              x : /tri|arc/.test(input.value) ? 20 : 5,
              y : input.value == 'arc' ? 20 : 5,
              height : 30,
              width : 30
            }, thumb);

          });
        }

      }

      PS_Cover.syncLayerList();
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
    loadImage : function (img, x, y, input, transform) {
      if (img.complete) {
        PS_Cover.transform({
          scale : transform.scale,
          rotate : transform.rotate,
          opacity : transform.opacity

        }, function () {
          PS_Cover.ctx.drawImage(img, x, y);
        });

      } else if (!img.onload) {
        img.onload = function () {
          PS_Cover.transform({
            scale : transform.scale,
            rotate : transform.rotate,
            opacity : transform.opacity

          }, function () {
            PS_Cover.ctx.drawImage(img, x, y);
          });

          // onload delays the addition of this layer
          // so draw again to update the layer position of the image
          PS_Cover.draw();
        };
      }

      // if an image URL is invalid or cannot load, make the input border red
      if (!img.onerror) {
        img.onerror = function () {
          if (input.value) {
            input.style.borderColor = '#F00';
          }
        };
      }
    },


    // update the input of elements and draw the new value to the canvas
    updateInput : function (caller) {
      if (caller != PS_Cover.cache.updateInput.lastCaller) {
        PS_Cover.cache.updateInput = {
          lastCaller : caller,
          type : caller.className.replace(/cover-input-/g, ''),
          input : caller.parentsUntil('.cover-layer').querySelector('.main-input'),
          fa : caller.parentNode.querySelector('.fa-caller')
        };
      }

      var selected = caller.tagName == 'SELECT' ? caller.options[caller.selectedIndex] : null,
          value = caller[caller.type == 'checkbox' ? 'checked' : 'value'];

      if (PS_Cover.cache.updateInput.type == 'font' && !selected.dataset.loaded) {
        PS_Cover.cache.updateInput.input.style.fontFamily = value;
        PS_Cover.cache.updateInput.input.dataset[PS_Cover.cache.updateInput.type] = value;

        FontDetect.onFontLoaded(value, function () {
          selected.dataset.loaded = true;
          PS_Cover.draw();
        }, null, { msTimeout : 3000 });

      } else {
        if (PS_Cover.cache.updateInput.type == 'font') {
          PS_Cover.cache.updateInput.input.style.fontFamily = value;
        }

        PS_Cover.cache.updateInput.input.dataset[PS_Cover.cache.updateInput.type] = value;
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


    // adjusts the scale of a single canvas element
    transform : function (config, callback) {
      PS_Cover.ctx.save();

      if (typeof config.opacity != 'undefined') {
        PS_Cover.ctx.globalAlpha = config.opacity;

      }

      if (config.scale) {
        PS_Cover.ctx.scale(config.scale, config.scale);
      }

      if (config.rotate) {
        PS_Cover.ctx.translate(PS_Cover.canvas.width / 2, PS_Cover.canvas.height / 2);
        PS_Cover.ctx.rotate(config.rotate * Math.PI / 180);
        PS_Cover.ctx.translate(-PS_Cover.canvas.width / 2, -PS_Cover.canvas.height / 2);
      }

      callback();
      PS_Cover.ctx.restore();
    },


    // rotate the specified layer
    rotateLayer : function (caller, amount) {

      if (!PS_Cover.rotating && caller != 'stop' && amount == 1) {
        PS_Cover.rotating = true;

        var input = caller.parentsUntil('.cover-layer').querySelector('.main-input');

        PS_Cover.rotator = window.setInterval(function () {
          var total = +input.dataset.rotate + amount;
          input.dataset.rotate = total > 360 ? 0 : total;
          PS_Cover.draw();
        }, 10);

      } else if (PS_Cover.rotating && caller == 'stop') {
        PS_Cover.rotating = false;
        window.clearInterval(PS_Cover.rotator);

      } else if (amount == 90) {
        var input = caller.parentsUntil('.cover-layer').querySelector('.main-input'),
            total = +input.dataset.rotate;

        if (total < 90) {
          total = 90;
        } else if (total < 180) {
          total = 180;
        } else if (total < 270) {
          total = 270;
        } else if (total < 360 || total > 360) {
          total = 0;
        }

        input.dataset.rotate = total;
        PS_Cover.draw();
      }
    },


    // moves the image, text, etc.. in the specified direction
    move : function (caller) {
      if (!PS_Cover.moving && caller != 'stop') {
        PS_Cover.moving = true;

        var row = caller.parentsUntil('.cover-layer'),
            input = row.querySelector('.main-input'),
            raw = {
              x : row.querySelector('.cover-input-x'),
              y : row.querySelector('.cover-input-y')
            },
            coord = /up|down/.test(caller.className) ? 'y' : 'x',
            amount = /up|left/.test(caller.className) ? -1 : +1;

        PS_Cover.mover = window.setInterval(function () {
          input.dataset[coord] = +input.dataset[coord] + amount;
          raw[coord].value = input.dataset[coord];
          PS_Cover.draw();
        }, 1);

      } else if (PS_Cover.moving && caller == 'stop') {
        PS_Cover.moving = false;
        window.clearInterval(PS_Cover.mover);
      }
    },


    // move layers up / down
    moveLayer : function (where, caller) {
      var row = caller.parentsUntil('.cover-layer');

      switch (where.toLowerCase()) {
        case 'up' :
          PS_Cover.cache.coverLayers.insertBefore(row, row.previousSibling);
          break;

        case 'down' :
          var next = row.nextSibling.nextSibling;
          next ? PS_Cover.cache.coverLayers.insertBefore(row, next) : PS_Cover.cache.coverLayers.appendChild(row);
          break;
      }

      PS_Cover.cache.layers = PS_Cover.cache.coverLayers.querySelectorAll('.cover-layer');
      PS_Cover.jumpToLayer(row);
      PS_Cover.draw();
    },


    // delete the specified layer
    deleteLayer : function (caller, skipConfirmation) {
      if (skipConfirmation || confirm('You are about to delete this layer.\nDo you want to continue?')) {
        var layer = caller.parentsUntil('.cover-layer');
        layer.parentNode.removeChild(layer);

        PS_Cover.cache.layers = PS_Cover.cache.coverLayers.querySelectorAll('.cover-layer');
        PS_Cover.draw();
      }
    },


    // function for adding new layers
    add : function (type, settings) {
      settings = settings ? settings : {};

      var firstChild = PS_Cover.cache.coverLayers.firstChild,
          row = document.createElement('DIV'),
          html = '',
          color,
          cleanName,
          opts,
          i,
          j,
          loaded,
          selected;

      row.className = 'tools-row cover-layer';
      row.dataset.hidden = true;

      html = '<div class="cover-layer-type"><i class="fa fa-' + {
        text : 'font',
        image : 'file-image-o',
        shape : 'circle'
      }[type] + '"></i> ' + type.toUpperCase() + '</div>';

      coords = PS_Cover.templates.layer_coords
      .replace('value="0"', 'value="' + (settings.x || '0') + '"')
      .replace('value="0"', 'value="' + (settings.y || '0') + '"');

      // adds a text layer
      if (type == 'text') {
        color = PS_Cover.randomColor();

        for (opts = '', i = 0, j = PS_Cover.fonts.length; i < j; i++) {
          cleanName = PS_Cover.fonts[i].replace(/:loaded|:selected/g, '');
          loaded = false;
          selected = false;

          // set loaded attr
          if (/:loaded/.test(PS_Cover.fonts[i])) {
            loaded = true;
          }

          // set selected attr
          if (/:selected/.test(PS_Cover.fonts[i])) {
            selected = true;
          }

          opts += '<option value="' + cleanName + '"' + ( loaded ? ' data-loaded="true"' : '' ) + ( selected ? ' selected' : '' ) + '>' + cleanName + '</option>';
        }


        row.className += ' text-layer';
        html +=
        '<div class="main-layer-input">'+
          '<input class="main-input cover-text med" type="text" value="' + (settings.value || '') + '" data-nofill="' + ( settings.nofill ? true : false ) + '" data-size="' + ( settings.size || '40' ) + '" data-opacity="' + ( settings.opacity || '100' ) + '" data-color="' + ( settings.color || color ) + '" data-font="PlayStation" data-rotate="' + ( settings.rotate || '0' ) + '" data-x="' + ( settings.x || '0' ) + '" data-y="' + ( settings.y || '40' ) + '" oninput="PS_Cover.draw();">'+
          '<a href="#" class="fa fa-eyedropper tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-color color-inpicker" type="text" value="' + ( settings.color || color ) + '" oninput="PS_Cover.updateInput(this);">'+
          '<a href="#" class="fa fa-adjust tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-nofill" type="checkbox" onchange="PS_Cover.updateInput(this);" ' + ( settings.nofill ? 'checked' : '' ) + '>'+
          PS_Cover.templates.layer_controls+
        '</div>'+
        '<div class="cover-input-tools clear">'+
          '<a href="#" class="fa fa-low-vision tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-opacity" min="0" max="100" type="number" value="' + ( settings.opacity || '100' ) + '" oninput="PS_Cover.updateInput(this);">'+
          '<a href="#" class="fa fa-text-height tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-size" type="number" value="' + ( settings.size || '40' ) + '" oninput="PS_Cover.updateInput(this);" min="0">'+
          '<a href="#" class="fa fa-font tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><a class="fa fa-smile-o fa-caller layer-button" href="#" onclick="PS_Cover.FontAwesome.call(this);return false;" style="display:none;"></a>'+
          '<select class="cover-input-font" onchange="PS_Cover.updateInput(this);">'+
            opts+
          '</select>'+
          coords +
        '</div>';
      }


      // adds an image layer
      if (type == 'image') {
        row.className += ' image-layer';
        html +=
        '<div class="main-layer-input">'+
          '<img class="layer-thumb" src="" alt="">'+
          '<input class="main-input cover-image med" type="text" value="' + ( settings.value || '' ) + '" data-scale="' + ( settings.size || '100' ) + '" data-rotate="' + ( settings.rotate || '0' ) + '" data-opacity="' + ( settings.opacity || '100' ) + '" data-x="' + ( settings.x || '0' ) + '" data-y="' + ( settings.y || '0' ) + '" oninput="PS_Cover.draw();">'+
          '<a class="fa fa-search image-caller layer-button" href="#" onclick="PS_Cover.Images.call(this);return false;"></a>'+
          PS_Cover.templates.layer_controls+
        '</div>'+
        '<div class="cover-input-tools clear">'+
          '<a href="#" class="fa fa-low-vision tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-opacity" min="0" max="100" type="number" value="' + ( settings.opacity || '100' ) + '" oninput="PS_Cover.updateInput(this);">'+
          '<a href="#" class="fa fa-arrows tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-scale" type="number" value="' + ( settings.size || '100' ) + '" oninput="PS_Cover.updateInput(this);" min="0">'+
          coords +
        '</div>';

        if (!settings.value) {
          PS_Cover.Images.call(row.querySelector('.image-caller'));
        }
      }


      // adds a shape layer
      if (type == 'shape') {
        color = PS_Cover.randomColor();

        row.className += ' shape-layer';
        html +=
        '<div class="main-layer-input">'+
          '<canvas class="layer-thumb" width="40" height="40"></canvas>'+
          '<select class="main-input cover-shape" data-height="' + (settings.height || '50') + '" data-width="' + (settings.width || '50') + '" data-color="' + ( settings.color || color ) + '" data-opacity="' + ( settings.opacity || '100' ) + '" data-nofill="' + ( settings.nofill ? true : false ) + '" data-scale="' + ( settings.size || '100' ) + '" data-rotate="' + ( settings.rotate || '0' ) + '" data-x="' + ( settings.x || '0' ) + '" data-y="' + ( settings.y || '0' ) + '" onchange="PS_Cover.draw();">'+
            '<option value="rect" selected>Rectangle</option>'+
            '<option value="tri">Triangle</option>'+
            '<option value="arc">Circle</option>'+
          '</select>'+
          '<a href="#" class="fa fa-eyedropper tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-color color-inpicker" type="text" value="' + ( settings.color || color ) + '" oninput="PS_Cover.updateInput(this);">'+
          '<a href="#" class="fa fa-adjust tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-nofill" type="checkbox" onchange="PS_Cover.updateInput(this);" ' + ( settings.nofill ? 'checked' : '' ) + '>'+
          PS_Cover.templates.layer_controls+
        '</div>'+
        '<div class="cover-input-tools clear">'+
          '<a href="#" class="fa fa-low-vision tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-opacity" min="0" max="100" type="number" value="' + ( settings.opacity || '100' ) + '" oninput="PS_Cover.updateInput(this);">'+
          '<a href="#" class="fa fa-arrows tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-scale" type="number" value="' + ( settings.size || '100' ) + '" oninput="PS_Cover.updateInput(this);" min="0">'+
          '<a href="#" class="fa fa-arrows-h tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-width" type="number" value="' + ( settings.width || '50' ) + '" oninput="PS_Cover.updateInput(this);" min="0">'+
          '<a href="#" class="fa fa-arrows-v tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-height" type="number" value="' + ( settings.height || '50' ) + '" oninput="PS_Cover.updateInput(this);" min="0">'+
          coords +
        '</div>';
      }


      // add the new layer to the layers list
      row.innerHTML = html + '<i class="fa fa-file cover-layer-placeholder"></i>';
      firstChild ? PS_Cover.cache.coverLayers.insertBefore(row, firstChild) : PS_Cover.cache.coverLayers.appendChild(row);
      PS_Cover.cache.layers = PS_Cover.cache.coverLayers.querySelectorAll('.cover-layer');

      // scroll directly to the top of the new layer
      if (!settings.noScroll) {
        PS_Cover.jumpToLayer(row);
      }

      ColorInpicker.init({ hide : true }); // create color pickers
      if (PS_Cover.isPS4) Inumber.init(); // create number input arrows
      replaceCheckboxes(); // replace checkboxes w/custom ones
      PS_Cover.draw();
    },


    // delete all layers
    deleteLayers : function (skipConfirmation) {
      if (skipConfirmation || confirm('You are about to delete all layers.\nDo you want to continue?')) {
        for (var i = 0, j = PS_Cover.cache.layers.length; i < j; i++) {
          PS_Cover.cache.coverLayers.removeChild(PS_Cover.cache.layers[i]);
        }

        PS_Cover.cache.layers = PS_Cover.cache.coverLayers.querySelectorAll('.cover-layer');
        PS_Cover.draw();
      }
    },


    // jumps to the specified layer
    jumpToLayer : function (layer) {
      layer = typeof layer == 'number' ? PS_Cover.cache.layers[layer] : layer;

      if (layer) {
        PS_Cover.cache.coverTools.scrollTop = layer.offsetTop - 3;
      }
    },


    // sync the layer list w/the layers on the canvas
    syncLayerList : function () {
      var layerList = '',
          thumb,
          val;

      if (PS_Cover.cache.syncLayerListLoop) {
        PS_Cover.cache.syncLayerListLoop.kill();
      }

      PS_Cover.cache.syncLayerListLoop = new ForAll (PS_Cover.cache.layers, function (layer) {
        thumb = layer.querySelector('.layer-thumb');
        val = layer.querySelector('.main-input');

        thumb = !thumb ? '<i class="layer-thumb fa fa-font"></i>' :
                '<img class="layer-thumb" src="' + (thumb.tagName == 'CANVAS' ? thumb.toDataURL('image/png') : thumb.src) + '" alt="">';

        val = val.tagName == 'SELECT' ? val.options[val.selectedIndex].innerHTML :
              /cover-image/.test(val.className) ? val.value.replace(/https:\/\/i\.imgur\.com\//, '') :
              val.value;

        layerList +=
        '<li class="' + layer.className.replace(/tools-row|cover-layer/g, '') + '-list">'+
          '<a href="#" onclick="PS_Cover.jumpToLayer(' + this.index + '); return false;">'+
            thumb+
            val+
          '</a>'+
        '</li>';

      }).done(function () {
        delete PS_Cover.cache.syncLayerListLoop;

        if (PS_Cover.cache.layerList.innerHTML != layerList) {
          PS_Cover.cache.layerList.innerHTML = layerList;

          if ('(' + PS_Cover.cache.layers.length + ')' != PS_Cover.cache.layerTotal.innerHTML) {
            PS_Cover.cache.layerTotal.innerHTML = '(' + PS_Cover.cache.layers.length + ')';
          }
        }
      });
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
          var offset = caller.getBoundingClientRect();

          PS_Cover.FontAwesome.list.style.marginTop = '-' + (160 + offset.height) + 'px';
          PS_Cover.FontAwesome.list.style.left = offset.left + 'px';
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
        list.className = 'fa-icon-list';
        list.innerHTML = html;

        list.addEventListener('mouseleave', function () {
          this.parentNode.removeChild(this);
        });

        PS_Cover.FontAwesome.list = list;
      },


      // insert the icon into the input area
      insert : function (caller) {
        caller.parentsUntil('.cover-layer').querySelector('.main-input').value += ' ' + caller.innerHTML;
        PS_Cover.draw();
      }
    },


    // image resources for use in cover images
    Images : {

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

            for (i in PS_Cover.Images.list) {
              len = PS_Cover.Images.list[i].images.length + 1;

              PS_Cover.Images.total[0]++;
              PS_Cover.Images.total[1] += len;

              str += '<a class="select-image-category" href="#" onclick="PS_Cover.Images.get(\'' + i + '\');return false;" style="background-image:url(' + ( /^http/.test(PS_Cover.Images.list[i].thumb) ? '' : PS_Cover.Images.host ) + PS_Cover.Images.list[i].thumb + ')"><span class="select-image-total">' + len + ' images</span></a>';
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
            '<a class="select-image-option" data-hidden="true" href="#" onclick="PS_Cover.Images.insert(this.firstChild.src);return false;"><img src="' + (/^http/.test(PS_Cover.Images.list[category].thumb) ? '' : PS_Cover.Images.host) + PS_Cover.Images.list[category].thumb + '">' + PS_Cover.templates.Images.placeholder + '</a>'+
            '<a class="select-image-action select-image-load" href="#" onclick="PS_Cover.Images.add(30); return false;">Load More</a>'+
          '</div>'+
        '</div>' +
        PS_Cover.templates.Images.request;

        // fade images in / out and add more images while scrolling
        PS_Cover.cache.Images.imageContent = document.getElementById('select-image-container');
        PS_Cover.cache.Images.imageList = document.getElementById('select-image-list');
        PS_Cover.cache.Images.title = document.getElementById('select-image-title');

        PS_Cover.cache.Images.imageContent.addEventListener('scroll', function () {
          PS_Cover.fadeInOut();

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
              str += '<a class="select-image-option" data-hidden="true" href="#" onclick="PS_Cover.Images.insert(this.firstChild.src);return false;"><img src="' + (/^http/.test(PS_Cover.Images.list[PS_Cover.Images.catg].images[PS_Cover.Images.index]) ? PS_Cover.Images.list[PS_Cover.Images.catg].images[PS_Cover.Images.index] : PS_Cover.Images.host + PS_Cover.Images.list[PS_Cover.Images.catg].images[PS_Cover.Images.index].replace(/(\.[^\.]*?)$/, 'm$1')) + '">' + PS_Cover.templates.Images.placeholder + '</a>';
            } else {
              break;
            }
          }

          min = PS_Cover.Images.index + 2;

          PS_Cover.cache.Images.title.innerHTML = 'Select an Image (' + (min > max ? max : min) + '/' + max + ')';
          PS_Cover.cache.Images.imageList.lastChild.insertAdjacentHTML('beforebegin', str);

          PS_Cover.cache.Images.images = PS_Cover.cache.Images.imageList.childNodes;
          PS_Cover.fadeInOut();
          PS_Cover.Images.adding = false;
        }

        if (!PS_Cover.cache.Images.imageList.dataset.fullyLoaded && PS_Cover.Images.index >= PS_Cover.Images.list[PS_Cover.Images.catg].images.length - 1) {
          PS_Cover.cache.Images.imageList.dataset.fullyLoaded = true;
        }
      },


      // insert the image url into the input
      insert : function (img) {
        PS_Cover.Images.close();
        PS_Cover.Images.caller.previousSibling.value = /imgur/.test(img) ? img.replace(/m(\.[^\.]*?)$/, '$1') : img;
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


    // html templates
    templates : {
      layer_controls :
      '<div class="layer-controls">'+

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

        '<a class="fa fa-times" href="#" onclick="PS_Cover.deleteLayer(this); return false;"></a>'+
      '</div>',

      layer_coords :
      '<div class="layer-coords">'+
        '<a href="#" class="layer-coords-x tools-icon" onclick="PS_Cover.help(this.className); return false;">X</a><input class="cover-input-x" value="0" type="number" oninput="PS_Cover.updateInput(this);">'+
        '<a href="#" class="layer-coords-y tools-icon" onclick="PS_Cover.help(this.className); return false;">Y</a><input class="cover-input-y" value="0" type="number" oninput="PS_Cover.updateInput(this);">'+
      '</div>',

      Images : {
        close : '<a class="select-image-button select-image-close" href="#" onclick="PS_Cover.Images.close();return false;"><i class="fa fa-times"></i> Close</a>',
        request : '<div class="select-image-request"><a class="select-image-action" href="https://github.com/SethClydesdale/ps4-cover-generator/wiki/Requesting-Images" target="_blank">Request Images</a></div>',
        placeholder : '<i class="fa fa-image select-image-placeholder"></i>',
      }
    },

    // fonts available for text
    fonts : [
      'PlayStation:loaded:selected',
      'Courier New:loaded',
      'FontAwesome:loaded',
      'Revalia',
      'Roboto',
      'Macondo',
      'Spirax',
      'Open Sans',
      'Space Mono',
      'Raleway',
      'Indie Flower',
      'Arvo',
      'Lobster',
      'Gloria Hallelujah',
      'Amatic SC',
      'Play',
      'Dancing Script',
      'Shadows Into Light',
      'Acme',
      'Exo',
      'Orbitron',
      'Architects Daughter',
      'Lobster Two',
      'Cinzel',
      'Satisfy',
      'Russo One',
      'Monda',
      'Kanit',
      'Righteous',
      'Permanent Marker',
      'Cookie',
      'Tinos',
      'VT323',
      'Shrikhand',
      'Rajdhani',
      'Arsenal',
      'Yellowtail',
      'Teko',
      'Philosopher',
      'Boogaloo',
      'Coming Soon',
      'Handlee',
      'Bevan',
      'Days One',
      'Antic Slab',
      'Ruda',
      'Vidaloka',
      'Khand',
      'Chewy',
      'Great Vibes',
      'Covered By Your Grace',
      'Fascinate Inline',
      'Audiowide',
      'Fredoka One',
      'Bangers',
      'Nothing You Could Do',
      'Luckiest Guy',
      'Homemade Apple',
      'Special Elite',
      'Clicker Script',
      'Aldrich',
      'Monoton',
      'Barrio',
      'Press Start 2P',
      'Fredericka the Great',
      'Cinzel Decorative',
      'Graduate',
      'Love Ya Like A Sister',
      'Allerta Stencil'
    ],


    // show / hide elements as the user scrolls
    fadeInOut : function (layer) {
      if (PS_Cover.fadeInOutLoop) {
        PS_Cover.fadeInOutLoop.kill();
      }

      var node = layer ? PS_Cover.cache.coverTools : PS_Cover.cache.Images.imageContent;

      PS_Cover.fadeInOutLoop = new ForAll (layer ? PS_Cover.cache.layers : PS_Cover.cache.Images.images, function (that) {
        var rect = that.getBoundingClientRect(),
            visible = rect.top >= 0 && rect.left >= 0 && rect.bottom <= ((window.innerHeight || document.documentElement.clientHeight) + rect.height) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);

        if (visible && that.dataset.hidden == 'true') {
          that.dataset.hidden = false;

        } else if (!visible && that.dataset.hidden == 'false') {
          that.dataset.hidden = true;
        }
      }, (node.scrollTop / (node.scrollHeight - node.clientHeight) * 100) > 50.0 ? -1 : +1).done(function () {
        delete PS_Cover.fadeInOutLoop;
      });
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
          'fa-low-vision' : 'Adjusts the opacity (or visibility) of this layer. (In percentages)',
          'fa-eyedropper' : 'Click the color palette to select a color.',
          'fa-adjust' : 'Click the checkbox to toggle between fill and nofill.',
          'fa-arrows' : 'Adjusts the overall size of this layer. (In percentages)',
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


  // inital setup of the canvas
  PS_Cover.ctx = PS_Cover.canvas.getContext('2d');
  PS_Cover.canvas.width = window.innerWidth;
  PS_Cover.canvas.height = 600;

  document.body.className += PS_Cover.isPS4 ? ' isPS4' : ' notPS4';


  // open the cover in a new window so the user can take a screenshot / download the image
  document.getElementById('download-ps4-cover').addEventListener('click', function () {
    window.open().document.write(
      '<style>'+
        'body{padding:0;margin:0;background:#000;display:flex;min-height:100vh;flex-direction:column;' + ( PS_Cover.isPS4 ? 'cursor:none' : '' ) + '}'+
        '#creation-info{color:#CCC;font-size:16px;font-family:Arial;padding:6px;}'+
        '#cover-result{flex:1 0 auto}'+
      '</style>'+

      '<div id="cover-result"><img src="' + PS_Cover.canvas.toDataURL('image/png') + '" alt="PS4 Cover"></div>'+

      '<div id="creation-info">'+
        '<p>'+
          (
            PS_Cover.isPS4 ?
            'Press the SHARE button and choose SCREENSHOT to SAVE your cover image.' :
            'Right click your cover image and choose "SAVE IMAGE" or "SAVE AS" to save it to your computer.'
          )+
        '</p>'+
        '<p>Created with PS4 Cover Generator</p>'+
        '<p>sethclydesdale.github.io/ps4-cover-generator/</p>'+
      '</div>'
    );
  });


  // increase / decrease canvas width and redraw when the window is resized
  window.addEventListener('resize', function () {
    PS_Cover.canvas.width = window.innerWidth;
    PS_Cover.draw();
  });

  PS_Cover.cache.coverTools.addEventListener('scroll', function() {
    PS_Cover.fadeInOut(true);
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

    } else {
      PS_Cover.draw();
    }
  };

  // draw to the canvas when the number value changes
  if (PS_Cover.isPS4) {
    Inumber.callback = function (input) {
      PS_Cover.updateInput(input);
      PS_Cover.draw();
    };
  }

  // create example presets
  PS_Cover.add('image', {
    value : 'https://i.imgur.com/OXtas9o.png',
    x : (PS_Cover.canvas.width / 2) - 100,
    y : (PS_Cover.canvas.height / 2) - 100,
    noScroll : 1
  });

  PS_Cover.add('text', {
    value : 'PS4 Cover Generator',
    color : '#FFFFFF',
    size : 40,
    x : (PS_Cover.canvas.width / 2) - 175,
    y : 120,
    noScroll : 1
  });

  PS_Cover.fadeInOut(true);
  replaceCheckboxes(); // replace checkboxes w/custom ones

  // auto initiate the tutorial if the page hash is #tutorial
  if (window.location.hash == '#tutorial') {
    PS_Cover.Tutorial.confirmed = true;
    PS_Cover.Tutorial.init();
  }
}());

(function () {
  window.PS_Cover = {
    isPS4 : /PlayStation 4/.test(navigator.userAgent),

    canvas : document.getElementById('ps4-cover-photo'),

    cache : {
      bgColor : document.getElementById('cover-bg-color'),
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
            PS_Cover.transform({
              rotate : +data.rotate,
              opacity : +data.opacity / 100,
              blend : data.blend,

            }, function () {
              var fill = data.nofill == 'true' ? 'stroke' : 'fill';

              PS_Cover.ctx.font = data.size + 'px ' + data.font;
              PS_Cover.ctx[fill + 'Style'] = data.color;
              PS_Cover.ctx[fill + 'Text'](data.value, data.x, data.y);
            });
            break;


          case 'image' :
            img = PS_Cover.cache.layers[i].firstChild;
            img.crossOrigin = 'anonymous';

            if (!img.dataset.last || img.dataset.last != data.value) {
              img.dataset.last = data.value;
              img.src = data.value;
            }

            PS_Cover.loadImage(img, data.x, data.y, {
              scale : +data.scale / 100,
              rotate : +data.rotate,
              opacity : +data.opacity / 100,
              blend : data.blend,
            });
            break;


          case 'shape' :
            PS_Cover.transform({
              scale : +data.scale / 100,
              rotate : +data.rotate,
              opacity : +data.opacity / 100,
              blend : data.blend

            }, function () {
              var fill = data.nofill == 'true' ? 'stroke' : 'fill',
                  thumb = PS_Cover.cache.layers[i].firstChild.getContext('2d');

              PS_Cover.drawShape(data.value, {
                style : fill,
                color : data.color,
                x : +data.x,
                y : +data.y,
                height : +data.height,
                width : +data.width
              }, PS_Cover.ctx);

              thumb.clearRect(0, 0, 40, 40);
              PS_Cover.drawShape(data.value, {
                style : fill,
                color : data.color,
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

        FontDetect.onFontLoaded(value, function () {
          selected.dataset.loaded = true;
          PS_Cover.draw();
        }, null, { msTimeout : 3000 });

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


    // adjusts the scale, rotation, etc.. of a single canvas element
    transform : function (config, callback) {
      PS_Cover.ctx.save();

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
          'data-blend=""'+
          'data-opacity="100"'+
          'data-rotate="0"'+
          'data-x="' + ( settings.x || '0' ) + '"'+
          'data-y="' + ( settings.y || '0' ) + '"',

          val = settings.value || '';

      // add a new layer based on the chosen type
      switch (type) {
        case 'text' :
          row.innerHTML =
          '<a data-value="' + val + '" data-nofill="false" data-size="40" data-font="PlayStation" data-color="' + (settings.color || PS_Cover.randomColor()) + '" data-y="' + ( settings.y || '40' ) + '" ' + defaultAttrs + ' href="#" onclick="PS_Cover.openLayer(this); return false;">'+
            '<i class="layer-thumb fa fa-font"></i>'+
            '<span class="layer-value">' + val + '</span>'+
          '</a>';
          break;


        case 'image' :
          row.innerHTML =
          '<a data-value="' + val + '" data-scale="100" ' + defaultAttrs + ' href="#" onclick="PS_Cover.openLayer(this); return false;">'+
            '<img class="layer-thumb" src="' + val + '" alt="">'+
            '<span class="layer-value">' + val.split('/').pop() + '</span>'+
          '</a>';
          break;

        case 'shape' :
          row.innerHTML =
          '<a data-value="rect" data-height="' + ( settings.height || '50' ) + '" data-width="' + ( settings.width || '50' ) + '" data-color="' + PS_Cover.randomColor() + '" data-nofill="false" data-scale="100" ' + defaultAttrs + ' href="#" onclick="PS_Cover.openLayer(this); return false;">'+
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
        PS_Cover.openLayer(row, settings.noScroll);
      }

      PS_Cover.updateLayerCount();
      PS_Cover.draw();
    },


    // opens the tools for editing the selected layer
    openLayer : function (caller, noScroll, noOpen) {
      var data = caller.dataset,

          coords = PS_Cover.templates.layer_coords
          .replace('value="0"', 'value="' + data.x + '"')
          .replace('value="0"', 'value="' + data.y + '"'),

          shared_tools = PS_Cover.templates.shared_tools
          .replace('value="' + data.blend + '"', 'value="' + data.blend + '" selected')
          .replace('value="100"', 'value="' + data.opacity + '"');


      switch (data.type) {
        case 'text' :
          for (var opts = '', i = 0, j = PS_Cover.fonts.length, loaded, cleanName; i < j; i++) {
            cleanName = PS_Cover.fonts[i].replace(':loaded', '');
            loaded = false;

            // set loaded attr
            if (/:loaded/.test(PS_Cover.fonts[i])) {
              loaded = true;
            }

            opts += '<option value="' + cleanName + '"' + ( loaded ? ' data-loaded="true"' : '' ) + ( data.font == cleanName ? ' selected' : '' ) + '>' + cleanName + '</option>';
          }

          PS_Cover.cache.layerSettings.innerHTML = '<div class="main-layer-input">'+
            '<input class="cover-input-value" type="text" value="' + data.value + '" oninput="PS_Cover.updateInput(this);">'+
            '<a href="#" class="fa fa-eyedropper tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-color color-inpicker" type="text" value="' + data.color + '" oninput="PS_Cover.updateInput(this);">'+
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
      ColorInpicker.init({ hide : true }); // create color pickers

      // ps4 specific modifications
      if (PS_Cover.isPS4) {
        Inumber.init(); // create number input arrows
      }

      // scoll to the current layer
      if (!noScroll) {
        PS_Cover.jumpToLayer(PS_Cover.cache.activeLayer);
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
        var input = caller.parentsUntil('#layer-settings').querySelector('.cover-input-value');

        input.value += ' ' + caller.innerHTML;
        PS_Cover.updateInput(input);
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
            '<a class="select-image-option" data-hidden="true" href="#" onclick="PS_Cover.Images.insert(this.firstChild);return false;"><img src="' + PS_Cover.Images.host + category + '/' + PS_Cover.Images.list[category].thumb + '" alt="">' + PS_Cover.templates.Images.placeholder + '</a>'+
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
              str += '<a class="select-image-option" data-hidden="true" href="#" onclick="PS_Cover.Images.insert(this.firstChild);return false;"><img src="' + PS_Cover.Images.host + PS_Cover.Images.catg + '/' + PS_Cover.Images.list[PS_Cover.Images.catg].images[PS_Cover.Images.index].replace(/(\.[^\.]*?)$/, '_tn.jpg') + '" data-ext="' + PS_Cover.Images.list[PS_Cover.Images.catg].images[PS_Cover.Images.index].split('.').pop() + '" alt="">' + PS_Cover.templates.Images.placeholder + '</a>';
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
        var input = PS_Cover.Images.caller.previousSibling,
            src = img.getAttribute('src'),
            regex = /_tn\.jpg$/;

        PS_Cover.Images.close();
        input.value = regex.test(src) ? src.replace(regex, '.' + img.dataset.ext) : src;
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


    // html templates
    templates : {

      no_layers : '<p id="no-layers">There are no layers to modify. Why not add one by using the buttons above?</p>',

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
      '<input class="cover-input-opacity" min="0" max="100" type="number" value="100" oninput="PS_Cover.updateInput(this);">',

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
      'PlayStation:loaded',
      'FontAwesome:loaded',
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
      'Courier New:loaded',
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


    // show / hide elements as the user scrolls
    fadeInOut : function () {
      if (PS_Cover.fadeInOutLoop) {
        PS_Cover.fadeInOutLoop.kill();
      }

      var node = PS_Cover.cache.Images.imageContent;

      PS_Cover.fadeInOutLoop = new ForAll (PS_Cover.cache.Images.images, function (that) {
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
      if (window.localStorage) {
        window.setTimeout(function () {
          localStorage.savedLayers = PS_Cover.cache.layerList.innerHTML;

          var settings = '';
          new ForAll(PS_Cover.cache.settings, function (input) {
            settings += input.id + ':' + (input.type == 'checkbox' ? input.checked : input.value) + (this.index == this.list.length - 1 ? '' : ';');

          }).done(function () {
            localStorage.canvasSettings = settings;
          });
        }, 100);
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
        '#cover-result{flex:1 0 auto;text-align:center;}'+
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

      if (/cover-(?:width|height)/.test(input.id)) {
        PS_Cover.setDimensions(input, input.id.split('-').pop());
      }
    };
  }


  // auto-saves canvas layers when one of the following events occur
  document.addEventListener('click', PS_Cover.saveCoverImage);
  document.addEventListener('keyup', PS_Cover.saveCoverImage);

  // load the user's progress from last time
  if (window.localStorage && localStorage.savedLayers && localStorage.canvasSettings) {

    // add the layers to the layer list and update the node caches
    PS_Cover.cache.layerList.innerHTML = localStorage.savedLayers;
    PS_Cover.cache.layers = document.querySelectorAll('.cover-layer');
    PS_Cover.cache.activeLayer = document.querySelector('.activeLayer');

    // apply saved canvas settings
    for (var settings = localStorage.canvasSettings.split(';'), i = 0, j = settings.length, prop, input; i < j; i++) {
      prop = settings[i].split(':');
      input = document.getElementById(prop[0]);

      if (prop[1] == 'true') {
        input.click();

      } else {
        input.value = prop[1];

        if (/cover-(?:width|height)/.test(prop[0])) {
          PS_Cover.setDimensions(input, prop[0].split('-').pop());
        }
      }
    }

    // update the layer count, open the active layer, and draw to the canvas
    PS_Cover.updateLayerCount();
    PS_Cover.openLayer(PS_Cover.cache.activeLayer);
    PS_Cover.draw();

  } else { // otherwise create an example
    PS_Cover.add('image', {
      value : 'resources/images/ps4.png',
      x : (PS_Cover.canvas.width / 2) - 100,
      y : (PS_Cover.canvas.height / 2) - 100,
      noScroll : 1
    });

    PS_Cover.add('text', {
      value : 'PS4 Cover Generator',
      color : '#FFFFFF',
      x : (PS_Cover.canvas.width / 2) - 175,
      y : 120,
      noScroll : 1
    });
  }

  replaceCheckboxes(); // replace checkboxes w/custom ones

  // auto initiate the tutorial if the page hash is #tutorial
  if (window.location.hash == '#tutorial') {
    PS_Cover.Tutorial.confirmed = true;
    PS_Cover.Tutorial.init();
  }
}());

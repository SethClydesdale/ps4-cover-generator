(function () {
  window.PS_Cover = {
    isPS4 : /PlayStation 4/.test(navigator.userAgent),

    canvas : document.getElementById('ps4-cover-photo'),

    // used to draw images, text, etc.. onto the canvas
    draw : function () {
      PS_Cover.canvas.width = window.innerWidth;
      PS_Cover.canvas.height = 600;

      PS_Cover.ctx.fillStyle = document.getElementById('cover-bg-color').value;
      PS_Cover.ctx.fillRect(0, 0, PS_Cover.canvas.width, PS_Cover.canvas.height);

      // draw images onto the canvas
      for (var layer = document.querySelectorAll('.cover-layer'), i = layer.length - 1, img, input; i > -1; i--) {
        if (/image-layer/.test(layer[i].className)) {
          input = layer[i].querySelector('.main-input');

          img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = input.value;

          if (input.previousSibling.dataset.last != input.value) {
            input.previousSibling.dataset.last = input.value;
            input.previousSibling.src = input.value;
          }

          if (input.style.borderColor) {
            input.style.borderColor = '';
          }

          PS_Cover.loadImage(img, input.dataset.x, input.dataset.y, input, {
            scale : +input.dataset.scale / 100,
            rotate : +input.dataset.rotate
          });

        } else if (/text-layer/.test(layer[i].className)) {
          input = layer[i].querySelector('.main-input');

          PS_Cover.transform({
            rotate : +input.dataset.rotate

          }, function () {
            var fill = input.dataset.nofill == 'true' ? 'stroke' : 'fill';

            PS_Cover.ctx.font = input.dataset.size + 'px ' + input.dataset.font;
            PS_Cover.ctx[fill + 'Style'] = input.dataset.color;
            PS_Cover.ctx[fill + 'Text'](input.value, input.dataset.x, input.dataset.y);
          });

        } else if (/shape-layer/.test(layer[i].className)) {
          input = layer[i].querySelector('.main-input');

          PS_Cover.transform({
            scale : +input.dataset.scale / 100,
            rotate : +input.dataset.rotate

          }, function () {
            PS_Cover.ctx.fillStyle = input.dataset.color;

            switch (input.value) {
              case 'rect' :
                PS_Cover.ctx.fillRect(input.dataset.x, input.dataset.y, input.dataset.width, input.dataset.height);
                break;

              case 'tri' :
                PS_Cover.ctx.beginPath();
                PS_Cover.ctx.moveTo(input.dataset.x, input.dataset.y);
                PS_Cover.ctx.lineTo(+input.dataset.x - (+input.dataset.width / 2), +input.dataset.y + +input.dataset.height);
                PS_Cover.ctx.lineTo(+input.dataset.x + (+input.dataset.width / 2), +input.dataset.y + +input.dataset.height);
                PS_Cover.ctx.fill();
                break;

              case 'arc' :
                PS_Cover.ctx.arc(input.dataset.x, input.dataset.y, input.dataset.height, 0, 2 * Math.PI);
                PS_Cover.ctx.fill();
                break;
            }
          });
        }

      }

    },


    // wait for images to load before drawing them
    loadImage : function (img, x, y, input, transform) {
      if (img.complete) {
        PS_Cover.transform({
          scale : transform.scale,
          rotate : transform.rotate

        }, function () {
          PS_Cover.ctx.drawImage(img, x, y);
        });

      } else {
        img.addEventListener('load', function () {
          PS_Cover.transform({
            scale : transform.scale,
            rotate : transform.rotate

          }, function () {
            PS_Cover.ctx.drawImage(img, x, y);
          });

          // onload delays the addition of this layer
          // so draw again to update the layer position of the image
          PS_Cover.draw();
        });
      }

      // if an image URL is invalid or cannot load, make the input border red
      img.addEventListener('error', function () {
        if (input.value) {
          input.style.borderColor = '#F00';
        }
      });
    },


    // update the input of elements and draw the new value to the canvas
    updateInput : function (caller) {
      var type = caller.className.replace(/cover-input-/g, ''),
          input = caller.parentsUntil('.cover-layer').querySelector('.main-input'),
          selected = caller.options ? caller.options[caller.selectedIndex] : null,
          fa = caller.parentNode.querySelector('.fa-caller'),
          value = caller[caller.type == 'checkbox' ? 'checked' : 'value'];

      if (type == 'font' && !selected.dataset.loaded) {
        input.style.fontFamily = value;
        input.dataset[type] = value;

        FontDetect.onFontLoaded(value, function () {
          selected.dataset.loaded = true;
          PS_Cover.draw();
        }, null, { msTimeout : 3000 });

      } else {
        if (type == 'font') {
          input.style.fontFamily = value;
        }

        input.dataset[type] = value;
        PS_Cover.draw();
      }

      // show fontawesome icon toggler
      if (type == 'font') {
        if (value == 'FontAwesome' && fa && fa.style.display == 'none') {
          fa.style.display = '';
        } else if (fa && fa.style.display != 'none') {
          fa.style.display = 'none';
        }
      }

    },


    // adjusts the scale of a single canvas element
    transform : function (config, callback) {
      PS_Cover.ctx.save();

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
      var row = caller.parentsUntil('.cover-layer'),
          layers = document.getElementById('cover-layers');

      switch (where.toLowerCase()) {
        case 'up' :
          layers.insertBefore(row, row.previousSibling);
          break;

        case 'down' :
          var next = row.nextSibling.nextSibling;
          next ? layers.insertBefore(row, next) : layers.appendChild(row);
          break;
      }

      PS_Cover.draw();
    },


    // delete the specified layer
    deleteLayer : function (caller) {
      if (confirm('You are about to delete this layer.\nDo you want to continue?')) {
        var layer = caller.parentsUntil('.cover-layer');
        layer.parentNode.removeChild(layer);
        PS_Cover.draw();
      }
    },


    // function for adding new layers
    add : function (type, settings) {
      settings = settings ? settings : {};

      var tools = document.getElementById('cover-tools'),
          layers = document.getElementById('cover-layers'),
          firstChild = layers.firstChild,
          row = document.createElement('DIV'),
          color,
          cleanName,
          opts,
          i,
          j,
          loaded,
          selected;

      row.className = 'tools-row cover-layer';

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
        row.innerHTML =
        '<div class="main-layer-input">'+
          '<input class="main-input cover-text big" type="text" value="' + (settings.value || '') + '" data-nofill="' + ( settings.nofill ? true : false ) + '" data-size="' + ( settings.size || '40' ) + '" data-color="' + ( settings.color || color ) + '" data-font="PlayStation" data-rotate="' + ( settings.rotate || '0' ) + '" data-x="' + ( settings.x || '0' ) + '" data-y="' + ( settings.y || '40' ) + '" oninput="PS_Cover.draw();">'+
          PS_Cover.templates.layer_controls+
        '</div>'+
        '<div class="cover-input-tools">'+
          '<a href="#" class="fa fa-eyedropper tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-color color-inpicker" type="text" value="' + ( settings.color || color ) + '" oninput="PS_Cover.updateInput(this);">'+
          '<a href="#" class="fa fa-adjust tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-nofill" type="checkbox" onchange="PS_Cover.updateInput(this);" ' + ( settings.nofill ? 'checked' : '' ) + '>'+
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
        row.innerHTML =
        '<div class="main-layer-input">'+
          '<img class="image-thumb" src="" alt="">'+
          '<input class="main-input cover-image big" type="text" value="' + ( settings.value || '' ) + '" data-scale="' + ( settings.size || '100' ) + '" data-rotate="' + ( settings.rotate || '0' ) + '" data-x="' + ( settings.x || '0' ) + '" data-y="' + ( settings.y || '0' ) + '" oninput="PS_Cover.draw();">'+
          '<a class="fa fa-search image-caller layer-button" href="#" onclick="PS_Cover.Images.call(this);return false;"></a>'+
          PS_Cover.templates.layer_controls+
        '</div>'+
        '<div class="cover-input-tools">'+
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
        row.innerHTML =
        '<div class="main-layer-input">'+
          '<select class="main-input cover-shape big" data-height="' + (settings.height || '50') + '" data-width="' + (settings.width || '50') + '" data-color="' + ( settings.color || color ) + '" data-scale="' + ( settings.size || '100' ) + '" data-rotate="' + ( settings.rotate || '0' ) + '" data-x="' + ( settings.x || '0' ) + '" data-y="' + ( settings.y || '0' ) + '" onchange="PS_Cover.draw();">'+
            '<option value="rect" selected>Rectangle</option>'+
            '<option value="tri">Triangle</option>'+
            '<option value="arc">Circle</option>'+
          '</select>'+
          PS_Cover.templates.layer_controls+
        '</div>'+
        '<div class="cover-input-tools">'+
          '<a href="#" class="fa fa-eyedropper tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-color color-inpicker" type="text" value="' + ( settings.color || color ) + '" oninput="PS_Cover.updateInput(this);">'+
          '<a href="#" class="fa fa-arrows tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-scale" type="number" value="' + ( settings.size || '100' ) + '" oninput="PS_Cover.updateInput(this);" min="0">'+
          '<a href="#" class="fa fa-arrows-h tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-width" type="number" value="' + ( settings.width || '50' ) + '" oninput="PS_Cover.updateInput(this);" min="0">'+
          '<a href="#" class="fa fa-arrows-v tools-icon" onclick="PS_Cover.help(this.className); return false;"></a><input class="cover-input-height" type="number" value="' + ( settings.height || '50' ) + '" oninput="PS_Cover.updateInput(this);" min="0">'+
          coords +
        '</div>';
      }


      // add the new layer to the layers list
      firstChild ? layers.insertBefore(row, firstChild) : layers.appendChild(row);

      // scroll directly to the top of the new layer
      if (!settings.noScroll) {
        tools.scrollTop = row.offsetTop - 3;
      }

      ColorInpicker.init({ hide : true }); // create color pickers
      if (PS_Cover.isPS4) Inumber.init(); // create number input arrows
      replaceCheckboxes(); // replace checkboxes w/custom ones
      PS_Cover.draw();
    },


    // delete all layers
    deleteLayers : function () {
      if (confirm('You are about to delete all layers.\nDo you want to continue?')) {
        for (var layers = document.getElementById('cover-layers'), a = layers.querySelectorAll('.tools-row'), i = 0, j = a.length; i < j; i++) {
          layers.removeChild(a[i]);
        }

        PS_Cover.draw();
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
          script.src = 'resources/images-list.js';
          document.body.appendChild(script);
        }

        if (!document.getElementById('select-image-modal')) {
          var overlay = document.createElement('DIV'),
              modal = document.createElement('DIV'),
              str = '<h1 id="select-image-title">Select a Category</h1>' + PS_Cover.templates.Images.close + '<div id="select-image-container">',
              i;

          overlay.addEventListener('click', PS_Cover.Images.close);
          overlay.id = 'select-image-overlay';
          modal.id = 'select-image-modal';

          if (PS_Cover.Images.list) {
            for (i in PS_Cover.Images.list) {
              str += '<a class="select-image-category" href="#" onclick="PS_Cover.Images.get(\'' + i + '\');return false;" style="background-image:url(' + PS_Cover.Images.list[i].thumb + ')"><span class="select-image-total">' + PS_Cover.Images.list[i].images.length + ' images</span></a>';
            }
          } else {
            str +=
              '<p class="loading"><i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i></p>'+
              '<p class="loading">Loading images...</p>';
          }

          modal.innerHTML = str + '</div>' + PS_Cover.templates.Images.request;

          PS_Cover.Images.overlay = overlay;
          PS_Cover.Images.modal = modal;

          if (caller) {
            PS_Cover.Images.caller = caller;
          }

          document.body.appendChild(PS_Cover.Images.overlay);
          document.body.appendChild(PS_Cover.Images.modal);
          document.body.style.overflow = 'hidden';

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
        for (var str = '<h1 id="select-image-title">Select an Image</h1><a class="select-image-button select-image-back" href="#" onclick="PS_Cover.Images.close();PS_Cover.Images.call();return false;"><i class="fa fa-chevron-left"></i> Back</a>' + PS_Cover.templates.Images.close + '<div id="select-image-container" onscroll="PS_Cover.Images.fadeInOut();"><div id="select-image-list" class="clear">', i = 0, j = PS_Cover.Images.list[category].images.length; i < j; i++) {
          str += '<a class="select-image-option" data-hidden="true" href="#" onclick="PS_Cover.Images.insert(this.firstChild.src);return false;"><img src="' + (/imgur/.test(PS_Cover.Images.list[category].images[i]) ? PS_Cover.Images.list[category].images[i].replace(/(\.[^\.]*?)$/, 'm$1') : PS_Cover.Images.list[category].images[i]) + '"></a>';
        }

        PS_Cover.Images.modal.innerHTML = str + '</div></div>' + PS_Cover.templates.Images.request;
        PS_Cover.Images.fadeInOut();
      },

      // show / hide images as the user scrolls
      fadeInOut : function () {
        for (var a = document.querySelectorAll('.select-image-option'), i = 0, j = a.length; i < j; i++) {
          var rect = a[i].getBoundingClientRect(),
              visible = rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);

          if (visible && a[i].dataset.hidden == 'true') {
            a[i].dataset.hidden = false;

          } else if (!visible && a[i].dataset.hidden == 'false') {
            a[i].dataset.hidden = true;
          }
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
          document.body.removeChild(PS_Cover.Images.overlay);
          document.body.removeChild(PS_Cover.Images.modal);
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
        request : '<a class="select-image-request" href="https://github.com/SethClydesdale/ps4-cover-generator/wiki/Requesting-Images" target="_blank">Request Images</a>'
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
          'fa-eyedropper' : 'Click the color palette to select a color.',
          'fa-adjust' : 'Click the checkbox to toggle between fill and nofill.',
          'fa-arrows' : 'Adjusts the overall size of this layer in percentages.',
          'fa-arrows-v' : 'Adjusts the height of this layer in pixels.',
          'fa-arrows-h' : 'Adjusts the width of this layer in pixels.',
          'fa-text-height' : 'Adjusts the font size of this layer in pixels.',
          'fa-font' : 'Click the drop down to select a font.',
          'layer-coords-x' : 'Adjusts the horizontal position of this layer in pixels.',
          'layer-coords-y' : 'Adjusts the vertical position of this layer in pixels.'
        }[className]);

      }
    },

  };


  // inital setup of the canvas
  PS_Cover.ctx = PS_Cover.canvas.getContext('2d');
  PS_Cover.draw();


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


  // cover tool event handlers
  var tools = document.getElementById('cover-tools');

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


  // toggle toolbox
  document.getElementById('cover-tools-title').addEventListener('click', function (e) {
    var tools = document.getElementById('cover-tools');

    if (this.className == 'hidden') {
      this.className = '';
      tools.className = '';

    } else {
      this.className = 'hidden';
      tools.className = 'hidden';
    }

    e.preventDefault();
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
    value : 'https://sethclydesdale.github.io/ps4-cover-generator/resources/images/ps4.png',
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

  replaceCheckboxes(); // replace checkboxes w/custom ones
}());

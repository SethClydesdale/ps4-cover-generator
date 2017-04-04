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
          input = layer[i].querySelector('.cover-image');

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
          input = layer[i].querySelector('.cover-text');

          PS_Cover.transform({
            rotate : +input.dataset.rotate

          }, function () {
            PS_Cover.ctx.fillStyle = input.dataset.color;
            PS_Cover.ctx.font = input.dataset.size + 'px ' + input.dataset.font;
            PS_Cover.ctx.fillText(input.value, input.dataset.x, input.dataset.y);
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
      var type = caller.className.replace(/cover-image-|cover-text-/g, ''),
          input = caller.parentNode.parentNode.getElementsByTagName('INPUT')[0],
          selected = caller.options ? caller.options[caller.selectedIndex] : null,
          fa = caller.parentNode.querySelector('.fa-caller');

      if (type == 'font' && !selected.dataset.loaded) {
        input.style.fontFamily = caller.value;
        input.dataset[type] = caller.value;

        FontDetect.onFontLoaded(caller.value, function () {
          selected.dataset.loaded = true;
          PS_Cover.draw();
        }, null, { msTimeout : 3000 });

      } else {
        if (type == 'font') {
          input.style.fontFamily = caller.value;
        }

        input.dataset[type] = caller.value;
        PS_Cover.draw();
      }

      // show fontawesome icon toggler
      if (type == 'font') {
        if (caller.value == 'FontAwesome' && fa && fa.style.display == 'none') {
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

        var input = caller.parentNode.parentNode.parentNode.parentNode.getElementsByTagName('INPUT')[0];

        PS_Cover.rotator = window.setInterval(function () {
          var total = +input.dataset.rotate + amount;
          input.dataset.rotate = total > 360 ? 0 : total;
          PS_Cover.draw();
        }, 10);

      } else if (PS_Cover.rotating && caller == 'stop') {
        PS_Cover.rotating = false;
        window.clearInterval(PS_Cover.rotator);

      } else if (amount == 90) {
        var input = caller.parentNode.parentNode.parentNode.parentNode.getElementsByTagName('INPUT')[0],
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

        var input = caller.parentNode.parentNode.parentNode.parentNode.getElementsByTagName('INPUT')[0],
            coord = /up|down/.test(caller.className) ? 'y' : 'x',
            amount = /up|left/.test(caller.className) ? -1 : +1;

        PS_Cover.mover = window.setInterval(function () {
          input.dataset[coord] = +input.dataset[coord] + amount;
          PS_Cover.draw();
        }, 1);

      } else if (PS_Cover.moving && caller == 'stop') {
        PS_Cover.moving = false;
        window.clearInterval(PS_Cover.mover);
      }
    },


    // move layers up / down
    moveLayer : function (where, caller) {
      var row = caller.parentNode.parentNode.parentNode.parentNode,
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
        var layer = caller.parentNode.parentNode.parentNode;
        layer.parentNode.removeChild(layer);
        PS_Cover.draw();
      }
    },


    // function for adding new layers
    add : function (type, settings) {
      settings = settings ? settings : {};

      var row = document.createElement('DIV'),
          cleanName,
          opts,
          i,
          j,
          loaded,
          selected;

      row.className = 'tools-row cover-layer';

      // adds a text layer
      if (type == 'text') {

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
          '<input class="cover-text big" type="text" value="' + (settings.value || '') + '" data-size="' + ( settings.size || '40' ) + '" data-color="' + ( settings.color || '#FFFFFF' ) + '" data-font="PlayStation" data-rotate="' + ( settings.rotate || '0' ) + '" data-x="' + ( settings.x || '0' ) + '" data-y="' + ( settings.y || '40' ) + '" oninput="PS_Cover.draw();">'+
          PS_Cover.templates.layer_controls+
        '</div>'+
        '<div class="cover-text-tools">'+
          '<input class="cover-text-color color-inpicker" type="text" value="' + ( settings.color || '#FFFFFF' ) + '" oninput="PS_Cover.updateInput(this);">'+
          '<input class="cover-text-size" type="number" value="' + ( settings.size || '40' ) + '" oninput="PS_Cover.updateInput(this);" min="0">'+
          '<a class="fa fa-smile-o fa-caller layer-button" href="#" onclick="PS_Cover.FontAwesome.call(this);return false;" style="display:none;"></a>'+
          '<select class="cover-text-font" onchange="PS_Cover.updateInput(this);">'+
            opts+
          '</select>'+
        '</div>';
      }


      // adds an image layer
      if (type == 'image') {
        row.className += ' image-layer';
        row.innerHTML =
        '<div class="main-layer-input">'+
          '<img class="image-thumb" src="" alt="">'+
          '<input class="cover-image big" type="text" value="' + ( settings.value || '' ) + '" data-scale="' + ( settings.size || '100' ) + '" data-rotate="' + ( settings.rotate || '0' ) + '" data-x="' + ( settings.x || '0' ) + '" data-y="' + ( settings.y || '0' ) + '" oninput="PS_Cover.draw();">'+
          '<a class="fa fa-search image-caller layer-button" href="#" onclick="PS_Cover.Images.call(this);return false;"></a>'+
          PS_Cover.templates.layer_controls+
        '</div>'+
        '<div class="cover-image-tools">'+
          '<input class="cover-image-scale" type="number" value="' + ( settings.size || '100' ) + '" oninput="PS_Cover.updateInput(this);" min="0">'+
        '</div>';

        if (!settings.value) {
          PS_Cover.Images.call(row.querySelector('.image-caller'));
        }
      }

      document.getElementById('cover-layers').appendChild(row);

      ColorInpicker.init({ hide : true }); // create color pickers
      if (PS_Cover.isPS4) Inumber.init(); // create number input arrows
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
        caller.parentNode.parentNode.parentNode.querySelector('.cover-text').value += ' ' + caller.innerHTML;
        PS_Cover.draw();
      }
    },


    // image resources for use in cover images
    Images : {

      // call and build the image overlay
      call : function (caller) {
        if (!document.getElementById('select-image-modal')) {
          var overlay = document.createElement('DIV'),
              modal = document.createElement('DIV'),
              str = '<h1 id="select-image-title">Select a Category</h1>' + PS_Cover.templates.Images.close + '<div id="select-image-container">',
              i;

          overlay.addEventListener('click', PS_Cover.Images.close);
          overlay.id = 'select-image-overlay';
          modal.id = 'select-image-modal';

          for (i in PS_Cover.Images.list) {
            str += '<a class="select-image-category" href="#" onclick="PS_Cover.Images.get(\'' + i + '\');return false;" style="background-image:url(' + PS_Cover.Images.list[i].thumb + ')"></a>';
          }

          modal.innerHTML = str + '</div>';

          PS_Cover.Images.overlay = overlay;
          PS_Cover.Images.modal = modal;

          if (caller) {
            PS_Cover.Images.caller = caller;
          }

          document.body.appendChild(PS_Cover.Images.overlay);
          document.body.appendChild(PS_Cover.Images.modal);
          document.body.style.overflow = 'hidden';
        }

      },


      // get a category's images
      get : function (category) {
        for (var str = '<h1 id="select-image-title">Select an Image</h1><a class="select-image-button select-image-back" href="#" onclick="PS_Cover.Images.close();PS_Cover.Images.call();return false;"><i class="fa fa-chevron-left"></i> Back</a>' + PS_Cover.templates.Images.close + '<div id="select-image-container"><div id="select-image-list">', i = 0, j = PS_Cover.Images.list[category].images.length; i < j; i++) {
          str += '<a class="select-image-option" href="#" onclick="PS_Cover.Images.insert(this.firstChild.src);return false;"><img src="' + PS_Cover.Images.list[category].images[i] + '"></a>';
        }

        PS_Cover.Images.modal.innerHTML = str + '</div></div>';
      },


      // insert the image url into the input
      insert : function (img) {
        PS_Cover.Images.close();
        PS_Cover.Images.caller.previousSibling.value = img;
        PS_Cover.draw();
      },


      // close the image selector
      close : function () {
        if (document.getElementById('select-image-modal')) {
          document.body.removeChild(PS_Cover.Images.overlay);
          document.body.removeChild(PS_Cover.Images.modal);
          document.body.style.overflow = '';
        }
      },


      // list of available images
      list : {
        'Uncharted' : {
          thumb : 'https://i58.servimg.com/u/f58/18/21/60/73/unchar10.png',
          images : [
            'https://i58.servimg.com/u/f58/18/21/60/73/nate-r11.png',
            'https://i58.servimg.com/u/f58/18/21/60/73/nathan13.png',
            'https://i58.servimg.com/u/f58/18/21/60/73/nathan12.png',
            'https://i58.servimg.com/u/f58/18/21/60/73/elena_13.png',
            'https://i58.servimg.com/u/f58/18/21/60/73/elena_12.png',
            'https://i58.servimg.com/u/f58/18/21/60/73/chloe_11.png',
            'https://i58.servimg.com/u/f58/18/21/60/73/victor11.png',
            'https://i58.servimg.com/u/f58/18/21/60/73/eddy-r11.png',
            'https://i58.servimg.com/u/f58/18/21/60/73/flynn-11.png'
          ]
        },

        'inFAMOUS' : {
          thumb : 'https://i58.servimg.com/u/f58/18/21/60/73/infamo10.png',
          images : [
            'https://i58.servimg.com/u/f58/18/21/60/73/cole11.png',
            'https://i58.servimg.com/u/f58/18/21/60/73/cole110.png',
            'https://i58.servimg.com/u/f58/18/21/60/73/cole211.png',
            'https://i58.servimg.com/u/f58/18/21/60/73/cole311.png',
            'https://i58.servimg.com/u/f58/18/21/60/73/cole411.png',
            'https://i58.servimg.com/u/f58/18/21/41/30/delsin11.png',
            'https://i58.servimg.com/u/f58/18/21/41/30/delsin12.png',
            'https://i58.servimg.com/u/f58/18/21/41/30/delsin10.png',
            'https://i58.servimg.com/u/f58/18/21/41/30/fetch10.png',
            'https://i58.servimg.com/u/f58/18/21/41/30/fetch110.png',
            'https://i58.servimg.com/u/f58/18/21/41/30/nix10.png',
            'https://i58.servimg.com/u/f58/18/21/41/30/reaper10.png'
          ]
        },

        'God of War' : {
          thumb : 'https://i58.servimg.com/u/f58/18/21/41/30/gow-lo10.png',
          images : [
            'https://i58.servimg.com/u/f58/18/21/41/30/kratos14.png',
            'https://i58.servimg.com/u/f58/18/21/41/30/kratos10.png',
            'https://i58.servimg.com/u/f58/18/21/41/30/kratos13.png',
            'https://i58.servimg.com/u/f58/18/21/41/30/kratos11.png',
            'https://i58.servimg.com/u/f58/18/21/41/30/kratos12.png',
            'https://i58.servimg.com/u/f58/18/21/41/30/kratos15.png',
            'https://i58.servimg.com/u/f58/18/21/41/30/kratos16.png',
            'https://i58.servimg.com/u/f58/18/21/41/30/kratos17.png',
            'https://i58.servimg.com/u/f58/18/21/41/30/kratos18.png',
            'https://i58.servimg.com/u/f58/18/21/41/30/kratos21.png',
            'https://i58.servimg.com/u/f58/18/21/41/30/kratos20.png',
            'https://i58.servimg.com/u/f58/18/21/41/30/kratos19.png'
          ]
        },

        'Persona' : {
          thumb : 'https://i58.servimg.com/u/f58/18/45/41/65/person10.png',
          images : [
            'https://i58.servimg.com/u/f58/18/45/41/65/aigis10.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/aigis110.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/aigis210.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/aigis310.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/aigis410.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/aigis510.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/aigis610.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/aigis710.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/aigis810.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/akihik10.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/chie10.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/elizab11.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/elizab10.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/elizab12.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/femc10.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/mc10.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/izanag10.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/izanag11.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/izanag12.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/mitsur11.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/mitsur10.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/mitsur12.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/person12.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/person11.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/yu11.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/yu110.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/yu210.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/yu310.png',
            'https://i58.servimg.com/u/f58/18/45/41/65/yukari10.png'
          ]
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

      Images : {
        close : '<a class="select-image-button select-image-close" href="#" onclick="PS_Cover.Images.close();return false;"><i class="fa fa-times"></i> Close</a>'
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
    ]

  };


  // inital setup of the canvas
  PS_Cover.ctx = PS_Cover.canvas.getContext('2d');
  PS_Cover.draw();


  // open the cover in a new window so the user can take a screenshot / download the image
  document.getElementById('download-ps4-cover').addEventListener('click', function () {
    window.open().document.write(
      '<style>'+
        'body{padding:0;margin:0;background:#000;' + ( PS_Cover.isPS4 ? 'cursor:none' : '' ) + '}'+
        '#creation-info{position:fixed;left:0;bottom:0;color:#CCC;font-size:16px;font-family:Arial;padding:6px;}'+
      '</style>'+

      '<img src="' + PS_Cover.canvas.toDataURL('image/png') + '" alt="PS4 Cover">'+

      '<div id="creation-info">'+
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
    if (/cover-text-/.test(ColorInpicker.input.className)) {
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
  PS_Cover.add('text', {
    value : 'PS4 Cover Generator',
    size : 40,
    x : (PS_Cover.canvas.width / 2) - 175,
    y : 120
  });

  PS_Cover.add('image', {
    value : 'https://sethclydesdale.github.io/ps4-cover-generator/resources/images/ps4.png',
    x : (PS_Cover.canvas.width / 2) - 100,
    y : (PS_Cover.canvas.height / 2) - 100
  });

}());

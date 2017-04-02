(function () {
  window.PS_Cover = {
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

          PS_Cover.loadImage(img, input.dataset.x, input.dataset.y, +input.dataset.scale / 100, input);

        } else if (/text-layer/.test(layer[i].className)) {
          input = layer[i].querySelector('.cover-text');

          PS_Cover.ctx.fillStyle = input.dataset.color;
          PS_Cover.ctx.font = input.dataset.size + 'px ' + input.dataset.font;
          PS_Cover.ctx.fillText(input.value, input.dataset.x, input.dataset.y);
        }
      }

    },


    // wait for images to load before drawing them
    loadImage : function (img, x, y, scale, input) {
      if (img.complete) {
        PS_Cover.ctx.save();
        PS_Cover.ctx.scale(scale, scale);
        PS_Cover.ctx.drawImage(img, x, y);
        PS_Cover.ctx.restore();
      } else {
        img.addEventListener('load', function () {
          PS_Cover.ctx.save();
          PS_Cover.ctx.scale(scale, scale);
          PS_Cover.ctx.drawImage(img, x, y);
          PS_Cover.ctx.restore();
        });
      }

      img.addEventListener('error', function () {
        if (input.value) {
          input.style.borderColor = '#F00';
        }
      });
    },


    updateInput : function (that) {
      var type = that.className.replace(/cover-image-|cover-text-/g, ''),
          input = that.parentNode.parentNode.getElementsByTagName('INPUT')[0],
          selected = that.options ? that.options[that.selectedIndex] : null,
          fa = that.parentNode.querySelector('.fa-caller');

      if (type == 'font' && !selected.dataset.loaded) {
        input.style.fontFamily = that.value;
        input.dataset[type] = that.value;

        FontDetect.onFontLoaded(that.value, function () {
          selected.dataset.loaded = true;
          PS_Cover.draw();
        }, null, { msTimeout : 3000 });

      } else {
        if (type == 'font') {
          input.style.fontFamily = that.value;
        }

        input.dataset[type] = that.value;
        PS_Cover.draw();
      }

      // show fontawesome icon toggler
      if (type == 'font') {
        if (that.value == 'FontAwesome' && fa && fa.style.display == 'none') {
          fa.style.display = '';
        } else if (fa && fa.style.display != 'none') {
          fa.style.display = 'none';
        }
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
          '<input class="cover-text big" type="text" value="' + (settings.value || '') + '" data-size="' + ( settings.size || '40' ) + '" data-color="' + ( settings.color || '#FFFFFF' ) + '" data-font="PlayStation" data-x="' + ( settings.x || '0' ) + '" data-y="' + ( settings.y || '40' ) + '" oninput="PS_Cover.draw();">'+
          PS_Cover.templates.layer_controls+
        '</div>'+
        '<div class="cover-text-tools">'+
          '<input class="cover-text-color color-inpicker" type="text" value="' + ( settings.color || '#FFFFFF' ) + '" oninput="PS_Cover.updateInput(this);">'+
          '<input class="cover-text-size" type="number" value="' + ( settings.size || '40' ) + '" oninput="PS_Cover.updateInput(this);" min="0">'+
          '<i class="fa fa-smile-o fa-caller layer-button" onclick="PS_Cover.FontAwesome.call(this);" style="display:none;"></i>'+
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
          '<input class="cover-image big" type="text" value="' + ( settings.value || '' ) + '" data-scale="' + ( settings.size || '100' ) + '" data-x="' + ( settings.x || '0' ) + '" data-y="' + ( settings.y || '0' ) + '" oninput="PS_Cover.draw();">'+
          '<i class="fa fa-search image-caller layer-button" onclick="PS_Cover.Images.call(this);"></i>'+
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

      ColorInpicker.init({
        hide : true
      });

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
      call : function (that) {
        if (!PS_Cover.FontAwesome.list) {
          PS_Cover.FontAwesome.build();
        }

        var list = document.getElementById('fontawesome-iconlist');

        if (list) {
          list.parentNode.removeChild(list);
        } else {
          var offset = that.getBoundingClientRect();

          PS_Cover.FontAwesome.list.style.marginTop = '-' + (160 + offset.height) + 'px';
          PS_Cover.FontAwesome.list.style.left = offset.left + 'px';
          that.parentNode.insertBefore(PS_Cover.FontAwesome.list, that);
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
          html += '<i class="fa fa-icon-opt">' + fa[i] + '</i>';
        }

        list.id = 'fontawesome-iconlist';
        list.className = 'fa-icon-list';
        list.innerHTML = html;

        PS_Cover.FontAwesome.list = list;
      }
    },


    // image resources for use in cover images
    Images : {

      // call and build the image overlay
      call : function (caller) {
        if (!document.getElementById('select-image-modal')) {
          var overlay = document.createElement('DIV'),
              modal = document.createElement('DIV'),
              str = '<h1 id="select-image-title">Select a Category</h1><div id="select-image-container">',
              i;

          overlay.addEventListener('click', PS_Cover.Images.close);
          overlay.id = 'select-image-overlay';
          modal.id = 'select-image-modal';

          for (i in PS_Cover.Images.list) {
            str += '<div class="select-image-category" onclick="PS_Cover.Images.get(\'' + i + '\');" style="background-image:url(' + PS_Cover.Images.list[i].thumb + ')"></div>';
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
        for (var str = '<h1 id="select-image-title">Select an Image</h1><span class="select-image-back" onclick="PS_Cover.Images.close();PS_Cover.Images.call();"><i class="fa fa-chevron-left"></i> Back</span><div id="select-image-container"><div id="select-image-list">', i = 0, j = PS_Cover.Images.list[category].images.length; i < j; i++) {
          str += '<img class="select-image-option" src="' + PS_Cover.Images.list[category].images[i] + '" onclick="PS_Cover.Images.insert(this.src);">';
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
            'https://i58.servimg.com/u/f58/18/21/60/73/cole411.png'
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

        '<span class="arrow-box">'+
          '<i class="fa fa-arrow-up"></i>'+
          '<i class="fa fa-arrow-down"></i>'+
          '<i class="fa fa-arrow-left"></i>'+
          '<i class="fa fa-arrow-right"></i>'+
        '</span>'+

        '<span class="layer-move-box">'+
          '<i class="fa fa-sort-asc"></i>'+
          '<i class="fa fa-sort-desc"></i>'+
        '</span>'+

        '<i class="fa fa-times"></i>'+
      '</div>'
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


  // clone text, image, etc.. rows
  for (var a = document.querySelectorAll('.tools-add'), i = 0, j = a.length; i < j; i++) {
    a[i].dataset.clone = a[i].parentNode.parentNode.getElementsByTagName('DIV')[0].innerHTML
                         .replace(/value=".*?"/, 'value=""')
                         .replace(/data-x=".*?"/, 'data-x="0"')
                         .replace(/data-y=".*?"/, 'data-y="0"');
  }


  // open the cover in a new window so the user can take a screenshot / download the image
  document.getElementById('download-ps4-cover').addEventListener('click', function () {
    window.open().document.write(
      '<style>'+
        'body{padding:0;margin:0;background:#000;cursor:none}'+
        '#creation-info{position:fixed;left:0;bottom:0;color:#CCC;font-size:16px;font-family:Arial;padding:6px;}'+
      '</style>'+

      '<img src="' + PS_Cover.canvas.toDataURL('image/png') + '" alt="PS4 Cover">'+

      '<div id="creation-info">'+
        '<p>Created with PS4 Cover Generator</p>'+
        '<p>sethclydesdale.github.io/ps4-cover-generator/</p>'+
      '</div>'
    );
  });


  // initialize an interval to move the specified image in the specified direction while the mouse is held down
  document.addEventListener('mousedown', function (e) {
    var that = e.target;

    if (/fa-arrow/.test(that.className) && !PS_Cover.moving) {
      PS_Cover.moving = true;
      PS_Cover.mover = window.setInterval(function() {
        var input = that.parentNode.parentNode.parentNode.parentNode.getElementsByTagName('INPUT')[0],
            coord = /up|down/.test(that.className) ? 'y' : 'x';

        input.dataset[coord] = +input.dataset[coord] + (/up|left/.test(that.className) ? -1 : +1);
        PS_Cover.draw();
      }, 10);
    }
  });


  // clear the movement interval when the mouse button is released
  document.addEventListener('mouseup', function () {
    if (PS_Cover.moving) {
      PS_Cover.moving = false;
      window.clearInterval(PS_Cover.mover);
    }
  });


  // various canvas actions
  document.addEventListener('click', function (e) {
    var that = e.target;

    if (that.className == 'fa fa-times') {
      if (confirm('You are about to delete this layer.\nDo you want to continue?')) {
        that.parentNode.parentNode.parentNode.parentNode.removeChild(that.parentNode.parentNode.parentNode);
        PS_Cover.draw();
      }

    } else if (/fa-icon-opt/.test(that.className)) {
      that.parentNode.parentNode.parentNode.getElementsByTagName('INPUT')[0].value += ' ' + that.innerHTML;
      PS_Cover.draw();

    } else if (!/fa-icon-opt|fa-caller|fa-icon-list/.test(that.className) && document.getElementById('fontawesome-iconlist')) {
      PS_Cover.FontAwesome.call();

    } else if (/fa-sort-asc/.test(that.className)) {
      var row = that.parentNode.parentNode.parentNode.parentNode;
      document.getElementById('cover-layers').insertBefore(row, row.previousSibling);
      PS_Cover.draw();

    } else if (/fa-sort-desc/.test(that.className)) {
      var layers = document.getElementById('cover-layers'),
          row = that.parentNode.parentNode.parentNode.parentNode,
          next = row.nextSibling.nextSibling;

      next ? layers.insertBefore(row, next) : layers.appendChild(row);

      PS_Cover.draw();

    }
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
  document.getElementById('cover-tools-title').addEventListener('click', function () {
    var tools = document.getElementById('cover-tools');

    if (this.className == 'hidden') {
      this.className = '';
      tools.className = '';

    } else {
      this.className = 'hidden';
      tools.className = 'hidden';
    }
  });


  // ColorPicker Prototype for PS4 and browsers that don't support input[type="color"]
  // Created by Seth Clydesdale
  window.ColorInpicker = {

    // init the color picker
    init : function (config) {
      config = config || {};

      for (var a = document.querySelectorAll('.color-inpicker'), i = 0, j = a.length, picker, str; i < j; i++) {
        a[i].className = a[i].className.replace(/(?:\s|)color-inpicker/, '');

        picker = document.createElement('SPAN');
        picker.className = 'color-inpicker-box';
        picker.style.backgroundColor = a[i].value || '#000000';

        picker.addEventListener('click', function () {
          ColorInpicker.call(this);
        });

        if (config.hide) {
          a[i].style.display = 'none';
        } else {
          a[i].addEventListener('input', function() {
            var picker = this.previousSibling;
            picker.style.backgroundColor = this.value || '#000000';
          });
        }

        a[i].parentNode.insertBefore(picker, a[i]);
      }

      picker = document.createElement('DIV');
      picker.id = 'color-inpicker-box';

      picker.addEventListener('mouseleave', function() {
        this.parentNode.removeChild(this);
      });

      if (!ColorInpicker.picker) {
        for (a = ['Red', 'Green', 'Blue'], i = 0, j = a.length, str = ''; i < j; i++) {
          str += '<div id="color-value-' + a[i].toLowerCase() + '" class="color-inpicker-row">'+
            '<span class="color-label">' + a[i] + ' : </span>'+
            '<span class="color-down" onmousedown="ColorInpicker.color(this, 0);" onmouseup="ColorInpicker.stop();" onmouseout="ColorInpicker.stop();"></span>'+
            '<span class="color-bar"><span class="color-bar-inner"></span></span>'+
            '<span class="color-up" onmousedown="ColorInpicker.color(this, 1);" onmouseup="ColorInpicker.stop();" onmouseout="ColorInpicker.stop();"></span>'+
            '<span class="color-value">0</span>'+
          '</div>';
        }

        picker.innerHTML = str + '<div id="color-value-result"></div>';

        this.picker = picker;
      }
    },


    // call the color selector
    call : function (that) {
      if (document.getElementById('color-inpicker-box')) {
        ColorInpicker.picker.parentNode.removeChild(ColorInpicker.picker);

        if (ColorInpicker.last != that) {
          ColorInpicker.call(that);
        }

      } else {
        var rgb = that.style.backgroundColor.replace(/rgb\(|\)/g, '').split(','),
            bar = ColorInpicker.picker.querySelectorAll('.color-bar-inner'),
            val = ColorInpicker.picker.querySelectorAll('.color-value'),
            offset = that.getBoundingClientRect(),
            i, j;

        ColorInpicker.last = that;
        ColorInpicker.input = that.nextSibling;
        ColorInpicker.picker.style.left = offset.left + 'px';

        for (i = 0, j = bar.length; i < j; i++) {
          bar[i].style.backgroundColor = 'rgb(' + ( [rgb[i] + ', 0, 0', '0, ' + rgb[i] + ', 0', '0, 0, ' + rgb[i]][i] ) + ')';
          bar[i].style.width = (rgb[i] / 255 * 100) + '%';

          val[i].innerHTML = rgb[i];
        }

        ColorInpicker.picker.querySelector('#color-value-result').style.backgroundColor = that.style.backgroundColor;

        that.parentNode.insertBefore(ColorInpicker.picker, that);
      }
    },


    // edit the color
    color : function (that, inc) {
      var active = that.parentNode.querySelectorAll('.color-bar-inner, .color-value'),

          color = {
            red : 0,
            green : 1,
            blue : 2
          }[that.parentNode.id.replace(/color-value-/, '')],

          result = ColorInpicker.picker.querySelector('#color-value-result'),
          values = ColorInpicker.picker.querySelectorAll('.color-value'),
          n = +active[1].innerHTML,
          rgb,
          hex;


      if (!ColorInpicker.coloring) {
        ColorInpicker.coloring = true;

        ColorInpicker.int = window.setInterval(function() {
          if (inc && n > 254 || !inc && n < 1) {
            ColorInpicker.stop();

          } else {
            active[1].innerHTML = +active[1].innerHTML + (inc ? +1 : -1);

            n = +active[1].innerHTML;

            rgb = [
              +values[0].innerHTML,
              +values[1].innerHTML,
              +values[2].innerHTML
            ];

            hex = [
              rgb[0].toString(16),
              rgb[1].toString(16),
              rgb[2].toString(16)
            ];

            active[0].style.backgroundColor = 'rgb(' + ( [
              n + ', 0, 0',
              '0, ' + n + ', 0',
              '0, 0, ' + n
            ][color] ) + ')';

            active[0].style.width = (n / 255 * 100) + '%';
            result.style.backgroundColor = 'rgb(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ')';

            // color-inpicker-box
            ColorInpicker.picker.nextSibling.style.backgroundColor = result.style.backgroundColor;

            // original input
            ColorInpicker.picker.nextSibling.nextSibling.value = ('#' + (hex[0].length == 1 ? '0' + hex[0] : hex[0]) +
                                                                        (hex[1].length == 1 ? '0' + hex[1] : hex[1]) +
                                                                        (hex[2].length == 1 ? '0' + hex[2] : hex[2])).toUpperCase();

            ColorInpicker.callback && ColorInpicker.callback(that);
          }
        }, 25);
      }
    },


    // kill the interval
    stop : function () {
      ColorInpicker.coloring = false;
      window.clearInterval(ColorInpicker.int);
    }
  };


  // Detect if a font has been loaded before drawing to the canvas
  // FontDetect created by JenniferSimonds : https://github.com/JenniferSimonds/FontDetect
  FontDetect=function(){function e(){if(!n){n=!0;var e=document.body,t=document.body.firstChild,i=document.createElement("div");i.id="fontdetectHelper",r=document.createElement("span"),r.innerText="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",i.appendChild(r),e.insertBefore(i,t),i.style.position="absolute",i.style.visibility="hidden",i.style.top="-200px",i.style.left="-100000px",i.style.width="100000px",i.style.height="200px",i.style.fontSize="100px"}}function t(e,t){return e instanceof Element?window.getComputedStyle(e).getPropertyValue(t):window.jQuery?$(e).css(t):""}var n=!1,i=["serif","sans-serif","monospace","cursive","fantasy"],r=null;return{onFontLoaded:function(t,i,r,o){if(t){var s=o&&o.msInterval?o.msInterval:100,a=o&&o.msTimeout?o.msTimeout:2e3;if(i||r){if(n||e(),this.isFontLoaded(t))return void(i&&i(t));var l=this,f=(new Date).getTime(),d=setInterval(function(){if(l.isFontLoaded(t))return clearInterval(d),void i(t);var e=(new Date).getTime();e-f>a&&(clearInterval(d),r&&r(t))},s)}}},isFontLoaded:function(t){var o=0,s=0;n||e();for(var a=0;a<i.length;++a){if(r.style.fontFamily='"'+t+'",'+i[a],o=r.offsetWidth,a>0&&o!=s)return!1;s=o}return!0},whichFont:function(e){for(var n=t(e,"font-family"),r=n.split(","),o=r.shift();o;){o=o.replace(/^\s*['"]?\s*([^'"]*)\s*['"]?\s*$/,"$1");for(var s=0;s<i.length;s++)if(o==i[s])return o;if(this.isFontLoaded(o))return o;o=r.shift()}return null}}}();



  // universal callback to execute when the color picker value changes
  ColorInpicker.callback = function (that) {
    if (/cover-text-/.test(ColorInpicker.input.className)) {
      PS_Cover.updateInput(ColorInpicker.input);

    } else {

      PS_Cover.draw();
    }
  };

  // create preset
  PS_Cover.add('text', {
    value : 'PS4 Cover Generator',
    size : 40,
    x : (PS_Cover.canvas.width / 2) - 175,
    y : 120
  });

  PS_Cover.add('image', {
    value : 'https://sethclydesdale.github.io/ps4-cover-generator/image/ps4.png',
    x : (PS_Cover.canvas.width / 2) - 100,
    y : (PS_Cover.canvas.height / 2) - 100
  });
}());

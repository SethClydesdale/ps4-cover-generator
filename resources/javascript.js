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
        PS_Cover.scale(scale, function() {
          PS_Cover.ctx.drawImage(img, x, y);
        });
      } else {
        img.addEventListener('load', function () {
          PS_Cover.scale(scale, function() {
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


    // adjusts the scale of a single canvas element
    scale : function (scale, callback) {
      PS_Cover.ctx.save();
      PS_Cover.ctx.scale(scale, scale);
      callback();
      PS_Cover.ctx.restore();
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
          '<input class="cover-image big" type="text" value="' + ( settings.value || '' ) + '" data-scale="' + ( settings.size || '100' ) + '" data-x="' + ( settings.x || '0' ) + '" data-y="' + ( settings.y || '0' ) + '" oninput="PS_Cover.draw();">'+
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
          '<a class="fa fa-arrow-up"></a>'+
          '<a class="fa fa-arrow-down"></a>'+
          '<a class="fa fa-arrow-left"></a>'+
          '<a class="fa fa-arrow-right"></a>'+
        '</span>'+

        '<span class="layer-move-box">'+
          '<a class="fa fa-sort-asc" href="#" onclick="return false;"></a>'+
          '<a class="fa fa-sort-desc" href="#" onclick="return false;"></a>'+
        '</span>'+

        '<a class="fa fa-times" href="#" onclick="return false;"></a>'+
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


  // initialize an interval to move the specified image in the specified direction while the mouse is held down
  document.addEventListener('mousedown', function (e) {
    var that = e.target;

    if (that.parentNode.className == 'arrow-box' && /fa-arrow/.test(that.className) && !PS_Cover.moving) {
      PS_Cover.moving = true;
      PS_Cover.mover = window.setInterval(function() {
        var input = that.parentNode.parentNode.parentNode.parentNode.getElementsByTagName('INPUT')[0],
            coord = /up|down/.test(that.className) ? 'y' : 'x';

        input.dataset[coord] = +input.dataset[coord] + (/up|left/.test(that.className) ? -1 : +1);
        PS_Cover.draw();
      }, 1);
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

    // delete layer action
    if (that.className == 'fa fa-times' && that.parentNode.className == 'layer-controls') {
      if (confirm('You are about to delete this layer.\nDo you want to continue?')) {
        that.parentNode.parentNode.parentNode.parentNode.removeChild(that.parentNode.parentNode.parentNode);
        PS_Cover.draw();
      }

      // inserting FontAwesome icons
    } else if (/fa-icon-opt/.test(that.className)) {
      that.parentNode.parentNode.parentNode.getElementsByTagName('INPUT')[0].value += ' ' + that.innerHTML;
      PS_Cover.draw();

      // auto-hide FontAwesome icon list
    } else if (!/fa-icon-opt|fa-caller|fa-icon-list/.test(that.className) && document.getElementById('fontawesome-iconlist')) {
      PS_Cover.FontAwesome.call();

      // move layers up
    } else if (/fa-sort-asc/.test(that.className) && that.parentNode.className == 'layer-move-box') {
      var row = that.parentNode.parentNode.parentNode.parentNode;
      document.getElementById('cover-layers').insertBefore(row, row.previousSibling);
      PS_Cover.draw();

      // move layers down
    } else if (/fa-sort-desc/.test(that.className) && that.parentNode.className == 'layer-move-box') {
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


  // universal callback to execute when the color picker value changes
  ColorInpicker.callback = function (that) {
    if (/cover-text-/.test(ColorInpicker.input.className)) {
      PS_Cover.updateInput(ColorInpicker.input);

    } else {

      PS_Cover.draw();
    }
  };


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

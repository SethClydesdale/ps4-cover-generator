(function () {
  window.PS_Cover = {
    canvas : document.getElementById('ps4-cover-photo'),

    // used to draw images, text, etc.. onto the canvas
    draw : function () {
      PS_Cover.canvas.width = window.innerWidth;
      PS_Cover.canvas.height = 620;

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


          PS_Cover.loadImage(img, input.dataset.x, input.dataset.y)

        } else if (/text-layer/.test(layer[i].className)) {
          input = layer[i].querySelector('.cover-text');

          PS_Cover.ctx.fillStyle = input.dataset.color;
          PS_Cover.ctx.font = input.dataset.size + 'px ' + input.dataset.font;
          PS_Cover.ctx.fillText(input.value, input.dataset.x, input.dataset.y);
        }
      }

    },


    // function for adding new layers
    add : function (type, settings) {
      settings = settings ? settings : {};

      var row = document.createElement('DIV'),
          opts,
          i,
          j,
          loaded,
          selected;

      row.className = 'tools-row cover-layer';

      // adds a text layer
      if (type == 'text') {

        for (opts = '', i = 0, j = PS_Cover.fonts.length; i < j; i++) {
          loaded = false;
          selected = false;

          // set loaded attr
          if (/:loaded/.test(PS_Cover.fonts[i])) {
            loaded = true;
            PS_Cover.fonts[i] = PS_Cover.fonts[i].replace(/:loaded/, '');
          }

          // set selected attr
          if (/:selected/.test(PS_Cover.fonts[i])) {
            selected = true;
            PS_Cover.fonts[i] = PS_Cover.fonts[i].replace(/:selected/, '');
          }

          opts += '<option value="' + PS_Cover.fonts[i] + '"' + ( loaded ? ' data-loaded="true"' : '' ) + ( selected ? ' selected' : '' ) + '>' + PS_Cover.fonts[i] + '</option>';
        }


        row.className += ' text-layer';
        row.innerHTML =
        '<div class="main-layer-input">'+
          '<input class="cover-text big" type="text" value="' + (settings.value || '') + '" data-size="' + ( settings.size || '20' ) + '" data-color="' + ( settings.color || '#FFFFFF' ) + '" data-font="PlayStation" data-x="' + ( settings.x || '0' ) + '" data-y="' + ( settings.y || '0' ) + '" oninput="PS_Cover.draw();">'+
          PS_Cover.templates.layer_controls+
        '</div>'+
        '<div class="cover-text-tools">'+
          '<input class="cover-text-size" type="number" value="' + ( settings.size || '20' ) + '" oninput="PS_Cover.updateText(this);">'+
          '<input class="cover-text-color" type="text" value="' + ( settings.color || '#FFFFFF' ) + '" oninput="PS_Cover.updateText(this);">'+
          '<i class="fa fa-smile-o fa-caller" onclick="PS_Cover.FontAwesome.call(this);" style="display:none;"></i>'+
          '<select class="cover-text-font" onchange="PS_Cover.updateText(this);">'+
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
          '<input class="cover-image big" type="text" value="' + ( settings.value || '' ) + '" data-x="' + ( settings.x || '0' ) + '" data-y="' + ( settings.y || '0' ) + '" oninput="PS_Cover.draw();">'+
          PS_Cover.templates.layer_controls+
        '</div>';
      }

      document.getElementById('cover-layers').appendChild(row);
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


    // wait for images to load before drawing them
    loadImage : function (img, x, y) {
      if (img.complete) {
        PS_Cover.ctx.drawImage(img, x, y);
      } else {
        img.addEventListener('load', function () {
          PS_Cover.ctx.drawImage(img, x, y);
        });
      }
    },


    updateText : function (that) {
      var type = that.className.replace(/cover-text-/, ''),
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
        input.style.fontFamily = that.value;
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

          PS_Cover.FontAwesome.list.style.marginTop = '-' + (200 + offset.height) + 'px';
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


    // html templates
    templates : {
      layer_controls :
      '<div class="layer-controls">'+
        '<i class="fa fa-times"></i>'+
        '<span class="arrow-box">'+
          '<i class="fa fa-arrow-up"></i>'+
          '<i class="fa fa-arrow-down"></i>'+
          '<i class="fa fa-arrow-left"></i>'+
          '<i class="fa fa-arrow-right"></i>'+
        '</span>'+
        '<i class="fa fa-sort-asc"></i>'+
        '<i class="fa fa-sort-desc"></i>'+
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
    window.open().document.write('<style>body{padding:0;margin:0;background:#000}</style><img src="' + PS_Cover.canvas.toDataURL('image/png') + '" alt="PS4 Cover">');
  });


  // toggle toolbox
  document.getElementById('cover-tools-title').addEventListener('click', function () {
    var tools = document.getElementById('cover-tools');

    if (this.className == 'hidden') {
      this.className = '';
      tools.className = '';
      document.getElementById('cover-tools-offset').style.marginBottom = '';

    } else {
      this.className = 'hidden';
      tools.className = 'hidden';
      document.getElementById('cover-tools-offset').style.marginBottom = '30px';
    }
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


  // add / delete actions
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
      document.getElementById('cover-layers').insertBefore(that.parentNode.parentNode.parentNode, that.parentNode.parentNode.parentNode.previousSibling);
      PS_Cover.draw();

    } else if (/fa-sort-desc/.test(that.className)) {
      var layers = document.getElementById('cover-layers'),
          row = that.parentNode.parentNode.parentNode,
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


  // Detect if a font has been loaded before drawing to the canvas
  // FontDetect created by JenniferSimonds : https://github.com/JenniferSimonds/FontDetect
  FontDetect=function(){function e(){if(!n){n=!0;var e=document.body,t=document.body.firstChild,i=document.createElement("div");i.id="fontdetectHelper",r=document.createElement("span"),r.innerText="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",i.appendChild(r),e.insertBefore(i,t),i.style.position="absolute",i.style.visibility="hidden",i.style.top="-200px",i.style.left="-100000px",i.style.width="100000px",i.style.height="200px",i.style.fontSize="100px"}}function t(e,t){return e instanceof Element?window.getComputedStyle(e).getPropertyValue(t):window.jQuery?$(e).css(t):""}var n=!1,i=["serif","sans-serif","monospace","cursive","fantasy"],r=null;return{onFontLoaded:function(t,i,r,o){if(t){var s=o&&o.msInterval?o.msInterval:100,a=o&&o.msTimeout?o.msTimeout:2e3;if(i||r){if(n||e(),this.isFontLoaded(t))return void(i&&i(t));var l=this,f=(new Date).getTime(),d=setInterval(function(){if(l.isFontLoaded(t))return clearInterval(d),void i(t);var e=(new Date).getTime();e-f>a&&(clearInterval(d),r&&r(t))},s)}}},isFontLoaded:function(t){var o=0,s=0;n||e();for(var a=0;a<i.length;++a){if(r.style.fontFamily='"'+t+'",'+i[a],o=r.offsetWidth,a>0&&o!=s)return!1;s=o}return!0},whichFont:function(e){for(var n=t(e,"font-family"),r=n.split(","),o=r.shift();o;){o=o.replace(/^\s*['"]?\s*([^'"]*)\s*['"]?\s*$/,"$1");for(var s=0;s<i.length;s++)if(o==i[s])return o;if(this.isFontLoaded(o))return o;o=r.shift()}return null}}}();
}());

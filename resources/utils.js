/****** UTILITIES ********
** 01. ColorPicker
** 02. Inumber
** 03. parentsUntil
** 04. checkbox replacer
** 05. Font Detect
**************************/

/* -- 01. Color Picker -- */
// ColorPicker Prototype for PS4 and browsers that don't support input[type="color"]
window.ColorInpicker = {

  // init the color picker
  init : function (config) {
    config = config || {};

    for (var a = document.querySelectorAll('.color-inpicker'), i = 0, j = a.length, picker, str; i < j; i++) {
      a[i].className = a[i].className.replace(/(?:\s|)color-inpicker/, '');

      picker = document.createElement('A');
      picker.href = '#';
      picker.className = 'color-inpicker-box';
      picker.style.backgroundColor = a[i].value || '#000000';

      picker.addEventListener('click', function (e) {
        ColorInpicker.call(this);
        e.preventDefault();
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

      // preset colors
      var presets = [
        '#000000',
        '#333333',
        '#666666',
        '#999999',
        '#CCCCCC',
        '#FFFFFF',
        '#ff0000',
        '#ff4000',
        '#ff8000',
        '#ffbf00',
        '#ffff00',
        '#bfff00',
        '#80ff00',
        '#40ff00',
        '#00ff00',
        '#00ff40',
        '#00ff80',
        '#00ffbf',
        '#00ffff',
        '#00bfff',
        '#0080ff',
        '#0040ff',
        '#0000ff',
        '#4000ff',
        '#8000ff',
        '#bf00ff',
        '#ff00ff',
        '#ff00bf',
        '#ff0080',
        '#ff0040'
      ], i = 0, j = presets.length, prestr = '';

      for (; i < j; i++) {
        prestr += '<a href="#" style="background-color:' + presets[i] + '" onclick="ColorInpicker.applyPreset(this.style.backgroundColor); return false"></a>';
      }

      picker.innerHTML =
      '<div id="color-value-result"></div>'
      + str +
      '<div id="color-inpicker-presets">'+
        prestr+
        '<a class="fa fa-random" href="#" style="background-color:' + PS_Cover.randomColor() + ';" onclick="ColorInpicker.applyPreset(); return false"></a>'+
      '</div>';

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
      ColorInpicker.picker.style.left = offset[/cover-layer/.test(that.parentNode.parentNode.className) ? 'right' : 'left'] + 'px';

      for (i = 0, j = bar.length; i < j; i++) {
        bar[i].style.backgroundColor = 'rgb(' + ( [rgb[i] + ', 0, 0', '0, ' + rgb[i] + ', 0', '0, 0, ' + rgb[i]][i] ) + ')';
        bar[i].style.width = (rgb[i] / 255 * 100) + '%';

        val[i].innerHTML = rgb[i];
      }

      ColorInpicker.picker.querySelector('#color-value-result').style.backgroundColor = that.style.backgroundColor;

      that.parentNode.insertBefore(ColorInpicker.picker, that);
    }
  },


  // apply a color preset
  applyPreset : function (color) {
    color = (color || PS_Cover.randomColor(true)).replace(/rgb\(|\)/g, '').split(',');

    for (var rgb = ColorInpicker.picker.querySelectorAll('.color-value'), i = 0, j = rgb.length; i < j; i++) {
      rgb[i].innerHTML = i == 0 ? (+color[i] - 1) : color[i];
    }

    ColorInpicker.color(document.getElementById('color-value-red').querySelector('.color-up'), 1);
    window.setTimeout(function () {
      var last = ColorInpicker.last;
      last.style.backgroundColor = color;
      ColorInpicker.stop();
      ColorInpicker.call(last);
      ColorInpicker.call(last);
    }, 26);
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


/* -- 01. Inumber -- */
// Prototype for adding arrow controls to input[type="number"] on the PS4 web browser or browsers that don't support it
window.Inumber = {

  // add arrows to number inputs
  init : function () {
    for (var a = document.querySelectorAll('input[type="number"]:not([data-inumbered])'), i = 0, j = a.length, offset; i < j; i++) {
      offset = a[i].getBoundingClientRect();
      a[i].dataset.inumbered = true;

      a[i].insertAdjacentHTML('afterend',
        '<span class="Inumber-arrows" style="height:' + Math.abs(offset.top - offset.bottom) + 'px">'+
          '<span class="Inumber-up" onmousedown="Inumber.update(this.parentNode.previousSibling, +1);" onmouseup="Inumber.stop();" onmouseleave="Inumber.stop();"></span>'+
          '<span class="Inumber-down" onmousedown="Inumber.update(this.parentNode.previousSibling, -1);" onmouseup="Inumber.stop();" onmouseleave="Inumber.stop();"></span>'+
        '</span>'
      );
    }
  },

  // update the input field's value every 50ms
  update : function (caller, addition) {
    if (!Inumber.counting) {
      Inumber.counting = true;

      Inumber.int = window.setInterval(function () {
        var sum = +caller.value + addition,
            max = caller.max || Infinity,
            min = caller.min || -Infinity;

        if (sum > max || sum < min) {
          Inumber.stop();
        } else {
          caller.value = sum;
          Inumber.callback && Inumber.callback(caller);
        }
      }, 50);
    }
  },

  // stop updating the input field's value
  stop : function () {
    if (Inumber.counting) {
      Inumber.counting = false;
      window.clearInterval(Inumber.int);
    }
  }
};

// change the random color every 3s when the color picker is opened
window.setInterval(function() {
  var randomColor = document.querySelector('#color-inpicker-presets .fa-random');

  if (randomColor) {
    randomColor.style.backgroundColor = PS_Cover.randomColor();
  }
}, 3000);


/* -- 03. parentsUntil -- */
// loop through a node's parents until a match is found
// pass along a single id, class, or tagName as the selector, to find the parent that matches it
Element.prototype.parentsUntil = function (selector) {
  var parent = this.parentNode,
      match = false,
      a, i, j,
      attr = selector.charAt(0) == '.' ? 'className' :
             selector.charAt(0) == '#' ? 'id' : 'tagName';

  selector = attr == 'tagName' ? selector.toUpperCase() : selector.slice(1);

  while (parent && !match) {
    if (attr == 'className') {
      for (a = parent[attr].split(' '), i = 0, j = a.length; i < j; i++) {
        if (selector == a[i]) {
          match = true;
          break;
        }
      }

    } else if (selector == parent[attr]) {
      match = true;
    }

    if (!match) {
      parent = parent.parentNode;
    }
  }

  return parent;
};


/* -- 04. checkbox replacer -- */
// replaces default checkboxes with pseudo-checkboxes that we can apply custom styles to
function replaceCheckboxes () {
  for (var a = document.querySelectorAll('input[type="checkbox"]:not([data-old-checkbox])'), i = 0, j = a.length, newCheckbox, next, parent; i < j; i++) {
    a[i].dataset.oldCheckbox = true;
    next = a[i].nextSibling;
    parent = a[i].parentNode;

    newCheckbox = document.createElement('A');
    newCheckbox.href = '#';
    newCheckbox.className = 'pseudo-checkbox';
    newCheckbox.onclick = function () {
      this.previousSibling.click();
      return false;
    };

    next ? parent.insertBefore(newCheckbox, next) : parent.appendChild(newCheckbox);
  }
};


/* -- 05. FontDetect -- */
// Detect if a font has been loaded before drawing to the canvas
// FontDetect created by JenniferSimonds : https://github.com/JenniferSimonds/FontDetect
FontDetect=function(){function e(){if(!n){n=!0;var e=document.body,t=document.body.firstChild,i=document.createElement("div");i.id="fontdetectHelper",r=document.createElement("span"),r.innerText="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",i.appendChild(r),e.insertBefore(i,t),i.style.position="absolute",i.style.visibility="hidden",i.style.top="-200px",i.style.left="-100000px",i.style.width="100000px",i.style.height="200px",i.style.fontSize="100px"}}function t(e,t){return e instanceof Element?window.getComputedStyle(e).getPropertyValue(t):window.jQuery?$(e).css(t):""}var n=!1,i=["serif","sans-serif","monospace","cursive","fantasy"],r=null;return{onFontLoaded:function(t,i,r,o){if(t){var s=o&&o.msInterval?o.msInterval:100,a=o&&o.msTimeout?o.msTimeout:2e3;if(i||r){if(n||e(),this.isFontLoaded(t))return void(i&&i(t));var l=this,f=(new Date).getTime(),d=setInterval(function(){if(l.isFontLoaded(t))return clearInterval(d),void i(t);var e=(new Date).getTime();e-f>a&&(clearInterval(d),r&&r(t))},s)}}},isFontLoaded:function(t){var o=0,s=0;n||e();for(var a=0;a<i.length;++a){if(r.style.fontFamily='"'+t+'",'+i[a],o=r.offsetWidth,a>0&&o!=s)return!1;s=o}return!0},whichFont:function(e){for(var n=t(e,"font-family"),r=n.split(","),o=r.shift();o;){o=o.replace(/^\s*['"]?\s*([^'"]*)\s*['"]?\s*$/,"$1");for(var s=0;s<i.length;s++)if(o==i[s])return o;if(this.isFontLoaded(o))return o;o=r.shift()}return null}}}();

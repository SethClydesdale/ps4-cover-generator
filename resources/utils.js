/* UTILITIES
* 01. ColorPicker
* 02. Inumber
* 03. Font Detect
**/

/* -- 01. Color Picker -- */
// ColorPicker Prototype for PS4 and browsers that don't support input[type="color"]
// Created by Seth Clydesdale
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


/* -- 01. Inumber -- */
// Prototype for adding arrow controls to input[type="number"] on the PS4 web browser or browsers that don't support it
// Created by Seth Clydesdale
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


/* -- 01. FontDetect -- */
// Detect if a font has been loaded before drawing to the canvas
// FontDetect created by JenniferSimonds : https://github.com/JenniferSimonds/FontDetect
FontDetect=function(){function e(){if(!n){n=!0;var e=document.body,t=document.body.firstChild,i=document.createElement("div");i.id="fontdetectHelper",r=document.createElement("span"),r.innerText="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",i.appendChild(r),e.insertBefore(i,t),i.style.position="absolute",i.style.visibility="hidden",i.style.top="-200px",i.style.left="-100000px",i.style.width="100000px",i.style.height="200px",i.style.fontSize="100px"}}function t(e,t){return e instanceof Element?window.getComputedStyle(e).getPropertyValue(t):window.jQuery?$(e).css(t):""}var n=!1,i=["serif","sans-serif","monospace","cursive","fantasy"],r=null;return{onFontLoaded:function(t,i,r,o){if(t){var s=o&&o.msInterval?o.msInterval:100,a=o&&o.msTimeout?o.msTimeout:2e3;if(i||r){if(n||e(),this.isFontLoaded(t))return void(i&&i(t));var l=this,f=(new Date).getTime(),d=setInterval(function(){if(l.isFontLoaded(t))return clearInterval(d),void i(t);var e=(new Date).getTime();e-f>a&&(clearInterval(d),r&&r(t))},s)}}},isFontLoaded:function(t){var o=0,s=0;n||e();for(var a=0;a<i.length;++a){if(r.style.fontFamily='"'+t+'",'+i[a],o=r.offsetWidth,a>0&&o!=s)return!1;s=o}return!0},whichFont:function(e){for(var n=t(e,"font-family"),r=n.split(","),o=r.shift();o;){o=o.replace(/^\s*['"]?\s*([^'"]*)\s*['"]?\s*$/,"$1");for(var s=0;s<i.length;s++)if(o==i[s])return o;if(this.isFontLoaded(o))return o;o=r.shift()}return null}}}();

// proceeds to the next step
PS_Cover.Tutorial.next = function () {
  document.getElementById('tutorial-button-next').disabled = true;

  PS_Cover.Tutorial.focus(PS_Cover.Tutorial.step[PS_Cover.Tutorial.progress] && PS_Cover.Tutorial.step[PS_Cover.Tutorial.progress].noRemoval);
  PS_Cover.Tutorial.progress++;
  PS_Cover.Tutorial.focus();

  PS_Cover.Tutorial.msg.firstChild.innerHTML = PS_Cover.Tutorial.step[PS_Cover.Tutorial.progress].message;

  var percent = ((PS_Cover.Tutorial.progress / PS_Cover.Tutorial.quota) * 100).toFixed(2),
      step = PS_Cover.Tutorial.step[PS_Cover.Tutorial.progress];

  PS_Cover.Tutorial.bar.innerHTML = '<div id="tutorial-progress-bar" style="width:' + percent + '%;"></div>'+
                                    '<div id="tutorial-progress-text">' + percent + '%</div>';

  if (step.condition) {
    step.condition();
  } else {
    window.setTimeout(function() {
      document.getElementById('tutorial-button-next').disabled = false;
    }, 1000);
  }
};


// toggle focus on an element or elements in a step
PS_Cover.Tutorial.focus = function (noRemoval) {
  var step = PS_Cover.Tutorial.step[PS_Cover.Tutorial.progress];

  if (step && step.focus) {
    for (var a = document.querySelectorAll(step.focus.selectors), i = 0, j = a.length; i < j; i++) {
      a[i].dataset.tutorialFocus = a[i].dataset.tutorialFocus == 'true' ? '' : true;

      if (step.focus.position) {
        a[i].style.position = a[i].style.position ? '' : step.focus.position;
      }

      if (step.focus.noclick) {
        a[i].dataset.tutorialNoclick = a[i].dataset.tutorialNoclick == 'true' ? '' : true;
      }
    }

    if (step.focus.jump) {
      document.body.scrollTop = a[0].offsetTop - 210;
    }

    if (step.focus.event && !noRemoval) {
      for (var a = document.querySelectorAll(step.focus.event), i = 0, j = a.length; i < j; i++) {
        a[i].dataset.tutorialEvent = a[i].dataset.tutorialEvent == 'true' ? '' : true;
      }
    }
  }
};


// listen for a specific change
PS_Cover.Tutorial.listen = function (listener) {
  if (!PS_Cover.Tutorial.listener) {
    PS_Cover.Tutorial.listener = window.setInterval(function() {
      listener(function() {
        window.clearInterval(PS_Cover.Tutorial.listener);
        delete PS_Cover.Tutorial.listener;
      });
    }, 100);
  }
};


// all steps in the tutorial
PS_Cover.Tutorial.step = [
  {
    message : 'Welcome to the PS4 Cover Generator Tutorial! This tutorial will walk you through the basics of using the PS4 Cover Generator. Click the button below to proceed to the next step.'
  },


  {
    message : 'See the big canvas below? This is where you\'ll work on your Cover Image. Any changes you make to your Cover will be displayed here. Click the NEXT button to find out how to edit this canvas.',

    focus : {
      selectors : '#ps4-cover-photo',
      position : 'relative',
      jump : true
    }
  },


  {
    message : 'Welcome to the toolbox! This is where you\'ll make changes to the canvas, such as adding your favorite character, changing colors, adding text, and more..! How about we create a simple cover image to get you started? Go ahead and click the NEXT button to continue.',

    focus : {
      selectors : '#cover-tools-box',
      noclick : true
    }
  },


  {
    message : 'To get started, we first need to clear the canvas by deleting all existing layers. Click the "DELETE ALL" button in the toolbox to delete all the layers so we can start fresh!',

    focus : {
      selectors : '#cover-tools-box',
      event : '#delete-all',
      noclick : true
    },

    condition : function () {
      var del = document.querySelector('.tools-delete'),
          delTuto = function () {
            PS_Cover.deleteLayers(true);
            this.removeEventListener('click', delTuto);
            this.setAttribute('onclick', this.dataset.onclick);
            PS_Cover.Tutorial.next();
          };

      del.dataset.onclick = del.getAttribute('onclick');
      del.setAttribute('onclick', 'return false');

      del.addEventListener('click', delTuto);
      document.getElementById('cover-tools').scrollTop = 0;
    }
  },


  {
    message : 'Well done! You deleted all the existing layers from the canvas. Now it\'s time to add your own personal touch! Click the "ADD IMAGE" button to open up the image selector and add an image to the canvas. Choose anything you want!',

    focus : {
      selectors : '#cover-tools-box',
      event : '#add-image',
      noclick : true
    },

    condition : function () {
      document.getElementById('cover-tools').scrollTop = 0;

      PS_Cover.Tutorial.listen(function(stop) {
        var layer = document.querySelector('.main-layer-input');

        if (layer && layer.querySelector('.cover-input-value').value) {
          stop();
          PS_Cover.Tutorial.next();
        }
      });
    }
  },


  {
    message : 'Nice choice! Now that you have an image on the canvas things are starting to feel less empty. Once you\'re done admiring your handiwork, click the NEXT button to learn about layers and their controls.',

    focus : {
      selectors : '#ps4-cover-photo',
      position : 'relative',
      jump : true
    }
  },


  {
    message : 'Layers consist of three sections : The main input field, controls, and tools. We\'ll go over each section and their sub-options to get you familiar with how things work. But first let\'s go over the layer list, as it\'ll play a vital role in creating your cover image.'
  },


  {
    message : 'See the column on the right? That\'s the layer list. It shows all the layers in your cover image so you can easily keep track of and edit them.',

    focus : {
      selectors : '#cover-tools-layer-list',
      event : '#cover-tools-layer-list',
      noclick : true
    },

    condition : function () {
      var i = 4;

      while (i --> 0) {
        PS_Cover.add('shape', {
          x : Math.floor(Math.random() * (+PS_Cover.canvas.width - 40)),
          y : Math.floor(Math.random() * 200)
        });
      }

      window.setTimeout(function () {
        document.getElementById('tutorial-button-next').disabled = false;
      }, 1000);
    }
  },


  {
    message : 'If you want to edit a layer, all you have to do is click it in the layer list and the tools for editing it will show up on the left under SELECTED LAYER SETTINGS. Get these squares out of the way by clicking the image you just added.',

    focus : {
      selectors : '#cover-tools-layer-list',
      event : '.image-layer',
      noclick : true
    },

    condition : function () {
      function click () {
        this.removeEventListener('click', click);
        PS_Cover.Tutorial.next();
      };

      document.querySelector('.image-layer').addEventListener('click', click);
    }
  },


  {
    message : 'Well done! That was super easy, no? Remember to click the layers in the layer list whenever you want to edit their settings. If you ever find that the layer list is just in the way, feel free to click its title to make it go away. Go ahead and try that now!',

    focus : {
      selectors : '#cover-tools-layer-list',
      event : '#layer-list-title',
      noclick : true
    },

    condition : function () {
      var list = document.getElementById('cover-tools-layer-list'),
          a = document.querySelectorAll('.shape-layer'),
          i = 0,
          j = a.length;

      for (; i < j; i++) {
        PS_Cover.deleteLayer(a[i], true);
      }

      PS_Cover.Tutorial.listen(function (stop) {
        if (list.className == 'hidden') {
          stop();
          PS_Cover.Tutorial.next();
        }
      });
    }
  },


  {
    message : 'Much more roomy now, isn\'t it? If you ever want to see the layer list again, all you have to do is click the little blue bar on the right. Now click it and make up!',

    focus : {
      selectors : '#cover-tools-layer-list',
      event : '#layer-list-title, #cover-tools-layer-list',
      noclick : true
    },

    condition : function () {
      var list = document.getElementById('cover-tools-layer-list');

      PS_Cover.Tutorial.listen(function (stop) {
        if (!list.className) {
          stop();
          PS_Cover.Tutorial.next();
        }
      });
    }
  },


  {
    message : 'It\'s great to see that the both of you made up and got to learn a little something about each other. Now you know how to use the layer list, which means you\'re now ready to learn about LAYERS!',
  },


  {
    message : 'This is the main input field, it allows you to insert text, links, or select options from a predefined list. In this input field we can insert direct image links from the web or the image selector.',

    focus : {
      selectors : '#cover-tools-box',
      event : '.cover-input-value',
      noclick : true
    }
  },


  {
    message : 'Sometimes main input fields will have additional options like, colors, fill, or in your case a search button for images. Clicking this button will open the image selector so you can choose another image. Go ahead and click it if you want a brand new image, otherwise click the NEXT button to move on.',

    focus : {
      selectors : '#cover-tools-box',
      event : '.image-caller',
      noclick : true
    }
  },


  {
    message : 'This little area is the layer controls. It allows you to rotate, move, change the stack order of, and delete the layer.',

    focus : {
      selectors : '#cover-tools-box',
      event : '.layer-controls',
      noclick : true
    }
  },


  {
    message : 'These two buttons rotate the layer. The first button freely rotates the layer, whereas the second button snap rotates the layer 90 degees. Go ahead and click these buttons to get a feel for how they work. When you\'re done spinning around, click the NEXT button to move on.',

    focus : {
      selectors : '#cover-tools-box',
      event : '.layer-rotate-box a',
      noclick : true
    }
  },


  {
    message : 'These four buttons move the layer in the direction they\'re pointing. Don\'t like where your image is? Want to move it somewhere else? Then click and hold down the ' + ( PS_Cover.isPS4 ? '<i class="ps-button cross"></i>' : 'Mouse' ) + ' Button on one of these buttons to move it! Seriously though, play around with these buttons to get acquainted with them, because they\'re gonna be your best friends. When you\'re finished playing with your new BFFs, click the NEXT button to move on.',

    focus : {
      selectors : '#cover-tools-box',
      event : '.arrow-box a',
      noclick : true
    }
  },


  {
    message : 'These buttons change the stack order of the layers. For example, the topmost layer is shown on top of everything and the bottommost layer is covered by everything else. If you want to bring a layer to the front so it\'s not covered by anything, click these buttons to change the stack order of each layer. Go ahead and show this square who\'s boss by bringing your image back to the front!',

    noRemoval : true,
    focus : {
      selectors : '#cover-tools-box',
      event : '.layer-move-box a',
      noclick : true
    },

    condition : function () {
      PS_Cover.add('shape', {
        x : 0,
        y : 0,
        noScroll : 1,
        noOpen : true,
        width : PS_Cover.canvas.width,
        height : PS_Cover.canvas.height
      });

      var a = document.querySelectorAll('.fa-sort-asc, .fa-sort-desc'),
          i = 0,
          j = a.length,
          moveTuto = function () {
            PS_Cover.openLayer(document.querySelector('.shape-layer'));
            PS_Cover.Tutorial.next();
          };

      for (; i < j; i++) {
        a[i].addEventListener('click', moveTuto);
      }
    }
  },


  {
    message : 'Great job! You really showed that square who\'s boss! Let\'s teach it one more lesson by deleting it from our Cover Image. See that cross? Clicking it will delete the layer. Go ahead and take out the trash!',

    noRemoval : true,
    focus : {
      selectors : '#cover-tools-box',
      event : '.layer-controls .fa-times',
      noclick : true
    },

    condition : function () {
      var del = document.querySelector('.layer-controls .fa-times');

      del.setAttribute('onclick', 'return false');
      del.addEventListener('click', function () {
        PS_Cover.deleteLayer(document.querySelector('.shape-layer'), true);
        PS_Cover.openLayer(document.querySelector('.image-layer'));
        PS_Cover.Tutorial.next();
      });
    }


  },


  {
    message : 'Phew, thanks for taking care of that rogue square! Just now you learned how to use the layer controls, while also saving your Cover Image from invading squares. Are you ready to learn about the more advanced tools? Click NEXT if you are, if not go get a snack and take a short break.',

    focus : {
      selectors : '#ps4-cover-photo',
      position : 'relative',
      jump : true
    }
  },


  {
    message : 'Last but not least is the layer tools! These tools, depending on the layer, allow you to adjust the opacity, scale, raw coordinates, and more. Go ahead and play with these tools to see how they work. If you\'re not sure what something does, click the blue icons for a hint. When you\'re done playing around, click the NEXT button to move on.',

    focus : {
      selectors : '#cover-tools-box',
      event : '.cover-input-tools input, .cover-input-tools select, .cover-input-tools a',
      noclick : true
    }
  },


  {
    message : 'That about sums up all I can teach you about layers. Kudos to you for putting up with me this long! How\'s your Cover looking so far? Good? Bad? Missing Something? How about we change the background color in the canvas settings? Click the NEXT button to learn about some of the canvas settings.',

    focus : {
      selectors : '#ps4-cover-photo',
      position : 'relative',
      jump : true
    }
  },


  {
    message : 'The canvas settings allow you to adjust some basic settings for the canvas, such as the background color. Click the color palette to pick a new background color for your Cover Image.',

    focus : {
      selectors : '#cover-tools-box',
      event : '.color-inpicker-box',
      noclick : true
    },

    condition : function () {
      document.getElementById('cover-tools').scrollTop = 9999;

      var bg = document.getElementById('cover-bg-color'),
          oldVal = bg.value;

      PS_Cover.Tutorial.listen(function(stop) {
        if (bg.value != oldVal) {
          stop();
          PS_Cover.Tutorial.next();
        }
      });
    }
  },


  {
    message : 'Your Cover Image is looking FAB-U-LOUS with that new coat of paint! But how would it look on your profile? Hmm....',

    focus : {
      selectors : '#ps4-cover-photo',
      position : 'relative',
      jump : true
    }
  },


  {
    message : 'If you want to preview how your Cover Image would look on an actual Profile, then all you need to do is click the "Show Demo Profile" checkbox. Go ahead and click it to see how your Cover Image would look once applied to someones profile.',

    focus : {
      selectors : '#cover-tools-box',
      event : '#cover-show-profile + .pseudo-checkbox',
      noclick : true
    },

    condition : function () {
      document.getElementById('cover-tools').scrollTop = 9999;

      var demo = document.getElementById('cover-show-profile');
      demo.checked = false;

      PS_Cover.Tutorial.listen(function(stop) {
        if (demo.checked) {
          stop();
          PS_Cover.Tutorial.next();
        }
      });
    }
  },


  {
    message : 'Lookin\' good, right? It\'s a good idea to enable this option if you want to be more precise with how you line things up. Next up, let\'s check out the "Full Screen" option.',

    focus : {
      selectors : '#ps4-cover-photo, #ps4-demo-profile',
      position : 'relative',
      jump : true
    }
  },


  {
    message : 'Click the checkbox for "Full Screen" to enable the Full Screen view for the tools.',

    focus : {
      selectors : '#cover-tools-box',
      event : '#cover-go-fullscreen + .pseudo-checkbox',
      noclick : true
    },

    condition : function () {
      document.getElementById('cover-tools').scrollTop = 9999;

      var fs = document.getElementById('cover-go-fullscreen');
      fs.checked = false;

      PS_Cover.Tutorial.listen(function(stop) {
        if (fs.checked) {
          stop();
          PS_Cover.Tutorial.next();
        }
      });
    }
  },


  {
    message : 'Nicely done! Enabling Full Screen fixes the canvas to the screen, and evenly distributes the height between the toolbox and canvas while making your feel more immersed. It\'s a great way to get an equal view of things! We\'ve come a long way, so let\'s wrap things up by adding some text to your Cover Image and really personalize it! Click NEXT to continue.',

    focus : {
      selectors : '#cover-image-box, #cover-tools-box, #cover-tools-title',
      position : 'fixed',
      noclick : true
    }
  },


  {
    message : 'Go ahead and click the "ADD TEXT" button to add a text layer to your Cover Image.',

    focus : {
      selectors : '#cover-tools-box',
      event : '#add-text',
      noclick : true
    },

    condition : function () {
      document.getElementById('ps4-demo-profile').className = 'hidden';
      document.getElementById('cover-go-fullscreen').checked = false;
      document.getElementById('cover-show-profile').checked = false;

      for (var a = document.querySelectorAll('[data-fullscreen="true"]'), i = 0, j = a.length; i < j; i++) {
        a[i].dataset.fullscreen = false;
      }

      document.getElementById('cover-tools').scrollTop = 0;
      document.body.scrollTop = document.getElementById('ps4-cover-photo').offsetTop - 210;

      PS_Cover.Tutorial.listen(function(stop) {
        if (document.querySelector('.text-layer')) {
          stop();
          PS_Cover.Tutorial.next();
        }
      });
    }
  },


  {
    message : 'Nice! Now we\'ve got a text layer to work with. Go ahead and add some text in the input field, like your username or whatever comes to mind. Once you\'ve got some text on your Cover, click NEXT to move on.',

    focus : {
      selectors : '#cover-tools-box',
      event : '.cover-input-value',
      noclick : true
    },

    condition : function () {
      var next = document.getElementById('tutorial-button-next');

      document.querySelector('.cover-input-value').addEventListener('keyup', function() {
        if (this.value && next.disabled) {
          next.disabled = false;
        } else if (!this.value && !next.disabled) {
          next.disabled = true;
        }
      });
    }
  },


  {
    message : 'Catchy! Okay, go ahead and select your favorite color for the text or just leave it as is. Click the NEXT button when you\'re ready to move on.',

    focus : {
      selectors : '#cover-tools-box',
      event : '#layer-settings .color-inpicker-box',
      noclick : true
    }
  },


  {
    message : 'Now let\'s spruce up that text with a new look. Pick a new font from the drop down ; it can be any font you want! When you\'re ready to move on, click the NEXT button.',

    focus : {
      selectors : '#cover-tools-box',
      event : '.cover-input-font',
      noclick : true
    }
  },


  {
    message : 'Alright we\'re almost done, adjust the font size if you want to make the text bigger or smaller. Click the NEXT button When you\'re finished.',

    focus : {
      selectors : '#cover-tools-box',
      event : '.cover-input-size',
      noclick : true
    }
  },


  {
    message : 'For the last step, let\'s adjust the position of your text. Use the arrows to move the text wherever you want! Once you\'ve got it in a position you\'re happy with, click the NEXT button.',

    focus : {
      selectors : '#cover-tools-box',
      event : '.arrow-box a',
      noclick : true
    }
  },


  {
    message : 'Your cover image is looking fantastic! Take a step back and admire your beautiful work.. when you\'re done being awestruck, click the NEXT button and we\'ll learn how to generate your Cover Image.',

    focus : {
      selectors : '#ps4-cover-photo',
      position : 'relative',
      jump : true
    }
  },


  {
    message : 'First things first, let\'s close the toolbox so we can get a better view of things.',

    focus : {
      selectors : '#cover-tools-title',
      event : '#cover-tools-title'
    },

    condition : function () {
      var title = document.getElementById('cover-tools-title');

      PS_Cover.Tutorial.listen(function (stop) {
        if (title.className == 'hidden') {
          stop();
          PS_Cover.Tutorial.next();
        }
      });
    }
  },


  {
    message : 'Congratulations! You\'ve finished the PS4 Cover Generator tutorial! Well, almost. The last thing you have to do is generate your Cover Image and save it. Once your cover image is generated ' + ( PS_Cover.isPS4 ? 'press the SHARE button and choose SCREENSHOT to SAVE your cover image.' : 'right click your cover image and choose "SAVE IMAGE" or "SAVE AS" to save it to your computer.' ),

    focus : {
      selectors : '#generate-cover',
      event : '#download-ps4-cover',
      position : 'relative',
      jump : true
    },

    condition : function () {
      function Graduate () {
        var parent = this.parentsUntil('#generate-cover');

        document.body.className = document.body.className.replace('inTutorial', '');
        document.body.removeChild(PS_Cover.Tutorial.overlay);
        document.body.removeChild(PS_Cover.Tutorial.msg);

        PS_Cover.Tutorial.confirmed = false;
        delete PS_Cover.Tutorial.overlay;
        delete PS_Cover.Tutorial.bar;
        delete PS_Cover.Tutorial.msg;

        parent.style.position = '';
        parent.dataset.tutorialFocus = '';
        this.dataset.tutorialEvent = '';
        this.removeEventListener('click', Graduate);
      };

      document.getElementById('download-ps4-cover').addEventListener('click', Graduate);
    }
  }
];

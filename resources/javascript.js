// # JAVASCRIPT FOR ALL PAGES #
(function (window, document) {
  'use strict';
  
  // Append index.html to links if being used on a local file system
  if (window.location.protocol == 'file:') {
    for (var a = document.querySelectorAll('a[href$="/"]'), i = 0, j = a.length; i < j; i++) {
      if (!/http/.test(a[i].href)) {
        a[i].href += 'index.html';
      }
    }
  }
  
}(window, document));

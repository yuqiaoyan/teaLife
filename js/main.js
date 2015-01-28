var teas;
var teaQuery = new ta.Query();

// var adjustViewport = function() {
//   var ww = Math.min($(window).width(), window.screen.width);
//   var mw = 1080;
//   var ratio =  ww / mw;
//   $('#viewport').attr('content', 'width=' + mw +
//       ', initial-scale=' + ratio + ', maximum-scale=' + ratio + ', minimum-scale=' + ratio + ', user-scalable=no');
// };

// Loads the tea data.
var loadData = function(url) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    var data = JSON.parse(xhr.responseText);
    teas = new ta.Catalog(data);

    

    



  //   searchScreen = new ta.SearchScreen(teas, 'main-container');
  //   searchScreen.render();

  //   if (ta.SearchScreen.isMobile()) {
  //     // Adjust viewport
  //     adjustViewport();
  //   } else {
  //     // Set resize handler.
  //     resizeWindow();
  //     $(window).resize(resizeWindow);
  //   }
  }
  xhr.open('GET', url);
  xhr.send();
};

// Where the fun starts.
$(document).ready(function() {
  // adjustViewport();
  console.log('Document ready...');
  loadData('teas.json');

  ta.LayoutPages.run();



});

  //         this.name = data.name;
  // this.category = data.category;
  // this.url = data.url;
  // this.imageUrl = data.imageUrl.replace('images5', 'img');
  // this.thumbUrl = data.thumbUrl.replace('images5', 'img');
  // this.description = data.description;
  // this.steepInfo = data.steepInfo;
  // this.score = data.score;

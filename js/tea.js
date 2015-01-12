// Create our private namespace: ta
ta = {};


// ---------------------------------------------------------------------------
// Tea.js
// ---------------------------------------------------------------------------

/**
 * Container for data for one tea.
 * @param {Object} data The JSON data for the tea.
 * @constructor
 */
ta.Tea = function(data) {
  this.name = data.name;
  this.category = data.category;
  this.url = data.url;
  this.imageUrl = data.imageUrl.replace('images5', 'img');
  this.thumbUrl = data.thumbUrl.replace('images5', 'img');
  this.description = data.description;
  this.steepInfo = data.steepInfo;
  this.score = data.score;

  this.transformName_();
  this.getFlavors_();
};

/**
 * Modifies the tea's name so that each word is capitalized and replaces
 * "pu erh" with "pu'er".
 * @private
 */
ta.Tea.prototype.transformName_ = function() {
  this.name = this.name.replace('pu erh', 'pu\'er');
  var words = this.name.split(' ');
  for (var i = words.length - 1; i >= 0; i--) {
    if (words[i].length == 0) words.splice(i, 1);
    else words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
  }
  this.name = words.join(' ');
};

/**
 * Sets the list of flavors for the tea from the description.
 * @private
 */
ta.Tea.prototype.getFlavors_ = function() {
  this.flavors = [];
  for (var flavor in ta.Catalog.FLAVOR_KEYWORDS) {
    if (!ta.Catalog.FLAVOR_KEYWORDS.hasOwnProperty(flavor)) continue;
    if (ta.Catalog.hasFlavor(flavor, this.description)) {
      this.flavors.push(flavor);
    }
  }
};

/**
 * Highlights the given flavors in the description.
 * @param {Array.<string>} flavors The flavors to highlight.
 * @return {string} the description with HTML tags.
 */
ta.Tea.prototype.getFlavoredDescription = function(flavors) {
  var lowerCasedDescription = this.description.toLowerCase();
  var flavorSpans = [];
  for (var i = 0; i < flavors.length; i++) {
    var flavor = flavors[i];
    var keywords = ta.Catalog.FLAVOR_KEYWORDS[flavor];
    for (var j = 0; j < keywords.length; j++) {
      var keyword = keywords[j];
      var keywordIndex = -1;
      while (true) {
        var keywordIndex = lowerCasedDescription.indexOf(keyword, keywordIndex + 1);
        if (keywordIndex >= 0) {
          flavorSpans.push({start: keywordIndex, end: keywordIndex + keyword.length});
        } else {
          break;
        }
      }
    }
  }

  // Merge overlapping spans.
  var flavorMap = [];
  for (var i = 0; i < this.description.length; i++) {
    flavorMap.push(false);
  }
  for (var i = 0; i < flavorSpans.length; i++) {
    var span = flavorSpans[i];
    for (var j = span.start; j < span.end; j++) {
      flavorMap[j] = true;
    }
  }
  var mergedSpans = [];
  var spanStart = -1;
  for (var i = 0; i < flavorMap.length; i++) {
    if (spanStart < 0) {
      if (flavorMap[i]) {
        spanStart = i;
      }
    } else {
      if (!flavorMap[i]) {
        mergedSpans.push({start: spanStart, end: i});
        spanStart = -1;
      }
    }
  }

  var flavoredDescription = this.description;
  for (var i = mergedSpans.length - 1; i >= 0; i--) {
    var span = mergedSpans[i];
    flavoredDescription = flavoredDescription.substring(0, span.start) +
        '<span class="flavor-span">' + flavoredDescription.substring(span.start, span.end) +
        '</span>' + flavoredDescription.substring(span.end, flavoredDescription.length);
  }
  return flavoredDescription;
};

/**
 * Generates the detail screen HTML for the tea.
 * @return {string} HTML to be used for the detail screen.
 */
ta.Tea.prototype.generateDetailHtml = function() {
  var category = this.category.replace('pu erh', 'pu\'er');
  category = category.charAt(0).toUpperCase() + category.slice(1);

  var steepInfoObj = helpers.parseSteepInfo(steepInfoString)
  var steepTime = steepInfoObj.parsedSteepTime;
  var steepDegrees = steepInfoObj.parsedSteepDegrees;

  return '' +
    '<div id="content">' +
      '<div id="header">' + this.name + '</div>' +
      '<div id="teaFactsWrapper" class="flex">' +
        '<div id="teaFacts">' +
          '<ul>' +
            '<li>' +
              '<span class="subhead">Type</span>' +
              '<span class="teaValue">' + category + '</span>' +
            '</li>' +
            '<li>' +
              '<span class="subhead">Temp</span>' +
              '<span id="degrees" class="teaValue">' + steepDegrees + '</span>' +
            '</li>' +
            '<li>' +
              '<span class="subhead">Time</span>' +
              '<span class="teaValue">' + steepTime + '</span>' +
            '</li>' +
            '<li>' +
              '<span class="subhead">Steeps</span>' +
              '<span class="teaValue">' + steepNumber + '</span>' +
            '</li>' +
          '</ul>' +
        '</div>' +
        '<div id="teaThumbnailWrapper">' +
          '<img id="thumbnail" src="' + this.imageUrl.substring(1) + '">' +
          '<a href="#">Buy ' + this.name + ' Here</a>' +
        '</div>' +
      '</div>' +
      '<div id="teaDescription">' +
        '<p>' + this.getFlavoredDescription(this.flavors) + '</p>' +
      '</div>' +
    '</div>';
};


// ---------------------------------------------------------------------------
// Tag.js
// ---------------------------------------------------------------------------

/**
 * Represents a tag.
 * @param {string} id   The tag id, used to identify the tag in queries.
 * @param {string} type The type of the tag (category or flavor).
 * @param {string} name The display name of the tag.
 * @constructor
 */
ta.Tag = function(id, type, name) {
  this.id = id;
  this.type = type;
  this.name = name;
};

/**
 * @return {boolean} true if this tag is a category.
 */
ta.Tag.prototype.isCategory = function() {
  return this.type == 'category';
};

/**
 * @return {boolean} true if this tag is a flavor.
 */
ta.Tag.prototype.isFlavor = function() { 
  return this.type == 'flavor';
};


// ---------------------------------------------------------------------------
// Query.js
// ---------------------------------------------------------------------------

/**
 * Represents a tea search query, which is a list of tags.
 * @constructor
 */
ta.Query = function() {
  this.tags = [];
};

/**
 * @return {boolean} true if the query is empty.
 */
ta.Query.prototype.isEmpty = function() {
  return this.tags.length == 0;
};

/**
 * Clears the query.
 */
ta.Query.prototype.clear = function() {
  this.tags = [];
};

/**
 * @return {Array.<ta.Tag>} the tags that make up the query.
 */
ta.Query.prototype.getTags = function() {
  return this.tags;
};

/**
 * @return {?tea.Tag} the single category tag or null if not present.
 */
ta.Query.prototype.getCategory = function() {
  for (var i = 0; i < this.tags.length; i++) {
    if (this.tags[i].isCategory()) {
      return this.tags[i];
    }
  }
  return null;
};

/**
 * @return {Array.<tea.Tag>} the list of flavor tags.
 */
ta.Query.prototype.getFlavors = function() {
  var flavors = [];
  for (var i = 0; i < this.tags.length; i++) {
    if (this.tags[i].isFlavor()) {
      flavors.push(this.tags[i]);
    }
  }
  return flavors;
};

/**
 * Gets the index of the tag in the query.
 * @param {ta.Tag} tag The tag to check.
 * @return {Number} the index of the tag in the query or -1 if not found.
 *     If the query contains a category tag, it always appears first.
 */
ta.Query.prototype.indexOf = function(tag) {
  var category = this.getCategory();
  if (category && category.id == tag.id) {
    return 0;
  }
  var flavors = this.getFlavors();
  for (var i = 0; i < flavors.length; i++) {
    if (flavors[i].id == tag.id) {
      return i + (category ? 1 : 0);
    }
  }
  return -1;
};

/**
 * Checks if the query contains the given tag.
 * @param {ta.Tag} tag The tag to check.
 * @return {boolean} true if the query contains the tag.
 */
ta.Query.prototype.contains = function(tag) {
  return this.indexOf(tag) >= 0;
};

/**
 * Adds a tag to the query.
 * @param {tea.Tag} tag The tag to add.
 */
ta.Query.prototype.addTag = function(tag) {
  for (var i = 0; i < this.tags.length; i++) {
    if (this.tags[i].isCategory() && tag.isCategory()) {
      return;  // Query can only contain one category.
    } else if (this.tags[i].id == tag.id) {
      return;  // Check for duplicate tag.
    }
  }
  this.tags.push(tag);
};

/**
 * Removes a tag from the query.
 * @param {tea.Tag} tag The tag to remove.
 */
ta.Query.prototype.removeTag = function(tag) {
  for (var i = 0; i < this.tags.length; i++) {
    if (this.tags[i].id == tag.id) {
      this.tags.splice(i, 1);
    }
  }
};

/**
 * Tests if the given tea matches the query.
 * @param {tea.Tea} tea The tea to test.
 * @return {boolean} true if the tea matches.
 */
ta.Query.prototype.test = function(tea) {
  var qCategory = this.getCategory();
  if (qCategory) {
    var category = qCategory.id.substring(qCategory.id.indexOf(':') + 1);
    if (tea.category != category) {
      return false;
    }
  }
  var qFlavors = this.getFlavors();
  for (var i = 0; i < qFlavors.length; i++) {
    var flavor = qFlavors[i].id.substring(qFlavors[i].id.indexOf(':') + 1);
    if (!ta.Catalog.hasFlavor(flavor, tea.description)) {
      return false;
    }
  }
  return true;
};


// ---------------------------------------------------------------------------
// Catalog.js
// ---------------------------------------------------------------------------

/**
 * Represents a catalog of teas that can be searched, filtered, and displayed.
 * @param {Object} data The JSON data containing the teas.
 * @constructor
 */
ta.Catalog = function(data) {
  this.teas = [];
  for (var i = 0; i < data.length; i++) {
    var tea = new ta.Tea(data[i]);
    if (ta.Catalog.CATEGORIES.indexOf(tea.category) >= 0 &&
        tea.name.toLowerCase().indexOf('sample') < 0) {
      this.teas.push(tea);
    }
  }
};

ta.Catalog.CATEGORIES = [ 'black', 'green', 'herbal', 'white', 'pu erh', 'rooibos', 'oolong', 'chai' ];
ta.Catalog.FLAVOR_KEYWORDS = {
  'sweet' : ['sweet', 'sweetness'],
  'aroma' : ['aroma', 'aromatic'],
  'smooth' : ['smooth'],
  'tangy' : ['tangy'],
  'fruit' : ['fruit', 'fruity'],
  'mellow' : ['mellow'],
  'citrus' : ['citrus', 'orange'],
  'vanilla' : ['vanilla'],
  'cocoa' : ['cocoa', 'chocolate'],
  'peach' : ['peach'],
};

ta.Catalog.FLAVORS = (function(){
  var flavors = []; 

  for(flavor in ta.Catalog.FLAVOR_KEYWORDS){
    flavors.push(flavor);
  }
  console.log(ta.Catalog.FLAVOR_KEYWORDS)

  console.log(flavors)
  return flavors;
})();

/**
 * Checks if the given description has the given flavor.
 * TODO: Check for whole words only.
 * @param {string} flavorId    The flavor id.
 * @param {string} description The description.
 * @return {boolean} true if the description has the flavor.
 * @static
 */
ta.Catalog.hasFlavor = function(flavorId, description) {
  var keywords = ta.Catalog.FLAVOR_KEYWORDS[flavorId];
  for (var i = 0; i < keywords.length; i++) {
    if (description.toLowerCase().indexOf(keywords[i]) >= 0) {
      return true;
    }
  }
  return false;
};

/**
 * Converts a category string into a tag object.
 * @param {string} categoryId The category id string.
 * @return {tea.Tag} the tag representation of the category.
 */
ta.Catalog.prototype.getCategory = function(categoryId) {
  var name = categoryId;
  if (categoryId == 'pu erh') name = 'pu\'er';
  return new ta.Tag('category:' + categoryId, 'category', name);
};

/**
 * Converts a flavor string into a tag object.
 * @param {string} flavorId The flavor id string.
 * @return {tea.Tag} the tag representation of the flavor.
 */
ta.Catalog.prototype.getFlavor = function(flavorId) {
  return new ta.Tag('flavor:' + flavorId, 'flavor', flavorId);
};

/**
 * Finds the tea with the given name.
 * @param {string} teaName The name to find.
 * @return {?tea.Tea} The tea or null if not found.
 */
ta.Catalog.prototype.find = function(teaName) {
  teaName = teaName.toLowerCase();
  for (var i = 0; i < this.teas.length; i++) {
    if (this.teas[i].name.toLowerCase() == teaName) {
      return this.teas[i];
    }
  }
  return null;
};

/**
 * Searches the catalog for teas that match the given query.
 * @param {tea.Query} query The query to search for.
 * @return {Array.<tea.Tea>} The list of results.
 */
ta.Catalog.prototype.search = function(query) {
  var results = [];
  for (var i = 0; i < this.teas.length; i++) {
    if (query.test(this.teas[i])) {
      results.push(this.teas[i]);
    }
  }
  return results;
};

/**
 * Gets the tags that are available for the teas that match the given query.
 * @param {tea.Query} query The query to use.
 * @return {Array.<tea.Tag>} the list of available tags.
 */
ta.Catalog.prototype.getAvailableTags = function(query) {
  var categories = [];
  var flavors = [];

  var results = this.search(query);
  for (var i = 0; i < results.length; i++) {
    var tea = results[i];
    if (!query.getCategory()) {
      if (categories.indexOf(tea.category) < 0) {
        categories.push(tea.category);
      }
    }
    for (var j = 0; j < tea.flavors.length; j++) {
      if (flavors.indexOf(tea.flavors[j]) < 0) {
        flavors.push(tea.flavors[j]);
      }
    }
  }

  // Remove categories not explicitly listed.
  for (var i = categories.length - 1; i >= 0; i--) {
    var category = categories[i];
    if (ta.Catalog.CATEGORIES.indexOf(category) < 0) {
      categories.splice(i, 1);
    }
  }

  // Remove flavors already in query.
  var qFlavors = query.getFlavors();
  for (var i = 0; i < qFlavors.length; i++) {
    var flavor = qFlavors[i].id.substring(qFlavors[i].id.indexOf(':') + 1);
    var qFlavorIndex = flavors.indexOf(flavor);
    if (qFlavorIndex >= 0) {
      flavors.splice(qFlavorIndex, 1);
    }
  }

  // Create tag objects.
  var categoryTags = [];
  for (var i = 0; i < categories.length; i++) {
    categoryTags.push(this.getCategory(categories[i]));
  }
  var flavorTags = [];
  for (var i = 0; i < flavors.length; i++) {
    flavorTags.push(this.getFlavor(flavors[i]));
  }

  return {
    'categories' : categoryTags,
    'flavors' : flavorTags
  }
};

// ---------------------------------------------------------------------------
// LayoutPages
// ---------------------------------------------------------------------------

/**
 * Renders pages for tea app [initial search, search results, tea page]
 */

 ta.LayoutPages = function(){

    helpers.renderFilters($("#categoryFilter"), ta.Catalog.CATEGORIES, "category");
    helpers.renderFilters($("#flavorFilter"), ta.Catalog.FLAVORS,"flavor");

    //set height of HTML elements based on device size
    var windowWidth = $(window).width(),
        searchInputHeight = $("#searchInput").height(),
        searchTagHeight = searchInputHeight*.55,
        tagHeight = $(".tag").height(),
        thumbnailHeight = .3*windowWidth; //will need a generalized solution for different sized source tea images
    
    var maxWords, maxDescriptionChars;

    if(windowWidth < 600){
      maxWords = 16;
      maxDescriptionChars = 100;
    }
    else{
      maxWords = 25;
      maxDescriptionChars = 300;
    }

    //tuning for animations
    var animationDuration = 380;
    var animationLongDuration = 500;

    //create an empty query
    var teaQuery = new ta.Query();
    

    //attach onClick functions for tags, teaRows, timer, chevron, etc
    
    (function(){

        

      function generateTeaRowHTML(aTea, idx){
              var shortDescriptionIDX = aTea.description.indexOf(".");
              var shortDescription = aTea.description; //set to first sentence
              var numWords = shortDescription.split(" ");
              var firstSentence = aTea.description.substring(0,shortDescriptionIDX + 1);

              if(firstSentence.length < maxDescriptionChars){
                shortDescription = firstSentence;
              }
              else if(numWords.length > maxWords){
                shortDescription = ""
                for(var i = 0; i < maxWords; i++){
                  shortDescription += numWords[i]

                  if(i < maxWords-1)
                    shortDescription += " ";
                }
                //shortDescription = aTea.description.substring(0,maxDescriptionChars);
                // shortDescription += "..."; //add ellipsis
              }
              else{
                //do nothing
              }

              return "" +
                "<li class = 'teaRow flexBase' data-idx='" + idx + "'>" +
               "<img src = '"  + aTea.thumbUrl + "'" + "class='thumbnail'>" +
               "<div class = 'teaResult'>"+
               "  <p class = 'teaResultName'>" + aTea.name + "</p>"+
               "  <p class = 'teaResultPrice'> 10 &cent </p>"+
               "  <div class = 'teaShortDescription'>" + shortDescription +"</div>"+
                "</li>"
        }

        function renderTagUpdate($FilterDiv, remainingTags, type){
                if(remainingTags.length > 0){
                    //get all the tags from $FilterDiv

                    var tagEles = $FilterDiv.children(".tag");
                    for(var t = 0; t < tagEles.length; t++){
                      var isRemaining = false;
                      var tagName = tagEles[t].getAttribute('data-name');
                      for(r in remainingTags){
                        if(tagName == remainingTags[r].name){
                          $(tagEles[t]).show();
                          isRemaining = true;
                          break;
                        }
                      }

                      if(isRemaining == false){
                        $(tagEles[t]).hide();
                      }

                    }

                    $FilterDiv.show();
                }
                else{

                  $FilterDiv.hide();
                }
        }

        function updateTeaResults(){

            var teaResults = teas.search(teaQuery);
            console.log("teaResults")

            //append tea results to #results
            $("#resultSummary").html(teaResults.length + " teas match your taste");

            $("#results").html("");

            

            for(var i = 0; i < teaResults.length; i++){
              var teaRowLi = $("#results").append(generateTeaRowHTML(teaResults[i],i));
              // teaRowLi.setAttribute('data-idx',i); //the index of where it exists in the rea result
            }

            //find the remaining tags to re render
            var remainingTagResults = teas.getAvailableTags(teaQuery);
            console.log(remainingTagResults)


            renderTagUpdate($("#categoryFilter"), remainingTagResults.categories, "category")
            renderTagUpdate($("#flavorFilter"), remainingTagResults.flavors, "flavor")

            //attach click handlers to new tea results
            $(".teaRow").click(function(){
              var teaRowEle = $(this);
              helpers.renderTeaPage(teaRowEle[0],teaResults);
            });

        }

       $(".tag").click(function(){
          var tagData = $(this).data();

          //create a tag for updating our query
          var temp = new ta.Tag(tagData.id, tagData.filter, tagData.name);
          console.log("tag and temp data")
          console.log(temp);

          //assumes this is the first click
          if($("#searchHint").is(':visible')){
            $("#searchHint").hide();
            $("#searchInput").css('text-align','left');
            
            $("#searchWrapper").animate({
              top: "0"
            },animationDuration,function(){
              $("#searchWrapper").css('top',"0");
              $("#searchWrapper").css('border-top',"none");
            })
            $("#searchWrapper").height("100%");
            $("#searchWrapper").css("overflow","auto");
 


            $("#searchInput").append($(this));
            $(this).addClass("searchTag");
            $(this).children(":first").removeClass().addClass("searchTagText");
            $(this).children(":last").removeClass().addClass("searchRemoveIcon");
            $(this).children(":last").text("x");

            $("#searchView").removeClass("flexColumn flexBase").addClass("unflex");
            // $("#searchView").addClass("unflex")
            //$("#searchView").css("display","block");

            $(".teaResult").height(thumbnailHeight);
            $("#resultsWrapper").show();
            $("#teaOfDay").hide();

            teaQuery.addTag(temp);

            
            
            
            

          }
          //for all other clicks
          else{

            if($(this).children(":last").attr('class')=="addIcon"){

              // var tagAnimationProperties = {},
              //     textAnimationProperties = {};
              
              // var tagAnimationProperties = {
              //   "height": searchTagHeight + "px",
              //   "padding-left": paddingPX,
              //   "padding-right": paddingPX
              // };

              // var textAnimationProperties = {
              //   "margin-right": "8px",
              //   "font-size":"10px",
              //   "transform": "translateY('-30%'')",
              //   "-webkit-transform": "translateY('-30%'')"
              // };


              animateTag($(this), insertTagToSearch);
              // animateTag($(this), tagAnimationProperties, insertTagToSearch, textAnimationProperties);

              teaQuery.addTag(temp);
              
              //remove the value from the CategoryFilter
              // updateTeaResults();
              

            }

            //remove tag from SearchInput
            else{
              

              // var searchTagAnimationProperties = {
              //   "height": tagHeight + "px",
              //   "padding-left": "2.5%",
              //   "padding-right": "2.5%"
              // };

              // // var searchTagAnimationProperties = {
              // //   "height": tagHeight + "px",
              // //   "padding-left": "12px",
              // //   "padding-right": "12px"
              // // };

              // var tagTextAnimationProperties = {
              //   "margin-right": "14px",
              //   "font-size":"14px",
              //   "transform": "translateY('-10%')",
              //   "-webkit-transform": "translateY('-10%'')"
              // };

              teaQuery.removeTag(temp);

              if(tagData.filter =="category"){
                $("#categoryFilter").show();
              }
              else{
                $("#flavorFilter").show();
              }

              animateTag($(this), removeTagFromSearch);
              // animateTag($(this), searchTagAnimationProperties, removeTagFromSearch, tagTextAnimationProperties);
              // updateTeaResults();

              //if we are removing the last tag, return to defaultSearch View


            }
            // updateTeaResults(tagData);


          }

          updateTeaResults();

          if($("#categoryFilter").is(':visible') == true){
              $("#flavorFilter").removeClass("addMarginTop");
            }
            else{
              $("#flavorFilter").addClass("addMarginTop");
            }




        });


        function insertTagToSearch($tag){
          $("#searchInput").append($tag);
          $tag.addClass("hiddenTag");
          $tag.addClass("searchTag");
          $tag.children(":first").removeClass().addClass("searchTagText");
          $tag.children(":last").removeClass().addClass("searchRemoveIcon");
          $tag.children(":last").text("x");
        }

        function removeTagFromSearch($searchTag){
          var filter = $searchTag.data("filter");

          if(filter == "category"){
            $("#categoryFilter").append($searchTag);
          }
          else{
            $("#flavorFilter").append($searchTag);
          }

          $searchTag.addClass("hiddenSearchTag");

          $searchTag.removeClass('searchTag');
          $searchTag.children(":first").removeClass("searchTagText");
          $searchTag.children(":last").removeClass("searchRemoveIcon");

          $searchTag.children(":first").addClass("tagText");
          $searchTag.children(":last").addClass("addIcon")
          $searchTag.children(":last").text("+");
        }

        function animateTag($original, updateTag){
          var temp = $original.clone().appendTo('body');
            temp.css('position','fixed')
              .css('left',$original.offset().left)
              .css('top',$original.offset().top)
              .css('height',$original.height())
              .css('zIndex',3);

            updateTag($original);

            // get new tag layout info

            var newTop = $original.offset().top,
                newLeft = $original.offset().left,
                newHeight = $original.height(),
                newPadding = $original.css("padding-left");

            // set the tag animation properties
            var tagAnimationProperties = {
              "top": newTop,
              "left": newLeft,
              "height": newHeight,
              "padding-left": newPadding,
              "padding-right": newPadding
            };

            var $tagText = $original.children(":first");

            // get the text animation properties
            var marginRight = $tagText.css("margin-right"),
                fontSize = $tagText.css("font-size"),
                transform = $tagText.css("transform");

            var matrixToArray = function(str){
              return str.match(/(-?[0-9\.]+)/g);
            };

            var translateY = matrixToArray(transform)[5];


            var textAnimationProperties = {
              "margin-right": marginRight,
              "font-size": fontSize,
              "transform": translateY,
              "-webkit-transform": translateY
            };


            // textAnimationProperties = {

            // }
            // tagAnimationProperties["height"]= "21px";


            temp.animate(tagAnimationProperties, animationLongDuration,function(){
              $original.removeClass("hiddenTag");
              $original.removeClass("hiddenSearchTag");
              temp.remove();
            });

            temp.children(":first").animate(textAnimationProperties, animationLongDuration);
        }

             

        

        $("#timerButton").click(function(){
          //set the circle width
          var circleParentWidth = $("#time").width();
          var circleSize = .56*circleParentWidth;

          $("#circle").width(circleSize);
          $("#circle").height($("#circle").width());

          $("#timeCover").show();
          $("#time").show();

          var steepTime = $("#timerButton").data("time");
          var countdownString = steepTime + ":00"; 
          $(".timerText").html(countdownString);

          $(".circleLink").click(function(){
            $(".timerText").html(countdownString);
            console.log("+resetLink");
            clearInterval(counter);
            helpers.countdown(steepTime);
          });

          helpers.countdown(steepTime);


          
          
          
        });

        $("#ic_close_24px").click(function(){
            $("#timeCover").hide();
            $("#time").hide();
            clearInterval(counter);

        });

        $(".chevron").click(function(){
          $("#teaPage").hide();
          $("#searchWrapper").show();
        })


    }());

 


 };




   




 




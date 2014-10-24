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
  this.imageUrl = data.imageUrl;
  this.thumbUrl = data.thumbUrl;
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
}

/**
 * Sets the list of flavors for the tea from the description.
 * @private
 */
ta.Tea.prototype.getFlavors_ = function() {
  this.flavors = [];
  var description = this.description.toLowerCase();
  for (var i = 0; i < ta.Catalog.FLAVORS.length; i++) {
    var flavor = ta.Catalog.FLAVORS[i];
    if (description.indexOf(flavor) >= 0) {
      this.flavors.push(flavor);
    }
  }
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
    if (tea.description.toLowerCase().indexOf(flavor) < 0) {
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
ta.Catalog.FLAVORS = [ 'spice', 'sweet', 'honey', 'earthy', 'floral' ];

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
// SearchScreen.js
// ---------------------------------------------------------------------------

/**
 * Renders the search screen. Needs to be called every time the query changes.
 * @param {tea.Catalog} teas The tea catalog to search.
 * @param {string} containerId The id of the container element.
 * @constructor
 */
ta.SearchScreen = function(teas, containerId) {
  // The list of teas.
  this.teas = teas;
  // The id of the element that will contain the SVG element.
  this.containerId = containerId;
  // True if this is the first time we are rendering.
  this.firstRender = true;
  // True if the tea of the day should be shown.
  this.showTotd = true;
  // The search query, a list of tags.
  this.query = new ta.Query();
  // The scroll offset of the search results screen.
  this.scrollOffsetTop = 0;
  // True if the detail screen is being shown.
  this.showDetailScreen = false;
};

/**
 * Renders the screen.
 */
ta.SearchScreen.prototype.render = function() {
  console.log('Rendering...');
  var selfObj = this;

  // Render settings.
  var width = 376;
  var height = 668
  var backgroundColor = 'white';
  var teaOfTheDay = 'jasmine silver needle';
  var teaOfTheDayHeight = 190;
  var teaOfTheDayImageHeight = 247;
  var teaOfTheDayTextWidth = 210;
  var teaOfTheDayTextHeight = 35;
  var teaOfTheDayTextSize = 20;
  var teaOfTheDayTextOffsetLeft = 16;
  var teaOfTheDayTextOffsetBottom = 12;
  var teaOfTheDayTextColor = '#fdfdfd';
  var lineColor = '#d8d8d8';
  var searchRowSpacing = 24;
  var searchColSpacing = 16;
  var searchBoxHeight = 32;
  var searchBoxColor = '#d8d8d8';
  var searchBoxRoundness = 5;
  var searchTextSize = 20;
  var searchTextOffsetBottom = 10;
  var searchTextColor = '#535456';
  var searchIconOffsetLeft = 12;
  var searchIconOffsetTop = 6;
  var searchIconSize = 20;
  var tagAnimationDuration = 400;
  var tagGridColumns = 3;
  var tagRowSpacing = 20;
  var tagHeight = 28;
  var tagRoundness = 3;
  var tagAddIconSize = 16;
  var tagTextSize = 16;
  var tagTextOffsetBottom = 9;
  var tagTextColor = '#fdfdfd';
  var tagTextOpacity = 0.8;
  var categoryTagColor = '#009444';
  var flavorTagColor = '#a919ff';
  var flavorLabelTextSize = 20;
  var flavorLabelTextColor = '#a919ff';
  var flavorLineOffsetTop = 8;
  var noCategoriesOffset = -16;
  var noFlavorsOffset = -48;

  // Query settings.
  var hasQuery = !this.query.isEmpty();
  var hasQueryOffsetTop = -teaOfTheDayHeight - 10;
  var queryIconOffsetLeft = 8;
  var queryIconOffsetTop = 10;
  var queryIconSize = 12;
  var queryTagHeight = 20;
  var queryTagTextSize = 12;
  var queryTagTextOffsetBottom = 6;
  var queryColSpacing = 8;

  // Results settings.
  var resultsSummaryHeight = 20;
  var resultSummaryTextSize = 16;
  var resultSummaryTextColor = '#aaa';
  var resultRowSpacing = 20;
  var teaAnimationDuration = 200;
  var teaImageSize = 124;
  var teaNameHeight = 18;
  var teaNameTextSize = 18;
  var teaNameTextColor = '#555';
  var teaNameMarginBottom = 4;
  var teaDescriptionHeight = 54;
  var teaDescriptionTextSize = 14;
  var teaDescriptionTextColor = '#555';

  //
  // Create the svg container.
  if (d3.select('#screen').empty()) {
    d3.select('#' + this.containerId).append('svg').attr('id', 'screen')
        .style('background', backgroundColor);
  }
  var svg = d3.select('#screen')
      .attr('width', width)
      .attr('height', height)
      .attr('cursor', 'default');

  if (this.firstRender) {
    // Add the initial fade in transition.
    svg.style('opacity', 0)
        .transition()
        .delay(200)
        .duration(500)
        .style('opacity', 1);
  }

  // Create the home screen group.
  if (svg.select('g.home-screen').empty()) {
    svg.append('g').classed('home-screen', true)
        .attr('transform', 'translate(0, 0)');
  }
  var homeScreen = svg.select('g.home-screen');

  // Create the home screen background.
  if (homeScreen.select('g.background').empty()) {
    homeScreen.append('g').classed('background', true);
    var background = homeScreen.select('g.background')
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height)
        .style('fill', backgroundColor);
  }

  //
  // Create the tea of the day.
  //
  var showTotd = !hasQuery && this.showTotd;
  var totds = homeScreen.selectAll('g.totd')
      .data([this.teas.find(teaOfTheDay)]);
  var totd = totds.enter().append('g').classed('totd', true);

  // Create the tea of the day background.
  var totdBackground = totd.append('image')
      .attr('xlink:href', function(d) {
        return d.imageUrl.substring(1);
      })
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', teaOfTheDayImageHeight);

  // Create the tea of the day text background.
  var totdTextBackground = totd.append('rect')
      .attr('x', 0)
      .attr('y', teaOfTheDayHeight - teaOfTheDayTextHeight)
      .attr('width', teaOfTheDayTextWidth)
      .attr('height', teaOfTheDayTextHeight)
      .style('fill', 'black')
      .style('fill-opacity', 0.4);

  // Create the tea of the day text.
  var totdText = totd.append('text')
      .attr('x', teaOfTheDayTextOffsetLeft)
      .attr('y', teaOfTheDayHeight - teaOfTheDayTextOffsetBottom)
      .style('font-size', teaOfTheDayTextSize)
      .style('fill', teaOfTheDayTextColor)
      .text('Try the Tea of the Day')

  // Create the tea of the day bottom overlay.
  var totdOverlay = totd.append('rect')
      .attr('x', 0)
      .attr('y', teaOfTheDayHeight)
      .attr('width', width)
      .attr('height', height - teaOfTheDayHeight)
      .style('fill', backgroundColor);

  // Create the tea of the day bottom line.
  var totdLine = totd.append('line')
      .attr('x1', 0)
      .attr('y1', teaOfTheDayHeight)
      .attr('x2', width)
      .attr('y2', teaOfTheDayHeight)
      .style('stroke', lineColor)
      .style('stroke-width', 1.5);

  //
  // Create the search box and tags group.
  //
  var searchOffsetTop = teaOfTheDayHeight;
  if (homeScreen.select('g.search').empty()) {
    var search = homeScreen.append('g').classed('search', true);
  }
  var search = homeScreen.select('g.search');
  if (search.select('g.search-box').empty()) {
    var searchBox = search.append('g').classed('search-box', true);

    // Create the search box background.
    var searchBackground = searchBox.append('rect')
        .attr('x', searchColSpacing)
        .attr('y', searchOffsetTop + searchRowSpacing)
        .attr('rx', searchBoxRoundness)
        .attr('ry', searchBoxRoundness)
        .attr('width', width - searchColSpacing * 2)
        .attr('height', searchBoxHeight)
        .style('fill', searchBoxColor);

    // Create the search box hint text.
    var searchHintText = searchBox.append('text')
        .attr('x', width / 2)
        .attr('y', searchOffsetTop + searchRowSpacing + searchBoxHeight - searchTextOffsetBottom)
        .attr('font-size', searchTextSize)
        .attr('text-anchor', 'middle')
        .style('fill', searchTextColor)
        .style('fill-opacity', hasQuery ? 0 : 1)
        .text('Search for a Tea');

    // Create the search icon.
    var searchIcon = searchBox.append('image')
        .attr('xlink:href', 'search-icon.png')
        .attr('x', searchColSpacing + (hasQuery ? queryIconOffsetLeft : searchIconOffsetLeft))
        .attr('y', searchOffsetTop + searchRowSpacing + (hasQuery ? queryIconOffsetTop : searchIconOffsetTop))
        .attr('width', hasQuery ? queryIconSize : searchIconSize)
        .attr('height', hasQuery ? queryIconSize : searchIconSize);
  }

  // Transition search hint text.
  var searchBox = search.select('g.search-box');
  var searchHintText = searchBox.select('text')
      .transition()
      .duration(tagAnimationDuration)
      .style('fill-opacity', hasQuery ? 0 : 1);

  // Transition search icon.
  var searchIcon = searchBox.select('image')
      .transition()
      .duration(tagAnimationDuration)
      .attr('x', searchColSpacing + (hasQuery ? queryIconOffsetLeft : searchIconOffsetLeft))
      .attr('y', searchOffsetTop + searchRowSpacing + (hasQuery ? queryIconOffsetTop : searchIconOffsetTop))
      .attr('width', hasQuery ? queryIconSize : searchIconSize)
      .attr('height', hasQuery ? queryIconSize : searchIconSize);

  //
  // Tag grid layout settings.
  var nc = tagGridColumns;
  var indexToRow = function(i) {
    var blockSize = nc * 2 - 1;
    var block = Math.floor(i / blockSize);
    var blockIndex = i % blockSize;
    return block * 2 + (blockIndex >= nc ? 1 : 0);
  };
  var indexToColumnCenterOffset = function(i) {
    var blockSize = nc * 2 - 1;
    var blockIndex = i % blockSize;
    if (blockIndex < nc) {
      return blockIndex - (nc - 1) / 2;
    } else {
      return (blockIndex - nc) - (nc - 2) / 2;
    }
  };
  var getNumRows = function(length) {
    if (length <= 0) return 0;
    return indexToRow(length - 1) + 1;
  };
  var tagWidth = (width - (nc + 1) * searchColSpacing) / nc;

  // Get the category and flavor tags.
  var availableTags = this.teas.getAvailableTags(this.query);
  var numCategories = availableTags.categories.length;
  var numFlavors = availableTags.flavors.length;
  availableTags = availableTags.categories.concat(availableTags.flavors);

  // Query tag settings.
  var qnc = 5;
  var queryTagWidth = (width - 2 * searchColSpacing - 2 * queryIconOffsetLeft - queryIconSize) / qnc - queryColSpacing;

  //
  // Create the flavors label.
  var searchAreaHeight = searchRowSpacing * 2 + searchBoxHeight;
  var categoryTagsHeight = (tagHeight + tagRowSpacing) * getNumRows(numCategories);
  var flavorLabelOffsetTop = searchOffsetTop + searchAreaHeight + (numCategories > 0 ? categoryTagsHeight : noCategoriesOffset);
  if (search.select('g.section-label').empty()) {
    var label = search.append('g').classed('section-label', true)
        .style('opacity', 1);
    label.append('text')
        .attr('x', 16)
        .attr('y', flavorLabelOffsetTop + tagHeight)
        .attr('font-size', flavorLabelTextSize)
        .style('fill', flavorLabelTextColor)
        .text('Flavor Filters');
    label.append('line')
        .attr('x1', searchColSpacing)
        .attr('y1', flavorLabelOffsetTop + tagHeight + flavorLineOffsetTop)
        .attr('x2', width - searchColSpacing)
        .attr('y2', flavorLabelOffsetTop + tagHeight + flavorLineOffsetTop)
        .style('stroke', lineColor)
        .style('stroke-width', 1);
  }

  // Transition flavors label.
  var label = search.select('g.section-label').transition()
      .duration(tagAnimationDuration)
      .style('opacity', numFlavors > 0 ? 1 : 0);
  label.select('text')
      .attr('y', flavorLabelOffsetTop + tagHeight);
  label.select('line')
      .attr('y1', flavorLabelOffsetTop + tagHeight + flavorLineOffsetTop)
      .attr('y2', flavorLabelOffsetTop + tagHeight + flavorLineOffsetTop);

  //
  // Create the tags.
  var tags = search.selectAll('g.tag')
      .data(availableTags.concat(this.query.getTags()), function(d) {
        return d.id;
      });

  var tag = tags.enter().append('g').classed('tag', true)
      .attr('transform', function(d, i) {
        var y = 0;
        if (i >= numCategories) {
          i -= numCategories;
          y = categoryTagsHeight + tagHeight + tagRowSpacing;
        }
        var x = width / 2 + indexToColumnCenterOffset(i) * (tagWidth + searchColSpacing) - tagWidth / 2;
        y += searchOffsetTop + searchAreaHeight + (tagHeight + tagRowSpacing) * indexToRow(i);
        return 'translate(' + x + ',' + y + ')';
      })
      .on('click', function(d) {
        console.log('Tag clicked: ' + d.name);
        if (selfObj.query.contains(d)) {
          selfObj.query.removeTag(d);
        } else {
          selfObj.query.addTag(d);
        }
        //selfObj.showTotd = false;
        selfObj.scrollOffsetTop = 0;
        selfObj.render();
      })
      .style('opacity', 0);

  // Create the tag background.
  var tagBackground = tag.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('rx', tagRoundness)
      .attr('ry', tagRoundness)
      .attr('width', tagWidth)
      .attr('height', tagHeight)
      .style('fill', function(d) {
        return d.isCategory() ? categoryTagColor : flavorTagColor;
      });

  // Create the tag plus icon.
  var tagIcon = tag.append('g').classed('add-icon', true)
      .attr('transform', 'translate(' + (tagWidth - tagHeight / 2 - 4) + ',' + (tagHeight / 2) + ')');
  tagIcon.append('line')
      .attr('x1', -tagAddIconSize / 2)
      .attr('y1', 0)
      .attr('x2', tagAddIconSize / 2)
      .attr('y2', 0)
      .style('stroke', tagTextColor)
      .style('stroke-width', 1.5);
  tagIcon.append('line')
      .attr('x1', 0)
      .attr('y1', -tagAddIconSize / 2)
      .attr('x2', 0)
      .attr('y2', tagAddIconSize / 2)
      .style('stroke', tagTextColor)
      .style('stroke-width', 1.5);

  // Create the category tag text.
  var tagText = tag.append('text')
      .attr('x', (tagWidth - tagHeight) / 2)
      .attr('y', tagHeight - tagTextOffsetBottom)
      .attr('font-size', tagTextSize)
      .attr('text-anchor', 'middle')
      .style('fill', tagTextColor)
      .style('fill-opacity', tagTextOpacity)
      .text(function(d, i) {
        return d.name;
      });

  // Transition tags.
  tag = tags.transition()
      .duration(tagAnimationDuration)
      .attr('transform', function(d, i) {
        var x = 0;
        var y = 0;
        var queryIndex = selfObj.query.indexOf(d);
        if (queryIndex >= 0) {
          // Tag appears in the query.
          x = searchColSpacing + queryIconOffsetLeft * 2 + queryIconSize +
              (queryTagWidth + queryColSpacing) * queryIndex;
          y = searchOffsetTop + searchRowSpacing + 6;
        } else {
          // Display tag in grid.
          if (i >= numCategories) {
            i -= numCategories;
            y = categoryTagsHeight + tagHeight + tagRowSpacing;
          }
          x = width / 2 + indexToColumnCenterOffset(i) * (tagWidth + searchColSpacing) - tagWidth / 2;
          y += searchOffsetTop + searchAreaHeight + (tagHeight + tagRowSpacing) * indexToRow(i);
          if (numCategories == 0) y += noCategoriesOffset;
        }
        return 'translate(' + x + ',' + y + ')';
      })
      .style('opacity', 1);

  tagBackground = tag.select('rect')
      .attr('width', function(d) {
        return selfObj.query.contains(d) ? queryTagWidth : tagWidth;
      })
      .attr('height', function(d) {
        return selfObj.query.contains(d) ? queryTagHeight : tagHeight;
      });
  tagIcon = tag.select('g.add-icon')
      .attr('transform', function(d) {
        var inQuery = selfObj.query.contains(d);
        var angle = inQuery ? 45 : 0;
        var tx = inQuery ? queryTagWidth - queryTagHeight / 2 + 1 : tagWidth - tagHeight / 2 - 4;
        var ty = inQuery ? queryTagHeight / 2: tagHeight / 2;
        var scale = inQuery ? 0.65 : 1;
        return 'translate(' + tx + ',' + ty + ') rotate(' + angle + ') scale(' + scale + ')';
      });
  tagText = tag.select('text')
      .attr('x', function(d) {
        return selfObj.query.contains(d) ? (queryTagWidth - queryTagHeight) / 2 + 3 : (tagWidth - tagHeight) / 2;
      })
      .attr('y', function(d) {
        return selfObj.query.contains(d) ? queryTagHeight - queryTagTextOffsetBottom : tagHeight - tagTextOffsetBottom;
      })
      .attr('font-size', function(d) {
        return selfObj.query.contains(d) ? queryTagTextSize : tagTextSize;
      });

  // Transition exiting tags.
  tags.exit().transition()
      .duration(tagAnimationDuration)
      .style('opacity', 0)
      .remove();

  //
  // Create the teas (search results).
  //
  var resultTeas = this.teas.search(this.query);
  var numTagRows = 1 + getNumRows(numCategories) + getNumRows(numFlavors);
  var resultsOffsetTop = searchOffsetTop + searchAreaHeight + (tagHeight + searchRowSpacing) * numTagRows - 10;
  if (numCategories == 0 && numFlavors > 0) resultsOffsetTop += noCategoriesOffset;
  if (numFlavors == 0) resultsOffsetTop += noFlavorsOffset;
  if (homeScreen.select('g.results').empty()) {
    var results = homeScreen.append('g').classed('results', true)
        .style('opacity', 0);

    // Create the result summary.
    var resultsSummary = results.append('text')
        .attr('x', searchColSpacing)
        .attr('y', resultsOffsetTop + resultsSummaryHeight)
        .attr('font-size', resultSummaryTextSize)
        .style('fill', resultSummaryTextColor);
  }

  // Transition result summary.
  var results = homeScreen.select('g.results');
  var resultsSummary = results.select('text')
      .transition()
      .duration(tagAnimationDuration)
      .attr('x', searchColSpacing)
      .attr('y', resultsOffsetTop + resultsSummaryHeight + height)
      .transition()
      .delay(teaAnimationDuration)
      .attr('y', resultsOffsetTop + resultsSummaryHeight)
      .text(resultTeas.length == 0 ? '' : (resultTeas.length == 1 ? '1 tea matches your taste' : resultTeas.length + ' teas match your taste'));

  //
  // Create teas for new data.
  var teasOffsetTop = resultsOffsetTop + resultsSummaryHeight + resultRowSpacing;
  var teas = results.selectAll('g.tea')
      .data(resultTeas, function(d) {
        return d.name;
      });
  var tea = teas.enter().append('g').classed('tea', true)
      .attr('transform', 'translate(0, ' + (teasOffsetTop + height) + ')')
      .style('opacity', 0)
      .on('click', function(d) {
        console.log('Tea clicked: ' + d.name);
        // TODO: Show detail screen.
        //selfObj.showDetailScreen = true;
        //selfObj.render();
      });
  
  // Create the tea image.
  var teaImage = tea.append('image')
      .attr('xlink:href', function(d) {
        return d.thumbUrl.substring(1);
      })
      .attr('x', searchColSpacing)
      .attr('y', 0)
      .attr('width', teaImageSize)
      .attr('height', teaImageSize)

  // Create the tea name.
  var teaName = tea.append('text').classed('name', true)
      .attr('x', searchColSpacing * 2 + teaImageSize)
      .attr('y', teaNameHeight)
      .attr('font-size', teaNameTextSize)
      .style('font-weight', 'bold')
      .style('fill', teaNameTextColor)
      .text(function(d) {
        return d.name;
      });

  // Create the tea description as a foreign object (SVG is not good at word wrap).
  var teaDescription = tea.append('foreignObject').classed('description', true)
      .attr('x', searchColSpacing * 2 + teaImageSize)
      .attr('y', teaNameHeight + teaNameMarginBottom)
      .attr('width', width - 3 * searchColSpacing - teaImageSize)
      .attr('height', teaDescriptionHeight);
  var foBody = teaDescription.append('xhtml:body')
      .classed('tea-description', true)
      .style('margin', 0)
      .style('font-size', teaDescriptionTextSize + 'px');
  var foP = foBody.append('xhtml:p')
      .style('color', teaDescriptionTextColor)
      .text(function(d) {
        return d.description;
      });

  // Transition teas.
  tea = teas.transition()
      .duration(tagAnimationDuration)
      .attr('transform', 'translate(0, ' + (teasOffsetTop + height) + ')')
      .transition()
      .delay(function(d, i) {
        i = Math.min(i, 4);
        return (i + 2) * teaAnimationDuration;
      })
      .attr('transform', function(d, i) {
        var y = teasOffsetTop + (teaImageSize + resultRowSpacing) * i;
        return 'translate(0, ' + y + ')';
      })
      .style('opacity', 1);

  // Transition exiting teas.
  teas.exit().transition()
      .duration(teaAnimationDuration)
      .style('opacity', 0)
      .remove();

  // Transition the results group.
  results.transition()
      .duration(tagAnimationDuration)
      .style('opacity', hasQuery ? 1 : 0);

  // Handle scrolling.
  var homeScreenHeight = teasOffsetTop + (teaImageSize + resultRowSpacing) * resultTeas.length;
  homeScreen.call(d3.behavior.drag()
      .origin(function(d) {
        return {x:0, y:0};
      })
      .on('drag', function() {
        //console.log('drag ', d3.event);
        if (selfObj.query.isEmpty() && !selfObj.showTotd) {
          if (d3.event.y > 10) {
            selfObj.showTotd = true;
            selfObj.render();
          }
        }
        if (!selfObj.query.isEmpty()) {
          selfObj.scrollOffsetTop += d3.event.dy;
          if (selfObj.scrollOffsetTop > 0) selfObj.scrollOffsetTop = 0;
          var scrollMin = Math.min(0, height - homeScreenHeight + teaOfTheDayHeight);
          if (selfObj.scrollOffsetTop < scrollMin) selfObj.scrollOffsetTop = scrollMin;
          d3.select(this)
              .attr('transform', 'translate(0,' + (selfObj.scrollOffsetTop + (showTotd ? 0 : hasQueryOffsetTop)) + ')');
        }
      }));

  // Transition the home screen.
  homeScreen.transition()
      .attr('transform', 'translate(0,' + (this.scrollOffsetTop + (showTotd ? 0 : hasQueryOffsetTop)) + ')');


  //
  // Create the detail screen group.
  //
  if (svg.select('g.detail-screen').empty()) {
    svg.append('g').classed('detail-screen', true)
        .attr('transform', 'translate(0, 0)');
  }
  var detailScreen = svg.select('g.detail-screen');

  // Create the detail screen background.
  if (detailScreen.select('g.background').empty()) {
    detailScreen.append('g').classed('background', true);
    var background = detailScreen.select('g.background')
        .attr('transform', 'translate(0,' + height + ')');
    background.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height)
        .style('fill', backgroundColor);
  }

  // Transition the detail screen background.
  var background = detailScreen.select('g.background')
      .transition()
      .attr('transform', 'translate(0,' + (this.showDetailScreen ? 0 : height) + ')');

  this.firstRender = false;
};

var counter;

var helpers = {
	countdown: function(timerMins){
		var steepTime = new XDate(2011,7,31);
		steepTime.setMinutes(timerMins);
		//steepTime.addSeconds(-1);

		function updateTimer(){
			steepTime.addSeconds(-1);
			var remainSeconds = steepTime.getMinutes()*60 + steepTime.getSeconds();
			if(remainSeconds == 0){
				console.log("+seconds = 0")
				clearInterval(counter);
				console.log("+seconds = 1")
				$(".timerText").html("DONE");
			}

			//if seconds is less than 10, then update the format of display
			var seconds = steepTime.getSeconds();
			if(seconds < 10){
				seconds = "0" + steepTime.getSeconds();
			}

			$(".timerText").html(steepTime.getMinutes()+":"+seconds);
		}
		console.log('start timer...')

		counter=setInterval(updateTimer, 1000); //1000 will  run it every 1 second
	},

	//Renders the category and flavor filters in the search screen 
   	renderFilters: function($FilterDiv, listFilters,classTag){

      var filterLength = listFilters.length

      function renderTag(tagText){
        //render a tag
        var currTagDiv = document.createElement("div");
        currTagDiv.className = "tag " + classTag;
        currTagDiv.setAttribute('data-filter', classTag);
        currTagDiv.setAttribute('data-id', classTag + ":" + tagText);
        currTagDiv.setAttribute('data-name',tagText);

        var currTagSpan = document.createElement("span");
        currTagSpan.className = "tagText"
        var content = document.createTextNode(tagText);
        currTagSpan.appendChild(content);


        var currAddIcon = document.createElement("span");
        currAddIcon.className = "addIcon";
        var icon = document.createTextNode("+");
        currAddIcon.appendChild(icon);

        currTagDiv.appendChild(currTagSpan);
        currTagDiv.appendChild(currAddIcon);

        return currTagDiv;
      }

      for(var i = 0; i < listFilters.length; i++){

          var currTagDiv = renderTag(listFilters[i]);
          $FilterDiv.append(currTagDiv);
      }

    },

    renderTeaPage: function(currTeaRowEle, currTeaResults){
	//maintains and updates tea page UI
	//callback for teaRow clicks

        var teaPage = {
          currTea: null,
          set:function(tea){
            currTea = tea;

            var steepInfoObj = helpers.parseSteepInfo(tea.steepInfo)
            var steepTime = steepInfoObj.parsedSteepTime;
            var steepDegrees = steepInfoObj.parsedSteepDegrees;

            var $teaFacts = $("#teaFacts ul li span:nth-child(2)");

            $teaFacts[0].innerHTML = currTea.category;
            $teaFacts[1].innerHTML = steepDegrees;
            // "<sup class='units'> ~ </sup>" 
            $teaFacts[2].innerHTML = steepTime[0] + "<span class = 'units'> min </span>";

            $(".headerTitle").html(tea.name);
            $("#teaFactsWrapper").css("background-image", "url(./" + tea.imageUrl + ")");
            $("#teaDescription").html(tea.description);
            $(".buy-link").html("Buy " + tea.name + " Here")
            $(".buy-link").attr("href","http://www.adagio.com" + tea.url);

            $("#timerButton").data("time",steepTime[0]);

          },
          get:function(){
            return(currTea);
          }
        };   

    	var windowHeight = window.innerHeight;
	    $("html").height(windowHeight);

	    $("#searchWrapper").hide();
	    $("#teaPage").show();

	    var teaRowIDX = currTeaRowEle.getAttribute("data-idx");
	    // var teaRowIDX = teaRowEleData.idx;

	    //update tea data on page
	    // var teaData = {
	    //   name: "Blue Moon",
	    //   category: "Green",
	    //   url: "www",
	    //   imageUrl: "/images5/products/earl_grey_bravo.jpg",
	    //   thumbUrl: "/images5/products_index/earl_grey_bravo.jpg",
	    //   description: "blah blah",
	    //   steepInfo: "Steep at 212&deg; for 2-3 minutes.",
	    //   score: 1
	    // }

	    var tempTea = currTeaResults[teaRowIDX];
	    teaPage.set(tempTea);

	    //update layout values to fit new content
	    var headerHeight = $("header").height();
	    var footerHeight = $("#timerButton").height();

	    $("#teaContent").height(windowHeight - headerHeight - footerHeight - 12);
	    $("#teaContent").css("margin-top",headerHeight);

	    
	    //set the tea width
	    var teaFactsPaddingNum = $("body").width()*0.05 
	    var teaFactsPadding = teaFactsPaddingNum + "px";
	    $("#teaFacts ul").css("padding-left", teaFactsPadding)
	    $("#teaFacts ul").css("padding-right", teaFactsPadding)
	    $("#teaContent").show();
	    var teaValueWidths = $(".teaValue").map(function(){
	    	return $(this).width();
	    }).get();
	    var contentWidth = Math.max.apply(Math, teaValueWidths);
	    $("#teaFacts").width(teaFactsPaddingNum*2 + contentWidth);

    },

    parseSteepInfo: function(steepInfoString){
		// Parse the steep info.
		var steepDegrees = '-';
		var steepTime = '-';
		var steepNumber = '-';
		var steepDegreeStartIndex = steepInfoString.indexOf('Steep at ');
		var steepDegreesEndIndex = steepInfoString.indexOf('&deg;');
		if (steepDegreeStartIndex >= 0 && steepDegreesEndIndex >= 0) {
			steepDegrees = steepInfoString.substring(steepDegreeStartIndex + 9, steepDegreesEndIndex);
		}

		var steepTimeStartIndex = steepInfoString.indexOf('for ');
		var steepTimeEndIndex = steepInfoString.indexOf(' minutes');
		if (steepTimeStartIndex >= 0 && steepTimeEndIndex >= 0) {
			steepTime = steepInfoString.substring(steepTimeStartIndex + 4, steepTimeEndIndex) + ' min';
		}

		return{
			parsedSteepTime: steepTime, 
			parsedSteepDegrees: steepDegrees
		}
    }
};



 


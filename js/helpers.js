var helpers = {
	countdown: function(timerMins){
		var steepTime = new XDate(2011,7,31);
		steepTime.setMinutes(timerMins);
		//steepTime.addSeconds(-1);

		function updateTimer(){
			steepTime.addSeconds(-1);
			var remainSeconds = steepTime.getMinutes()*60 + steepTime.getSeconds();
			if(remainSeconds == 0){
				clearInterval(counter);
				$(".timerText").html("DONE");
			}

			//if seconds is less than 10, then update the format of display
			$(".timerText").html(steepTime.getMinutes()+":"+steepTime.getSeconds());
		}

		var counter=setInterval(updateTimer, 1000); //1000 will  run it every 1 second
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



 


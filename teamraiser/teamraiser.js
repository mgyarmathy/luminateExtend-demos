/*	
*	teamraiser.js
*   Author: Michael Gyarmathy, Web Developer Intern, Blackbaud
*	Date: June 21, 2013
*	Description: demonstration of luminateExtend.js with Luminate TeamRaiser API and Google Maps
*/

$(function() {

    //initialize luminateExtend on the page
    luminateExtend.init({
        apiKey: '123456789', 
        path: {
            nonsecure: 'http://vateam.convio.net/site/', 
            secure: 'https://secure2.convio.net/vateam/site/'
        }
    });
    
    //initialize Google Map
    var mapOptions = {
      center: new google.maps.LatLng(39.36, -100.76),
      zoom: 4,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    
    //initial api request for demo purposes
    luminateExtend.api.request({
        api: 'TeamRaiser',
        data: 'method=getTeamraisersByInfo&name=%&event_type=LE_demo',
        requestType: 'GET',
        callback: dropMarkers
    });
    
    //stores all Markers on map for purposes of clearing overlay
    var markersArray = [];
    
    //callback function from API request - geocode locations + drop markers on map
    function dropMarkers(data) {
        console.log(data);
        
        //initialize Google Maps Geocoder
        var geocoder = new google.maps.Geocoder();
        
        //convert teamraisers in JSON response to array
        var teamraisers = luminateExtend.utils.ensureArray(data.getTeamraisersResponse.teamraiser);
        
        
        if(!(typeof teamraisers[0] === 'undefined')){ //check for results
            //remove all invalid locations from array
            teamraisers = removeNullLocationsFrom(teamraisers);
            
            //enable search form
            $('#search-submit').html('Submit').removeClass('disabled');
            $('#search-fieldset :input').attr('disabled', false);
            $('#search-results').text('search returned ' + teamraisers.length + ' result(s)').show();
            
        }
        else{ //no results
            setTimeout(function() { //setTimeout to prevent form from flickering
                $('#search-results').text('search returned 0 result(s)').show();
                $('#search-submit').delay(1000).html('Submit').removeClass('disabled');
                $('#search-fieldset :input').delay(1000).attr('disabled', false);
            }, 500);
            return;
        }
        
        
        /*
         * NOTE: Google's Geocoding API enforces a request rate limit,
         *       adding delay to requests helps avoid this limit.
         */
        if(teamraisers.length > 15) {
            var delay = 500;
        }
        else{
            var delay = 50;
        }
        
        //geocode locations from results + drop markers on map
        $.each(teamraisers, function(i, tr) {
            setTimeout(function() { //adds a delay to throttle geocoding requests
                if((tr.city == null) || (tr.state == null)) return 'skip';
                var addr = tr.city + ' ' + tr.state;
                if(tr.location_name) addr = tr.location_name + ' ' + addr;
                geocoder.geocode( {'address' : addr }, function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK){
                        var infowindow = new google.maps.InfoWindow({
                            content:  '<div class="markerInfo"><h4>' + tr.name + '</h4>'
                                    + '<table><tr><td><strong>Date:&nbsp;</strong><td>' + rfDate(tr.event_date) + '</td></tr>'
                                    + '<tr><td><strong>Location:&nbsp;</strong><td>' + tr.location_name + '</td></tr></table>'
                                    + '<span class="trlinks"><a href="' + tr.greeting_url + '">TeamRaiser Link</a> | '
                                    + '<a href="http://maps.google.com/?q=' + addr + '&daddr=' + addr + '">Directions</a></span></div>'
                        });
                        var marker = new google.maps.Marker({
                            map: map,
                            position: results[0].geometry.location,
                            animation: google.maps.Animation.DROP
                        });
                        markersArray.push(marker);
                        google.maps.event.addListener(marker, 'click', function() {
                            infowindow.open(map,marker);
                        });	
                    }
                    else{
                        //NOTE: these log messages will typically tell you if you're exceeding the rate limit
                        console.log(i + ' ' + tr.name + ' invalid location');
                        console.log(results);
                        console.log(status);
                    }
                });
            }, i*delay); //setTimeout()
        });				
    }
    
    //removes all TeamRaiser API results with undefined or null locations - [can't be displayed on map]
    function removeNullLocationsFrom(array) {
        return $.grep(array, function(tr, i) {
            if(typeof tr.city === 'undefined' || typeof tr.state === 'undefined') return false; 
            else if (tr.city == null || tr.state == null) return false; 
            else return true;
        });
    }
    
    //submit form to add another TeamRaiser
    //NOTE: currently only adds a marker to map -- no API request made
    $('form#add-teamraiser').submit(function() {
        var geocoder = new google.maps.Geocoder();
        var addr = $('#eventCity').val() + " " + $('#eventState').val();
        if($('#eventLocation').val().length > 0) addr = $('#eventLocation').val() + ' ' + addr;
        geocoder.geocode( {'address' : addr }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK){
                //create content for infoWindow
                var infoContent =  '<div class="markerInfo"><h4>' + $('#eventName').val() + '</h4>'
                                 + '<table><tr><td><strong>Date:&nbsp;</strong><td>' + rfDate($('#eventDate').val()) + '</td></tr>';
                //include location in infoContent if available
                if($('#eventLocation').val().length > 0){
                   infoContent += '<tr><td><strong>Location:&nbsp;</strong><td>' + $('#eventLocation').val() + '</td></tr>';
                }
                //add TeamRaiser and directions links
                infoContent +=  '</table><span class="trlinks"><a href="#">TeamRaiser Link</a> | '
                              + '<a href="http://maps.google.com/?q='+addr+'&daddr='+addr+'">Directions</a></span></div>';
                var infowindow = new google.maps.InfoWindow({
                    content: infoContent
                });
                var marker = new google.maps.Marker({
                    map: map,
                    position: results[0].geometry.location,
                    animation: google.maps.Animation.DROP
                });
                markersArray.push(marker);
                google.maps.event.addListener(marker, 'click', function() {
                    infowindow.open(map,marker);
                });	
            }
            else{
                console.log(i + ' ' + tr.name + ' invalid location');
                console.log(results);
                console.log(status);
            }
        });
        console.log(addr);
        return false;
    });
    
    //TeamRaiser search form submission
    $('form#search-teamraiser').submit(function() {
    
        //clear map of markers
        $.each(markersArray, function(i, marker) {
            marker.setMap(null);
        });
        markersArray = [];
        
        //disable search form
        $('#search-submit').html('<img id="loading" src="../img/ajax-loader.gif" />').addClass('disabled');
        $('#search-fieldset :input').attr("disabled", true);
        $('#search-results').text('');
        
        //build parameter string for api request
        var params = '';
        if($('#searchName').val().length > 0) params = params + '&name=' + $('#searchName').val();
        if($('#searchCity').val().length > 0) params = params + '&city=' + $('#searchCity').val();
        if($('#searchState').val().length > 0) params = params + '&state=' + $('#searchState').val();
        
        //submit getTeamRaisersByInfo API request via AJAX
        luminateExtend.api.request({
            api: 'TeamRaiser',
            data: 'method=getTeamraisersByInfo&list_page_size=100' + params,
            requestType: 'GET',
            callback: dropMarkers
        });
        return false;
    });
    
    //legends act as buttons to open/close forms
    $('legend').click(function() {
        $(this).parent().children('fieldset').slideToggle();
    });

    //helper function to reformat date from yyyy-MM-ddTHH:mm:ss to MM/dd/yyyy
    function rfDate(date) {
        var year = date.substring(0,4);
        var month = date.substring(5,7);
        var day = date.substring(8,10);
        
        return month + '/' + day + '/' + year;
    }
});
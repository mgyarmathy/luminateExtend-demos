/*	
*	donate.js
*   Author: Michael Gyarmathy, Web Developer Intern, Blackbaud
*	Date: June 21, 2013
*	Description: demonstration of luminateExtend.js and Luminate Donation API
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
	
	//get form id from url query string
	var form_id = getQueryVariable('form_id');
	
	//add form id as hidden input field on the donation form
	$('#donate_form').prepend('<input type="hidden" name="form_id" id="form_id" value="' + form_id + '" />');
	
	luminateExtend.api.request({
		api: 'CRDonationAPI',
		data: 'method=getDonationFormInfo&form_id=' + form_id,
		callback: addFormInfo,
		useHTTPS: true,
		requestType: 'GET'
	});
	
	function addFormInfo(data){
		console.log(data);
		
		//generate donation levels on the form
		var donationLevels = luminateExtend.utils.ensureArray(data.getDonationFormInfoResponse.donationLevels.donationLevel);
		$(donationLevels).each(function(i, level) {
			if(level.userSpecified === 'true'){
				$('#donation-amounts').append( '<label>'
											 +    '<input name="amountOption" id="other" value="' + level.level_id + '" type="radio">'
											 +    'Other Amount'
							                 + '</label>'
											 + '<div class="input-prepend input-append">'
											 +    '<span class="add-on">$</span>'
											 +    '<input class="input-small" style="text-align:right" name="other_amount" type="text" placeholder="0" disabled>'
											 +    '<span class="add-on">.00</span>'
											 + '</div>'
											 );
			}
			else{
				$('#donation-amounts').append( '<label>'
											 +   '<input name="amountOption" value="' + level.level_id + '" type="radio">'
											 +   level.amount.formatted
											 + '</label>'
											 );
			}
		});
		
		/*$('#donation-amounts').append('<button id="level-test">Test Level</button>');
		$('#level-test').click( function() { console.log( $('#donation-amounts input[name="amountOption"]:checked').val() ) });*/
		
		//add disabled functionality to other amount field when the 'other' option is not selected
		$('input:radio[name="amountOption"]').change(function() {
			if($('input:radio#other').is(':checked')){
				$('input[name="other_amount"]').removeAttr('disabled');
			}
			else{
				$('input[name="other_amount"]').attr('disabled', '');
			}
		});
		
		//handle autorepeat donation option
		if(data.getDonationFormInfoResponse.supportsLevelAutorepeat == 'true'){
			$('#donation-information').append( '<label>'
											 +    '<input name="autorepeat" type="checkbox">'
											 +    'Please repeat this gift automatically every month.'
											 + '</label>');
		}
		
	}
	
	//apply validation to the donation form
	$('#donate_form').validate({
		debug: true,
		rules: {
			'other_amount' : { //to handle $5-minimum to prevent fraud
				min: 5,
				number: true
			},
			'card_number' : { //built-in credit card number verifier
				creditcard: true
			}
		},
		messages: {
			'donor.name.first' : 'Donor first name required.',
			'donor.name.last' : 'Donor last name required.',
			'donor.email' : 'Donor email required.',
			'other_amount' : 'Please enter an amount of at least $5.00.',
			'billing.name.first' : 'Billing first name required.',
			'billing.name.last' : 'Billing last name required.',
			'billing.address.street1' : 'Street address required.',
			'billing.address.city' : 'City required.',
			'billing.address.zip' : 'ZIP/Postal code required.',
			'card_number': 'Valid credit card number required.',
			'card_cvv': 'Credit card CVV required.'
		},
		errorLabelContainer: '#errorBox',
		wrapper: 'span',
		submitHandler: function(form){
			submitForm();
		}
	});
	
	//donation form submission via AJAX
	function submitForm(){
		if($('#donate_form').valid()) {
			$('#donate_form').fadeOut('slow').hide();
			$('#loading').show();
			var params = '&level_id=' + $('#donation-amounts input[name="amountOption"]:checked').val();
			//append other_amount to data if 'other' option is selected
			if( $('#donation-amounts input[name="amountOption"]:checked').is('#other') ){
				params += '&other_amount=' + $('input[name="other_amount"]').val();
			}
			if( $('input[name="autorepeat"]').is(':checked') ){
				params += '&level_autorepeat=true';
			}
			luminateExtend.api.request({
				api: 'CRDonationAPI', 
				callback: donateCallback, 
				data: 'method=donate' + params,
				form: '#donate_form',
				useHTTPS: true,
				requestType: 'POST'
			});
		}
	}
	
	//callback after AJAX request response
	function donateCallback(data) {
		console.log(data);
		if(data.donationResponse.donation){
			$('#confirmation').append( 'Thank you ' + $('#firstname').val() + ' for your donation of ' + data.donationResponse.donation.amount.formatted + '!'
									 + '</br>Your confirmation code is: ' + data.donationResponse.donation.confirmation_code + '.');
		}
		else if(data.donationResponse.errors){
			$('#confirmation').append('Error processing donation. <a href="#" onclick="location.reload(true); return false;">Try Again</a>');
		}
		$('#loading').hide();
		$('#confirmation').fadeIn('slow').show();
	};

	//submit form by clicking submit button or pressing the Enter key
	$('#donate_form input').keypress(function(event) {
		if (event.which == 13) { //keypress=Enter
			event.preventDefault();
			submitForm();
		}
	});
	
	//used to get variables from query string in url
	function getQueryVariable(variable)
	{
		   var query = window.location.search.substring(1);
		   var vars = query.split("&");
		   for (var i=0;i<vars.length;i++) {
				   var pair = vars[i].split("=");
				   if(pair[0] == variable){return pair[1];}
		   }
		   return(false);
	}
});
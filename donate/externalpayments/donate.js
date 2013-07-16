(function($) {

  $(function() {
  
    luminateExtend({
        apiKey: '123456789', 
        path: {
            nonsecure: 'http://vateam.convio.net/site/', 
            secure: 'https://secure2.convio.net/vateam/site/'
      }
    });

    luminateExtend.api({
      api: 'donation', 
      data: 'method=getDonationFormInfo&form_id=' + $('input[name="form_id"]').val(), 
      callback: addFormInfo
    });


    function addFormInfo(data){
        // console.log(data);
        //generate donation levels on the form
        var donationLevels = luminateExtend.utils.ensureArray(data.getDonationFormInfoResponse.donationLevels.donationLevel);
        // console.log(donationLevels);
        $(donationLevels).each(function(i, level) {
            if (level.userSpecified === 'true') {
                $('#donation-amounts').append( '<label>'
                                             +    '<input name="level_id" id="other" value="' + level.level_id + '" type="radio">'
                                             +    'Other Amount'
                                             + '</label>'
                                             + '<div class="input-prepend input-append">'
                                             +    '<span class="add-on">$</span>'
                                             +    '<input class="input-small" style="text-align:right" name="other_amount" type="text" placeholder="" disabled>'
                                             +    '<span class="add-on">.00</span>'
                                             + '</div>'
                                             );
            }
            else {
                $('#donation-amounts').append( '<label>'
                                             +   '<input name="level_id" value="' + level.level_id + '" type="radio">'
                                             +   level.amount.formatted
                                             + '</label>'
                                             );
            }
        });
        
        $('input[name="level_id"]').on('click', function() {
            if ($(this).is('#other')) {
                $('input[name="other_amount"]').removeAttr('disabled');
                //$('input[name="other_amount"]').attr('name', 'other_amount');
                $('input[name="other_amount"]').focus();
            }
            else {
                $('input[name="other_amount"]').attr('disabled', 'disabled');
                //$('input[name="other_amount"]').removeAttr('name');
            }
        });
        
        //handle autorepeat donation option
		if (data.getDonationFormInfoResponse.supportsLevelAutorepeat == 'true') {
			$('#donation-information').append( '<label>'
											 +    '<input name="autorepeat" type="checkbox">'
											 +    'Please repeat this gift automatically every month.'
											 + '</label>'
                                             );
		}

        // generate payment options - add to "Select Payment Method dropdown"
        var paymentCards = luminateExtend.utils.ensureArray(data.getDonationFormInfoResponse.paymentCards.paymentCard);
        $(paymentCards).each(function(i, cardName) {
            $('#payment_type').append('<option value="' + cardName + '">' + cardName + '</option>');
        });
        var externalProcessors = luminateExtend.utils.ensureArray(data.getDonationFormInfoResponse.externalProcessors.externalProcessor);
        $(externalProcessors).each(function(i, external) {
            $('#payment_type').append('<option value="' + external + '">' + external + '</option>');
        });
    }
    
    var requireCreditCardInfo = function() {
        return ($('.donation-form [name="method"]').val() === 'donate');
    }
    
    //apply validation to the donation form
	$('#donate_form').validate(
        { debug: true
        , rules: { 'donor.email': { email: true
                                  }
                 , 'other_amount': { min: 5 //to handle $5-minimum to prevent fraud
                                   , number: true
                                   }
                 , 'card_number': { required: { depends: requireCreditCardInfo 
                                              }
                                  , creditcard: { depends: requireCreditCardInfo 
                                                }
                                  }
                 , 'card_cvv': { required: { depends: requireCreditCardInfo 
                                           }
                               }
                 }
        , messages: { 'donor.name.first' : 'Donor first name required.'
                    , 'donor.name.last' : 'Donor last name required.'
                    , 'donor.email' : 'Please enter a valid email address.'
                    , 'other_amount' : 'Please enter an amount of at least $5.00.'
                    , 'billing.name.first' : 'Billing first name required.'
                    , 'billing.name.last' : 'Billing last name required.'
                    , 'billing.address.street1' : 'Street address required.'
                    , 'billing.address.city' : 'City required.'
                    , 'billing.address.zip' : 'ZIP/Postal code required.'
                    , 'card_number': 'Valid credit card number required.'
                    , 'card_cvv': 'Credit card CVV required.'
                    }
        , errorLabelContainer: '#errorBox'
        , wrapper: 'span'
        , submitHandler: submitForm
	    }
    );
    
    //donation form submission via AJAX
    function submitForm(){
        if($('#donate_form').valid()) {
            $('#donate_form').fadeOut('slow').hide();
            $('#loading').show();
            var params = '';
            if( $('input[name="autorepeat"]').is(':checked') ){
                params += 'level_autorepeat=true';
            }
            luminateExtend.api.request({
                api: 'CRDonationAPI', 
                callback: donateCallback, 
                form: '#donate_form',
                data: params,
                useHTTPS: true,
                requestType: 'POST'
            });
            
        }
    }
    
    function donateCallback(data) {
        console.log(data);
        if (data.donationResponse && data.donationResponse.redirect) {
            window.location.href = data.donationResponse.redirect.url;
        }
        if (data.donationResponse && data.donationResponse.donation) {
            $('#confirmation').append( 'Thank you ' + $('#firstname').val() + ' for your donation of ' + data.donationResponse.donation.amount.formatted + '!'
                                     + '</br>Your confirmation code is: ' + data.donationResponse.donation.confirmation_code + '.');
        }
        else if (data.donationResponse && data.donationResponse.errors) {
            $('#confirmation').append('Error processing donation. <a href="#" onclick="location.reload(true); return false;">Try Again</a>');
        }
        $('#loading').hide();
        $('#confirmation').fadeIn('slow').show();
    };
    
    // toggle API donate & startDonation methods
    $('#payment_type').on('change', function() {
        switch(this.value) {
            case "Visa":
            case "MasterCard":
            case "American Express":
            case "Discover": 
                $(".donation-form [name='method']").val('donate');
                $("#credit-details").show();
                break;
            case "Amazon":
                $(".donation-form [name='method']").val('startDonation');
                $(".donation-form [name='extproc']").val('amazon');
                $("#credit-details").hide();
                break;
            case "PayPal":
                $(".donation-form [name='method']").val('startDonation');
                $(".donation-form [name='extproc']").val('paypal');
                $("#credit-details").hide();
                break;
        }
    });
    
  });
  
})(jQuery);

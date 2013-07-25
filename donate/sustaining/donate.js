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
        //console.log(data);
        
        //generate donation levels on the form
        var donationLevels = luminateExtend.utils.ensureArray(data.getDonationFormInfoResponse.donationLevels.donationLevel);

        $(donationLevels).each(function(i, level) {
            if (level.userSpecified === 'true') {
                $('#donation-amounts').append( '<label style="display:inline; vertical-align:top; padding-right: 10px;">'
                                             +    '<input name="level_id" id="other" value="' + level.level_id + '" type="radio">'
                                             +    'Other'
                                             + '</label>'
                                             + '<div class="input-prepend input-append" style="margin-top: -5px ">'
                                             +    '<span class="add-on">$</span>'
                                             +    '<input class="input-small updateTotal" style="text-align:right" name="other_amount" type="text" placeholder="" disabled>'
                                             +    '<span class="add-on">.00</span>'
                                             + '</div>'
                                             );
            }
            else {
                $('#donation-amounts').append( '<label style="display:inline; vertical-align:top; padding-right: 18px;">'
                                             +   '<input class="updateTotal" name="level_id" value="' + level.level_id + '" type="radio" data-amount="'+ parseInt(level.amount.decimal) +'">'
                                             +   level.amount.formatted
                                             + '</label>'
                                             );
            }
        });
        
        $('input[name="level_id"]').on('click', function() {
            if ($(this).is('#other')) {
                $('input[name="other_amount"]').removeAttr('disabled');
                $('input[name="other_amount"]').focus();
            }
            else {
                $('input[name="other_amount"]').attr('disabled', 'disabled');
            }
        });
        
        //handle autorepeat donation option
		if (data.getDonationFormInfoResponse.supportsSustaining == 'true') {
			$('#donation-information').append( '<label>Gift Type</label>'
                                             + '<label style="display:inline; vertical-align:top; padding-right: 18px;">'
                                             +   '<input class="updateTotal" type="radio" name="giftType" value="sustaining" checked>'
                                             +   'Sustaining Gift'
                                             + '</label>'
                                             + '<label style="display:inline; vertical-align:top; padding-right: 18px;">'
                                             +   '<input class="updateTotal" type="radio" name="giftType" value="oneTime">'
                                             +   'One-time Gift'
                                             + '</label>'
                                             + '<fieldset id="sustaining-info">'
                                             +   '<label>Gift Duration</label>'
                                             +   '<label id="duration-label" style="display:inline-block; width:115px; margin-right:5px; text-align:center;">Forever (monthly)</label>'
                                             +   '<input id="duration" class="updateTotal" type="range" min="2" max="13" value="13">'
                                             + '</fieldset>'
                                             + '<input type="hidden" name="sustaining.frequency" value="monthly">'
                                             + '<input type="hidden" name="sustaining.duration" value="0">'
                                             );
                                             
            $('input[name="giftType"]').on('change', function(){
                if($(this).val() === "sustaining"){
                    $('#sustaining-info').slideDown();
                    $('input[name="sustaining.frequency"]').val('monthly');
                }
                else if($(this).val() === "oneTime"){
                    $('#sustaining-info').slideUp();
                    $('input[name="sustaining.frequency"]').val('one-time');
                }
            });
            $('#duration').on('change', function(){
                if($(this).val() === "13"){
                    $('#duration-label').text('Forever (monthly)');
                    $('input[name="sustaining.duration"]').val("0");
                }
                else{
                    $('#duration-label').text($(this).val() + ' months');
                    $('input[name="sustaining.duration"]').val($(this).val());
                }
            });
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
        
        $('.updateTotal').on('change', function(){
            var total = 0,
                level_amount;
                
            if($('input[name="level_id"]:checked').is('#other')){
                level_amount = parseInt($('input[name="other_amount"]').val());
            }
            else{
                level_amount = $('input[name="level_id"]:checked').attr('data-amount');
            }
            
            if($('input[name="giftType"]:checked').val() === "sustaining"){
                var months = parseInt($('input[name="sustaining.duration"]').val());
                if(months == 0){
                    total = level_amount * 12;
                    $('#total').text('Total: $' + total + '.00 per year');
                }
                else{
                    total = level_amount * months;
                    $('#total').text('Total: $' + total + '.00 over ' + months + ' months');
                }
            }
            else if($('input[name="giftType"]:checked').val() === "oneTime"){
                total = level_amount;
                $('#total').text('Total: $' + total + '.00');
            }
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
        //for Paypal/Amazon payments
        if (data.donationResponse && data.donationResponse.redirect) {
            window.location.href = data.donationResponse.redirect.url;
        }
        //for credit card payments
        if (data.donationResponse && data.donationResponse.donation) {
            
            var today = luminateExtend.utils.simpleDateFormat(new Date(), 'MM/dd/yyyy');
            
            $('#confirmation').append('<div class="alert alert-success">' 
                                     + 'Your donation has been processed!' 
                                     + '</div>' 
                                     + '<div class="transaction-summary">'
                                     +   '<h3>Transaction Summary</h3>'
                                     +   '<table class="table table-striped table-bordered">'
                                     +     '<tr>'
                                     +       '<td>Donation Date:</td>'
                                     +       '<td><p>' + today + '</p></td>'
                                     +     '</tr>'
                                     +     '<tr>'
                                     +       '<td>Donation Amount:</td>'
                                     +       '<td>' + data.donationResponse.donation.amount.formatted + '</td>'
                                     +     '</tr>'
                                     +     '<tr>'
                                     +       '<td>Name:</td>'
                                     +       '<td>' + $('#billing_name_first').val() + ' ' + $('#billing_name_last').val() + '</td>'
                                     +     '</tr>'
                                     +     '<tr>'
                                     +       '<td>Street 1:</td>'
                                     +       '<td>' + $('#billing_address_street1').val() + '</td>'
                                     +     '</tr>'
                                     +     '<tr>'
                                     +     '<tr>'
                                     +       '<td>City:</td>'
                                     +       '<td>' + $('#billing_address_city').val() + '</td>'
                                     +     '</tr>'
                                     +     '<tr>'
                                     +       '<td>State/Province:</td>'
                                     +       '<td>' + $('#billing_address_state').val() + '</td>'
                                     +     '</tr>'
                                     +     '<tr>'
                                     +       '<td>ZIP/Postal Code:</td>'
                                     +        '<td>' + $('#billing_address_zip').val() + '</td>'
                                     +     '</tr>'
                                     +     '<tr>'
                                     +       '<td>Email Address:</td>'
                                     +       '<td>' + $('#donor_email').val() + '</td>'
                                     +     '</tr>'
                                     +     '<tr>'
                                     +       '<td>Organization Name:</td>'
                                     +       '<td>--insert organization name here--</td>'
                                     +     '</tr>'
                                     +     '<tr>'
                                     +       '<td>Tax ID:</td>'
                                     +       '<td>12345678</td>'
                                     +     '</tr>'
                                     +     '<tr>'
                                     +       '<td>Confirmation Code:</td>'
                                     +       '<td>' + data.donationResponse.donation.confirmation_code + '</td>'
                                     +     '</tr>'
                                     +   '</table>'
                                     + '</div>'
                                     );
        }
        else if (data.donationResponse && data.donationResponse.errors) {
            $('#confirmation').append('Error processing donation. <a href="#" onclick="location.reload(true); return false;">Try Again</a>');
        }
        $('#loading').hide();
        $('#confirmation').fadeIn('slow');
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

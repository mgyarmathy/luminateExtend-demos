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
      callback: addFormInfo,
      useHTTPS: true,
      requestType: 'GET'
    });


    function addFormInfo(data){
        //console.log(data);
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
			$('#donation-amounts').append( '<label>'
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
                 , 'ecard.send_date': { date: true
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
        , messages: { 'tribute.honoree.name.full' : 'Honoree name required'
                    , 'ecard.send_date' : 'Please use the following date format: YYYY-MM-DD'
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
        , ignore: '.ignore'
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
                                     +       '<td>Honoree Name:</td>'
                                     +       '<td>' + $('#honoree-name').val() + '</td>'
                                     +     '</tr>'
                                     +     '<tr>'
                                     +       '<td>Donation Amount:</td>'
                                     +       '<td>' + data.donationResponse.donation.amount.formatted + '</td>'
                                     +     '</tr>'
                                     +     '<tr>'
                                     +       '<td>Billing Name:</td>'
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
    
    $('#ecard-preview').click(function(e){
        e.preventDefault();
        var url = luminateExtend.global.path.nonsecure
                + 'Ecard?taf_preview=true&taf_popup_preview_donations=true&mfc_popup=true'
                + '&ecard_id=' + $('input[name="ecard.id"]:checked').val()
                + '&stationery_layout_id=' + $('input[name="ecard.id"]:checked').val()
                + '&message=' + $('#ecard-message').val()
                + '&subject=' + $('#ecard-subject').val()
                + '&sendtoemail=' + $('#ecard-recipients').val()
                + '&cons_info_component=true'
        newwindow=window.open(url,'preview','height=600,width=600');
        if (window.focus) {newwindow.focus()}
        return false;
    });
    
    $('#makeTribute').on('change', function(){
        if($(this).is(':checked')){
            $('#honoree-information').show();
        }
        else{
            $('#honoree-information').hide();
        }
    });
    
    $('#ecard-send').on('change', function(){
        if($(this).is(':checked')){
            $('input[name="ecard.send"]').val('true');
            $('#ecard-info').show();
        }
        else{
            $('input[name="ecard.send"]').val('false');
            $('#ecard-info').hide();
        }
    });
    
  });
  
})(jQuery);

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
                $('#donation-amounts').append( '<label class="other">'
                                             +    '<input name="level_id" id="other" value="' + level.level_id + '" type="radio">'
                                             +    'Other Amount:'
                                             + '<div class="input-prepend input-append">'
                                             +    '<span class="add-on">$</span>'
                                             +    '<input class="updateTotal" style="text-align:right" name="other_amount" type="text" disabled>'
                                             +    '<span class="add-on">.00</span>'
                                             + '</div>'
                                             + '</label>'
                                             );
            }
            else {
                $('#donation-amounts').append( '<label>'
                                             +   '<input class="updateTotal" name="level_id" value="' + level.level_id + '" type="radio" data-amount="'+ parseInt(level.amount.decimal) +'">'
                                             +   level.amount.formatted
                                             + '</label>'
                                             );
            }
        });
        
        $('#donation-amounts').after('<hr>');
        
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
			$('#total').before( '<label class="required">Gift Type</label>'
                              + '<fieldset id="gift-type">'
                              + '<label class="radio">'
                              +   '<input class="updateTotal" type="radio" name="giftType" value="sustaining" checked>'
                              +   'Sustaining Gift'
                              + '</label>'
                              + '<label class="radio">'
                              +   '<input class="updateTotal" type="radio" name="giftType" value="oneTime">'
                              +   'One-time Gift'
                              + '</label>'
                              + '</fieldset>'
                              )
                       /* default range slider */
                       .before( '<fieldset id="sustaining-info" class="hide-mobile">'
                              +   '<label>Gift Duration</label>'
                              +   '<div class="range-slider">'
                              +   '<div id="duration-label">2 Months</div>'
                              +   '<input class="duration updateTotal" type="range" min="2" max="13" value="2">'
                              +   '</div>'
                              + '</fieldset>'
                              )
                       /* alternative select box */
                       .before( '<fieldset id="sustaining-info" class="show-mobile">'
                              +   '<label>Gift Duration</label>'
                              +   '<select class="duration updateTotal">'
                              +     '<option value="2" selected>2 months</option>'
                              +     '<option value="3">3 months</option>'
                              +     '<option value="4">4 months</option>'
                              +     '<option value="5">5 months</option>'
                              +     '<option value="6">6 months</option>'
                              +     '<option value="7">7 months</option>'
                              +     '<option value="8">8 months</option>'
                              +     '<option value="9">9 months</option>'
                              +     '<option value="10">10 months</option>'
                              +     '<option value="11">11 months</option>'
                              +     '<option value="12">12 months</option>'
                              +     '<option value="13">Forever (monthly)</option>'
                              +   '</select>'
                              + '</fieldset>'
                              )      
                        
                       .before( '<input type="hidden" name="sustaining.frequency" value="monthly">'
                              + '<input type="hidden" name="sustaining.duration" value="2">'
                              );
                                             
            $('input[name="giftType"]').on('change', function(){
                if($(this).val() === "sustaining"){
                    $('#sustaining-info').show();
                    $('input[name="sustaining.frequency"]').val('monthly');
                }
                else if($(this).val() === "oneTime"){
                    $('#sustaining-info').hide();
                    $('input[name="sustaining.frequency"]').val('one-time');
                }
            });
            $('.duration').on('change', function(){
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
            if($('input[name="level_id"]:checked').length == 0){
                return;
            }
            else if($('input[name="level_id"]:checked').is('#other')){
                level_amount = parseInt($('input[name="other_amount"]').val());
            }
            else{
                level_amount = $('input[name="level_id"]:checked').attr('data-amount');
            }
            
            if($('input[name="giftType"]:checked').val() === "sustaining"){
                var months = parseInt($('input[name="sustaining.duration"]').val());
                if(months == 0){
                    total = level_amount * 12;
                    $('#total').html('Total Donation:</br> $' + total + '.00 per year');
                }
                else{
                    total = level_amount * months;
                    $('#total').html('Total Donation:</br> $' + total + '.00 over ' + months + ' months');
                }
            }
            else if($('input[name="giftType"]:checked').val() === "oneTime"){
                total = level_amount;
                $('#total').html('Total Donation:</br> $' + total + '.00');
            }
        });
    }
    
    var requireCreditCardInfo = function() {
        return ($('#donate_form [name="method"]').val() === 'donate');
    }
    
    $.validator.messages.required = '&nbsp;<i class="icon-exclamation-sign"></i> Required';
    
    //apply validation to the donation form
	$('#donate_form').validate(
        { debug: true
        , onkeyup: false
        , ignore: '.ignore-validate'
        , rules: { 'donor.email': { email: true
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
        , messages: { 'donor.email' : { email: '&nbsp;<i class="icon-exclamation-sign"></i> Invalid'
                                      }
                    , 'card_number': { creditcard: '&nbsp;<i class="icon-exclamation-sign"></i> Invalid'
                                     }
                    }
        , errorPlacement: function(error, element) {
            if ($('#layout').attr('href') === 'css/mobile.css' || $('#layout').attr('href') === 'css/two-column.css') {
                element.before(error);
            }
            else {
                element.after(error);
            }
          }
        , submitHandler: submitForm
	    }
    );
    
    //donation form submission via AJAX
    function submitForm(){
        if($('#donate_form').valid()) {
            $('#donate_form').fadeOut('slow').hide();
            $('#sidebar-box').fadeOut('slow').hide();
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
                $("#donate_form [name='method']").val('donate');
                $("#credit-details").show();
                break;
            case "Amazon":
                $("#donate_form [name='method']").val('startDonation');
                $("#donate_form [name='extproc']").val('amazon');
                $("#credit-details").hide();
                break;
            case "PayPal":
                $("#donate_form [name='method']").val('startDonation');
                $("#donate_form [name='extproc']").val('paypal');
                $("#credit-details").hide();
                break;
        }
    });
    
    $('#email-opt-in').on('change', function() {
        if ($(this).is(':checked')) {
            $('input[name="donor.email_opt-in"]').val('true');
        }
        else {
            $('input[name="donor.email_opt-in"]').val('false');
        }
    });
    
    $('#whats-this').click(function(e) {
        e.preventDefault();
        if ($('#whats-this-info').is(':visible')) {
            $('#whats-this-info').hide();
        }
        else {
            $('#whats-this-info').show();
        }
    });
    
  });
  
})(jQuery);

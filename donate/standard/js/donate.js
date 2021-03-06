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
        //generate donation levels on the form
        var donationLevels = luminateExtend.utils.ensureArray(data.getDonationFormInfoResponse.donationLevels.donationLevel);

        $(donationLevels).each(function(i, level) {
            if (level.userSpecified === 'true') {
                $('#donation-amounts').append( '<label class="other">'
                                             +    '<input name="level_id" id="other" value="' + level.level_id + '" type="radio">'
                                             +    'Other Amount:'
                                             + '<div class="input-prepend input-append">'
                                             +    '<span class="add-on">$</span>'
                                             +    '<input name="other_amount" type="text" disabled>'
                                             +    '<span class="add-on">.00</span>'
                                             + '</div>'
                                             + '</label>'
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
        
        //check the first donation amount
        $($('#donation-amounts input[type="radio"]')[0]).prop('checked', true);
        
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
        if (data.getDonationFormInfoResponse.supportsLevelAutorepeat == 'true') {
            $('#donation-amounts').append( '<input name="autorepeat" type="checkbox">'
                                         + '<div class="checkbox-label">'
                                         +    'Please repeat this gift automatically every month.'
                                         + '</div>'
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
    
    var requireOtherAmount = function() {
        return $('#other').is(':checked');
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
                 , 'other_amount': { required: { depends: requireOtherAmount
                                               }
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
        , groups: { cardInfo: 'card_number card_cvv' }
        , errorPlacement: function(error, element) {
            if ($('#layout').attr('href') === 'css/mobile.css' || $('#layout').attr('href') === 'css/two-column.css') {
                if (error[0].htmlFor == 'other_amount') {
                    $('#donation-information').find('label').eq(0).after(error);
                }
                else {
                    element.before(error);
                }
            }
            else {
                if (error[0].htmlFor == 'cardInfo') {
                        $('input[name="card_number"]').css('margin-right', '1%');
                        $('input[name="card_number"]').after(error);
                }
                else {
                    element.after(error);
                }
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
                                     +       '<td>Street 2:</td>'
                                     +       '<td>' + $('#billing_address_street2').val() + '</td>'
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
                                     +       '<td>Country:</td>'
                                     +       '<td>' + $('#billing_address_country').val() + '</td>'
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
            case "":
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
            $(this).find('img').eq(0).show();
            $(this).find('img').eq(1).hide();
        }
        else {
            $('#whats-this-info').show();
            $(this).find('img').eq(0).hide();
            $(this).find('img').eq(1).show();
        }
    });
    
  });
  
})(jQuery);

(function($) {

  $(function() {
    
    var NUMBER_OF_DESIGNATION_OPTIONS = 3;
    
    /* set api key value and nonsecure/secure paths */
    luminateExtend({
        apiKey: '123456789', 
        path: {
            nonsecure: 'http://www.myorganization.com/site/', 
            secure: 'https://secure2.convio.net/myorg/site/'
      }
    });
    
    luminateExtend.api({
      api: 'donation', 
      data: 'method=getDesignees&form_id=' + $('input[name="form_id"]').val(), 
      callback: addDesignees
    });
    
    function addDesignees(data){

        if(data.getDesigneesResponse && data.getDesigneesResponse.designee){
            var designeeOptions = luminateExtend.utils.ensureArray(data.getDesigneesResponse.designee),
                optionsList = '<option value="">- Choose a Program -</option>';
            if(designeeOptions.length < NUMBER_OF_DESIGNATION_OPTIONS+1){
                $.error('function addDesignees(data): NUMBER_OF_DESIGNATION_OPTIONS cannot be greater than ' + (designeeOptions.length-1) );
            }
            
            $.each(designeeOptions, function(){
                optionsList += '<option value="' + this.id + '">' + this.name + '</option>';
            });
            //first designation is required
            $('#designees').append( '<label class="required">Choose a Program</label>'
                                  + '<select name="designated.0.id" required>'
                                  +    optionsList
                                  + '</select>'
                                  + '<table>'
                                  + '<tr>'
                                  + '<td><label class="required designated-amount-label">Amount</label></td>'
                                  + '<td>'
                                  + '<div class="input-prepend input-append">'
                                  +   '<span class="add-on">$</span>'
                                  +   '<input class="designated-amount" style="text-align:right" name="designated.0.amount" type="text" required>'
                                  +   '<span class="add-on">.00</span>'
                                  + '</div>'
                                  + '</td>'
                                  + '</tr>'
                                  + '</table>'
                                  );
            //the rest are not required
            for(var i=1; i<NUMBER_OF_DESIGNATION_OPTIONS; i++){
                $('#designees').append( '<label>Choose a Program</label>'
                                      + '<select name="designated.' + i + '.id"">'
                                      +    optionsList
                                      + '</select>'
                                      + '<table>'
                                      + '<tr>'
                                      + '<td><label class="designated-amount-label">Amount</label></td>'
                                      + '<td>'
                                      + '<div class="input-prepend input-append">'
                                      +   '<span class="add-on">$</span>'
                                      +   '<input class="designated-amount" style="text-align:right" name="designated.' + i + '.amount" type="text">'
                                      +   '<span class="add-on">.00</span>'
                                      + '</div>'
                                      + '</td>'
                                      + '</tr>'
                                      + '</table>'
                                      );
            }
        }
        luminateExtend.api({
          api: 'donation', 
          data: 'method=getDonationFormInfo&form_id=' + $('input[name="form_id"]').val(), 
          callback: addFormInfo
        });
    }

    function addFormInfo(data){
        
        if (data.getDonationFormInfoResponse.supportsWriteInDesignation == 'true') {
            $('#designees').append( '<hr class="hide-mobile">'
                                  + '<input id="writeIn" type="checkbox" class="ignore-validate">'
                                  + '<div class="checkbox-label">'
                                  +   'I would like to enter details about a designation not listed.'
                                  + '</div>'
                                  + '<fieldset id="writeInDesignation" class="hide">'
                                  +   '<label class="required">Program Name</label>'
                                  +   '<input type="text" name="designated_write_in.10.name">'
                                  +   '<table>'
                                  +   '<tr>'
                                  +     '<td><label class="required designated-amount-label">Amount</label></td>'
                                  +     '<td>'
                                  +       '<div class="input-prepend input-append">'
                                  +         '<span class="add-on">$</span>'
                                  +         '<input class="designated-amount" style="text-align:right" name="designated_write_in.10.amount" type="text">'
                                  +         '<span class="add-on">.00</span>'
                                  +       '</div>'
                                  +     '</td>'
                                  +   '</tr>'
                                  +   '</table>'
                                  +   '<label class="required">Contact Information</label>'
                                  +   '<input type="text" name="designated_write_in.10.contact">'
                                  + '</fieldset>'
                                  );
            $('#writeIn').on('change', function(){
                if($(this).is(':checked')){
                    $('#writeInDesignation').show();
                }
                else{
                    $('#writeInDesignation').hide();
                }
            });
        }
        
        $('.designated-amount').on('change', function(){
            var total = 0;
            $('.designated-amount').each(function(){
                if( $(this).val()) {
                  total += parseInt($(this).val());
                }
            });
            $('#total').html('Total Donation: $' + total + '.00');
            if ($('input[name="autorepeat"]').is(':checked')) {
                $('#total').append(' per month');
            }
        });
        
        //handle autorepeat donation option
        if (data.getDonationFormInfoResponse.supportsLevelAutorepeat == 'true') {
            $('#total').before( '<input id="autorepeat" name="autorepeat" type="checkbox">'
                              + '<div class="checkbox-label">'
                              +    'Please repeat the gift(s) automatically every month.'
                              + '</div>'
                              );
            $('input[name="autorepeat"]').on('change', function(){
                $('.designated-amount').trigger('change');
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
    }
    
    var requireWriteInInfo = function() {
        return $('#writeIn').is(':checked');
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
                 , 'designated_write_in.10.name' : { required: { depends: requireWriteInInfo
                                                               }
                                                   }
                 , 'designated_write_in.10.amount' : { required: { depends: requireWriteInInfo
                                                                 }
                                                     }
                 , 'designated_write_in.10.contact' : { required: { depends: requireWriteInInfo
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
        , groups: { designated: 'designated.0.id designated.0.amount'
                  , writeIn: 'designated_write_in.10.name designated_write_in.10.amount'
                  , cardInfo: 'card_number card_cvv'
                  }
        , errorPlacement: function(error, element) {
            if ($('#layout').attr('href') === 'css/mobile.css' || $('#layout').attr('href') === 'css/two-column.css') {
                if (element.attr('name') == 'designated.0.id' || element.attr('name') == 'designated.0.amount') {
                    $('#designees').find('label').eq(1).after(error);
                }
                else if (element.attr('name') == 'designated_write_in.10.name' || element.attr('name') == 'designated_write_in.10.amount') {
                    $('#writeInDesignation').find('label').eq(0).after(error);
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
            luminateExtend.api({
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

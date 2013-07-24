(function($) {

  $(function() {
    
    var NUMBER_OF_DESIGNATION_OPTIONS = 3;
    
    luminateExtend({
        apiKey: '123456789', 
        path: {
            nonsecure: 'http://vateam.convio.net/site/', 
            secure: 'https://secure2.convio.net/vateam/site/'
      }
    });
    
    luminateExtend.api({
      api: 'donation', 
      data: 'method=getDesignees&form_id=' + $('input[name="form_id"]').val(), 
      callback: addDesignees
    });
    
    function addDesignees(data){
        console.log(data);
        if(data.getDesigneesResponse && data.getDesigneesResponse.designee){
            var designeeOptions = luminateExtend.utils.ensureArray(data.getDesigneesResponse.designee),
                optionsList = '<option value="">- Choose a Program -</option>';
            if(designeeOptions.length < NUMBER_OF_DESIGNATION_OPTIONS){
                $.error('function addDesignees(data): NUMBER_OF_DESIGNATION_OPTIONS is greater than number of designees');
            }
            console.log(designeeOptions);
            $.each(designeeOptions, function(){
                optionsList += '<option value="' + this.id + '">' + this.name + '</option>';
            });
            for(var i=0; i<NUMBER_OF_DESIGNATION_OPTIONS; i++){
                $('#designees').append( '<select name="designated.' + i + '.id" class="input-xlarge" style="margin-right: 10px;">'
                                      +    optionsList
                                      + '</select>'
                                      + '<div class="input-prepend input-append">'
                                      +   '<span class="add-on">$</span>'
                                      +   '<input class="input-small designated-amount" style="text-align:right" name="designated.' + i + '.amount" type="text" value="0">'
                                      +   '<span class="add-on">.00</span>'
                                      + '</div>'
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
        console.log(data);
        
        if (data.getDonationFormInfoResponse.supportsWriteInDesignation == 'true') {
            $('#designees').append( '<label>'
                                  +   '<input id="writeIn" type="checkbox">'
                                  +   'I would like to enter details about a designation not listed'
                                  + '</label>'
                                  + '<fieldset id="writeInDesignation" style="display:none">'
                                  +   '<label style="display:inline-block; width: 53%">Program Name</label>'
                                  +   '<label style="display:inline-block;">Amount</label>'
                                  +   '<input type="text" name="designated_write_in.0.name." style="width: 255px; margin-right: 10px;" placeholder="Name">'
                                  +   '<div class="input-prepend input-append">'
                                  +     '<span class="add-on">$</span>'
                                  +     '<input class="input-small designated-amount" style="text-align:right" name="designated_write_in.0.amount" type="text" value="0">'
                                  +     '<span class="add-on">.00</span>'
                                  +   '</div>'
                                  +   '<label>Contact Information</label>'
                                  +   '<textarea rows=3 name="designated_write_in.0.contact"></textarea>'
                                  + '</fieldset>'
                                  );
            $('#writeIn').on('change', function(){
                if($(this).is(':checked')){
                    $('#writeInDesignation').slideDown();
                }
                else{
                    $('#writeInDesignation').slideUp();
                }
            });
        }
        $('#payment-information').append( '<div id="total" style="margin-bottom: 10px;">'
                              +   'Total: $0.00'
                              + '</div>'
                              );
        $('.designated-amount').on('change', function(){
            var total = 0;
            $('.designated-amount').each(function(){
                total += parseInt($(this).val());
            });
            $('#total').text('Total: $' + total + '.00');
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

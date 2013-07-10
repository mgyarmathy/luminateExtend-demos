/*	
*   donate.js
*   Author: Michael Gyarmathy, Web Developer Intern, Blackbaud
*   Date: June 21, 2013
*   Description: demonstration of luminateExtend.js and Luminate Donation API
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
        submitHandler: function(form) {
            submitForm();
        }
    });
    
    //donation form submission via AJAX
    function submitForm() {
        if($('#donate_form').valid()) {
            $('#donate_form').fadeOut('slow').hide();
            $('#loading').show();
            luminateExtend.api.request({
                api: 'CRDonationAPI', 
                callback: donateCallback, 
                data: 'method=donate',
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
});
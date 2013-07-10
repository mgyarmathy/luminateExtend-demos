/*	
*	login.js
*   Author: Michael Gyarmathy, Web Developer Intern, Blackbaud
*	Date: June 21, 2013
*	Description: demonstration of luminateExtend.js and Luminate Single Sign-on API
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
    
    //log out any existing session on page load
    luminateExtend.api.request({
      api: 'cons', 
      data: 'method=logout',
      useHTTPS: true,
    });
    
    //perform login via AJAX request
    function login() {
        luminateExtend.api.request({
          api: 'CRConsAPI', 
          callback: loginCallback, 
          data: 'method=login',
          form: '#login_form',
          requestType: 'POST',
          useHTTPS: true
        });
    }
    
    //callback function after login
    function loginCallback(data) {
        $('#login-failed').fadeOut();
        if(data.errorResponse){ //failed login
            if($('#login-failed').length == 0){//add login-failed alert if previously not displayed
                $('#login').prepend('<div id="login-failed" class="alert alert-error" style="display:none">Invalid username/password combination. Please try again.</div>');
            }
            $('#login-failed').fadeIn();
            $('#username').attr('required', '');
            $('#password').attr('required', '');
            
         }
        else if(data.loginResponse){ //successful login
            //hide login form
            $('#login').fadeOut('slow');
            
            /*
             * NOTE: luminate:cons tags do not work properly due to requests being made on internal site (VATEAM)
             */
            //$('#user').append('Hello, <luminate:cons field="name.first"></luminate:cons>!');
            //luminateExtend.tags.parse();
            
            //write username instead
            $('#user').append('Hello, ' + $('#username').val() + '!');
            $('#user').fadeIn('slow');
        }
    }
    
    //display login form
    $('#login').fadeIn('slow');
    
    //override form submission to perform AJAX request
    $('#login_form').submit(function() {
        login();
        return false;
    });
    
    //allow use of enter key to perform login
    $('#login_form input').keypress(function(event) {
        if (event.which == 13) { //enter key
            event.preventDefault();
            login();
        }
    });
    
});
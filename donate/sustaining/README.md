/donate/sustaining
====================
An API donation form with support for sustaining donations.

http://luminateextend.site44.com/donate/

## Usage

1. Make sure luminateExtend is properly set up by following the instructions here:

https://github.com/noahcooper/luminateExtend/blob/master/README.md

2. Specify the donation form layout stylesheet. (`sustaining-form.html` - line 8).

```html
<link rel="stylesheet" href="css/mobile.css">
```

3. Set payment-success and payment-error redirect urls for the form. (`sustaining-form.html` - line 48/50).

```html
<input id="finish_success_redirect" name="finish_success_redirect" type="hidden" value="http://www.mysite.com/sustaining/payment-success.html" />
<input id="finish_error_redirect" name="finish_error_redirect" type="hidden" value="http://www.mysite.com/sustaining/payment-error.html" />
```

4. Change the form's donation form-id to match the id of your shadow form. (`sustaining-form.html` - line 52).

```html
<input type="hidden" name="form_id" value="0000">
```

5. Provide the necessary information to initialize luminateExtend in `js/donate.js`.

```javascript
luminateExtend({
    apiKey: '123456789', 
    path: {
        nonsecure: 'http://www.myorganization.com/site/', 
        secure: 'https://secure2.convio.net/myorg/site/'
  }
});
```

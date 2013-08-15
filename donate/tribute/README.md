/donate/tribute
====================
An honor/memorial API donation form with support for eCards.

http://luminateextend.site44.com/donate/

## Usage

1. Make sure luminateExtend is properly set up by following the instructions here:
https://github.com/noahcooper/luminateExtend/blob/master/README.md

2. Specify the donation form layout stylesheet. (`tribute-form.html` - line 8).
```html
<link rel="stylesheet" href="css/mobile.css">
```

3. Set payment-success and payment-error redirect urls for the form. (`tribute-form.html` - line 51/53).
```html
<input id="finish_success_redirect" name="finish_success_redirect" type="hidden" value="http://www.mysite.com/standard/payment-success.html" />
<input id="finish_error_redirect" name="finish_error_redirect" type="hidden" value="http://www.mysite.com/standard/payment-error.html" />
```

4. Change the form's donation form-id to match the id of your shadow form. (`tribute-form.html` - line 55).
```html
<input type="hidden" name="form_id" value="0000">
```

5. Add in eCard ids and image thumbnails. (`tribute-form.html` - line 102-123)
```html
<table>
<tr>
    <td class="ecard-option">
        <input type="radio" name="ecard.id" value="0000" checked>
        <img src="img/ecard-placeholder.png" />
    </td>
    <td class="ecard-option">
        <input type="radio" name="ecard.id" value="0000">
        <img src="img/ecard-placeholder.png" />
    </td>
</tr>
<tr>
    <td class="ecard-option">
        <input type="radio" name="ecard.id" value="0000">
        <img src="img/ecard-placeholder.png" />
    </td>
    <td class="ecard-option">
        <input type="radio" name="ecard.id" value="0000">
        <img src="img/ecard-placeholder.png" />
    </td>
</tr>
</table>
```

6. Provide the necessary information to initialize luminateExtend in `js/donate.js`.
```javascript
luminateExtend({
    apiKey: '123456789', 
    path: {
        nonsecure: 'http://www.myorganization.com/site/', 
        secure: 'https://secure2.convio.net/myorg/site/'
  }
});
```

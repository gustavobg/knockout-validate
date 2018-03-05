#knockout-validate
[![Build Status](https://travis-ci.org/gustavobg/knockout-validate.svg)](https://travis-ci.org/gustavobg/knockout-validate)

KnockoutJS BindingHandler for ViewModel Validation

Based on https://github.com/Knockout-Contrib/Knockout-Validation.

##Why another validate plugin?

The [Knockout-Validation](https://github.com/Knockout-Contrib/Knockout-Validation) is based on ViewModel extenders to set the validation rules.
This plugin is just based on bindingHandlers and DOM to add viewModel rules.
Works in any viewModel context, inside others bindingHandlers and knockout components.

License: [MIT](http://www.opensource.org/licenses/mit-license.php)

##Install

####Bower
```sh
bower install knockout-validate --save
```

##Getting Started
```javascript
<div id="examples">
    <form data-bind="validateForm: submitHandler: Save">
        <div class="form-group">
            <label for="name">Name</label>
            <input id="name" class="form-control" type="text" data-bind="value: name, validate: { required: true }" />
        </div>
        <div class="form-group">
            <label for="email">E-mail</label>
            <input id="email" class="form-control" type="text" data-bind="value: email, validate: { email: true }" />
        </div>
        <div class="form-group">
            <label for="age">Your age</label>
            <input id="age" class="form-control" type="text" data-bind="value: age, validate: { digit: true }" />
        </div>
        <div class="form-group">
            <label for="password">Password</label>
            <input id="password" class="form-control" type="password" data-bind="value: password, validate: { required: true }" />
        </div>
        <div class="form-group">
            <label for="confirm_password">Confirm Password</label>
            <input id="confirm_password" class="form-control" type="password" data-bind="value: confirm_password, validate: { required: true, equal: password }" />
        </div>
        <input type="submit" class="btn btn-success" value="Submit">
    </form>
</div>
<script>
    var vm = function () {
        var self = this;
        this.name = ko.observable();
        this.age = ko.observable();
        this.password = ko.observable();
        this.email = ko.observable();
        this.confirm_password = ko.observable();

        this.Save = function () {
            if (self.isValid) {
                alert('Valid form! submitting!')
            } else {
                alert('Hmm. Check this errors!');
                self.showErrors();
            }
        };
    };
    vm = new vm();
    ko.applyBindings(vm, document.getElementById('examples'));
</script>
```



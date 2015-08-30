ko.validate = {};
ko.validate.utils = {};
ko.validate.utils = (function () {  
    return {
        getBindingHandlerValue: function (valueAccessor, allBindings) {
            if (allBindings().hasOwnProperty('value'))
                return allBindings().value;
            else if (allBindings().hasOwnProperty('textInput'))
                return allBindings().textInput;
            else if (allBindings().hasOwnProperty('checked'))
                return allBindings().checked;
        },
        isArray: function (o) {
            return o.isArray || Object.prototype.toString.call(o) === '[object Array]';
        },
        isObject: function (o) {
            return o !== null && typeof o === 'object';
        },
        isNumber: function (o) {
            return !isNaN(o);
        },
        getValue: function (o) {
            return ko.utils.unwrapObservable(o);
        },
        hasAttribute: function (node, attr) {
            return node.getAttribute(attr) !== null;
        },
        getAttribute: function (element, attr) {
            return element.getAttribute(attr);
        },
        setAttribute: function (element, attr, value) {
            return element.setAttribute(attr, value);
        },
        isEmptyVal: function (val) {
            if (val === undefined) {
                return true;
            }
            if (val === null) {
                return true;
            }
            if (val === "") {
                return true;
            }
        }
    }
}());

// Configuration
var defaults = {
    useRequiredMarker: true,
    classElementError: 'error',
    classMessageError: 'error-message'    
};

// make a copy  so we can use 'reset' later
var configuration = ko.utils.extend({}, defaults);

configuration.reset = function () {
    ko.utils.extend(configuration, defaults);
};
ko.validate.configuration = configuration;

ko.validate['setValidationProperties'] = function (vm, options) {    
    var validateModel = function () {
        var self = this;
        this.numberOfValidateFields = ko.observable(0);
        this.invalidFields = ko.observableArray([]);
        this.isValid = ko.computed(function () {            
            return self.invalidFields().length === 0;
        });
        this.isValidShowErrors = function () {
            if (self.isValid())
                return true;
            else
            {
                self.showErrors(true);
                return false;
            }
        };
        this.showErrors = function (show) {
            if (show === undefined) {//default to true
                show = true;
            }
            ko.utils.arrayForEach(self.invalidFields(), function (elementId, index) {
                //var options = ko.validate.utils.getConfigOptions(element);  
                var element = $('#' + elementId),
                    formGroup = element.closest('.form-group').addClass('error');
                element.addClass(element.data('errorClass'));
                element.next().show();

                if (index === 0) {                    
                    if (element.is(':visible'))
                        element.focus();
                    else
                        formGroup[0].scrollIntoView({ behavior: "smooth"});
                }
            });
        };
    };
    ko.utils.extend(vm, new validateModel());   
};

// Binding Handlers

// ValidateOptions:
// This binding handler allows you to override the initial config by setting any of the options for a specific element or context of elements
//
// Example:
// <div data-bind="validateOptions: { classElementError: 'error', classMessageError: 'error-message' }">
//      <input type="text" data-bind="value: someValue" data-bind="validate: { notEqual: someValue2 }" />
//      <input type="text" data-bind="value: someValue2" data-bind="validate: { required: true }" />
// </div>
ko.bindingHandlers['validateOptions'] = (function () {
    return {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var options = ko.utils.unwrapObservable(valueAccessor());
            
            var innerBindingContext = bindingContext.extend({ validateOptions: options });
            ko.applyBindingsToDescendants(innerBindingContext, element);

            return { controlsDescendantBindings: true };
        }
    };
}());

ko.bindingHandlers.validate = {
    //preprocess: function (value, name, addBindingCallback) {
    //    console.log(value, name, addBindingCallback);
    //    if (value == "setRequired") {
    //        addBindingCallback('required', "true");
    //    }
    //    return value;
    //},
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {

        var value = ko.validate.utils.getBindingHandlerValue(valueAccessor, allBindings),
            // check if validation is in a component context
            viewModel = bindingContext.$component ? bindingContext.$component : viewModel,
            options = bindingContext.hasOwnProperty('validateOptions') ? $.extend({}, ko.validate.configuration, bindingContext.validateOptions) : ko.validate.configuration,
            element = $(element),
            elementMessage = $('<span class="' + options.classMessageError + '" style="display: none"></span>').insertAfter(element),
            setValid = function (elementId) {
                viewModel.invalidFields.remove(elementId);
            },
            setRequiredMarker = function (element) {
                element.closest('.form-group').addClass('required');
            },
            removeRequiredMarker = function (element) {
                element.closest('.form-group').removeClass('required');
            },
            setMessage = function (element, message) {
                element.next().text(message);
                element.data('errorClass', options.classElementError);  
            },
            setInvalid = function (elementId) {
                viewModel.invalidFields.push(elementId);
            },
            hideError = function (element) {
                element.closest('.form-group').removeClass('error');
                element.removeClass(options.classElementError);
                element.next().hide();
            },
            showError = function (element, message) {                
                element.closest('.form-group').addClass('error');
                element.addClass(options.classElementError);
                element.next().show();
            },
            validateRules = function (valueAccessor, value) {
                // valid params format are: validate: { value: property1, required: true, notEquals: property2 }
                // or: validate: { value: property1: rules: { required: true, notEquals: property2 } }
                var isValid = true, messages = [], param = '', hasRequiredRule = false;

                if (valueAccessor.hasOwnProperty('rules')) {
                    valueAccessor = valueAccessor.rules;
                }
                for (var prop in valueAccessor) {
                    if (prop === 'value')
                        continue;
                    if (ko.validate.rules[prop]) {
                        // rule exists
                        var validate = ko.validate.rules[prop],
                            param = valueAccessor[prop],
                            isValidRule = validate.validator(value, ko.utils.unwrapObservable(param));

                        if (prop === 'required')
                            hasRequiredRule = param;
                        if (validate.hasOwnProperty('valid')) 
                            isValidRule = validate.valid;
                        if (!isValidRule) {
                            messages.push(valueAccessor[prop] !== null && valueAccessor[prop].hasOwnProperty('message') ? valueAccessor[prop].message : validate.message);
                            isValid = false;
                        }
                    } else {
                        if (console)
                            console.error('ValidateWarning: The rule "' + prop + '" is not defined, check the rules defined ->', ko.validate.rules);
                    }
                }
                return { messages: messages, valid: isValid, hasRequiredRule: hasRequiredRule };
            };        

        if (value === undefined) {
            if (console)
                console.error('ValidateError: Missing "value" bind parameter. Should be a "value", "textInput", "checked" or a "value" parameter inside the validate handler (validate: { value: observable, required: true })', element);
            return;
        }

        // append error list to root viewmodel        
        if (options.hasOwnProperty('appendErrorsToRoot')) {
            if (options.appendErrorsToRoot)
                viewModel = bindingContext.$root;
        }
      
        // check if viewmodel context has validation properties
        if (!viewModel.hasOwnProperty('isValid')) {            
            ko.validate.setValidationProperties(viewModel);
        }
        
        ko.computed(function () {
            var v = ko.utils.unwrapObservable(value), // trigger
                isFirstEvaluation = ko.computedContext.isInitial(),
                validateResult = {},
                elementId = element.attr('id');

            //{ required: true, email: vm.email, equals: { param: vm.property, message: "Values must be equal!" } }
            // rule can be an observable             
            if (elementId.length === 0) {
                if (console)
                    console.error(element);
                throw ('ValidateError: Element to validate must have an ID');
            }            
            validateResult = validateRules(valueAccessor(), v); // trigger
            setMessage(element, validateResult.messages.join('. '));
           
            if (validateResult.hasRequiredRule) {
                setRequiredMarker(element);
            } else {
                removeRequiredMarker(element);
            }
            if (validateResult.valid) {
                setValid(elementId);
                hideError(element);
            } else {
                setInvalid(elementId);
                // show error only if observable is modified and is not first computed evaluation
                if (!isFirstEvaluation && !validateResult.hasRequiredRule)
                    showError(element);
            }
        });

    },
    update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {}
};


ko.bindingHandlers.validateForm = {
    // Set submit action and binds the ENTER key

    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        // validate form adapter
        if (element.nodeName === 'FORM') {  
            // find validate elements
            var options = valueAccessor();

            element.setAttribute('novalidate', 'novalidate');

            $el = $(element);
            

            if (options.hasOwnProperty('submitHandler')) {
                var submitHandler = function () {
                    if (viewModel.isValid()) {
                        options.submitHandler();
                    }
                    else
                        viewModel.showErrors();
                };
                $el.on('keydown', function (e) {
                    // blur elements to trigger viewmodel changes                  
                    if (e.keyCode === 13 && e.target.tagName != 'TEXTAREA') {
                        if (e.target.classList.contains('modal'))
                            return;
                        e.target.blur();
                        submitHandler();

                        // prevent top handlers from submitting
                        e.stopPropagation(); // prevent submit
                        e.preventDefault();
                    }
                });               
                $el.on('submit', function (e) {
                    e.stopPropagation(); // prevent submit
                    e.preventDefault();
                    submitHandler();
                });
            }

        } else {
            throw ('ValidateError: This validateForm handler should be used on a form element');
        }

    }
};

ko.applyBindingsWithValidation = function (viewModel, rootNode, options) {    
    ko.validate.setValidationProperties(viewModel, options);
    ko.applyBindings(viewModel, rootNode);
};
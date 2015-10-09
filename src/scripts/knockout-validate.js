(function (factory) {
    if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
        // CommonJS or Node: hard-coded dependency on "knockout"
        factory(require("jquery"), require("knockout"), exports);
    } else if (typeof define === "function" && define["amd"]) {
        // AMD anonymous module with hard-coded dependency on "knockout"
        define(["jquery", "knockout", "exports"], factory);
    } else {
        // <script> tag: use the global `ko` object, attaching a `mapping` property
        factory(jQuery, ko, ko.validate = {});
    }
}(function ( $, ko, exports ) {

    if (typeof (ko) === 'undefined') {
        throw new Error('Knockout is required, please ensure it is loaded before loading this validation plug-in');
    }

    // create our namespace object
    ko.validate = exports;
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
            isNumber: function(o) {
                return !isNaN(o);
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
            },
            formatMessage: function (message, params, observable) {
                var utils = ko.validate.utils;
                if (utils.isObject(params) && params.typeAttr) {
                    params = params.value;
                }
                if (typeof message === 'function') {
                    return message(params, observable);
                }
                var replacements = ko.unwrap(params);
                if (replacements == null) {
                    replacements = [];
                }
                if (!utils.isArray(replacements)) {
                    replacements = [replacements];
                }
                return message.replace(/{(\d+)}/gi, function(match, index) {
                    if (typeof replacements[index] !== 'undefined') {
                        return replacements[index];
                    }
                    return match;
                });
            }
        }
    }());

    // Configuration
    var defaults = {
            useRequiredMarker: true,
            classElementError: 'error',
            classMessageError: 'error-message',
            classHasRequired: 'has-required',
            classHasError: 'has-error',
            classGroupContainer: 'form-group',
            appendMessageToContainer: true,
            appendErrorsToRoot: false
        },
        kv = ko.validate;

    // make a copy  so we can use 'reset' later
    var configuration = ko.utils.extend({}, defaults);

    ko.validate.utils.resetConfig = function () {
        ko.utils.extend(configuration, defaults);
    };
    ko.validate.configuration = configuration;


    // Rules definition
    ko.validate.rules = {};
    ko.validate.rules['required'] = {
        validator: function (val, required) {
            var testVal;

            if (val === undefined || val === null) {
                return !required;
            }

            testVal = val;
            if (typeof (val) === 'string') {
                if (String.prototype.trim) {
                    testVal = val.trim();
                }
                else {
                    testVal = val.replace(/^\s+|\s+$/g, '');
                }
            }

            if (!required) {// if they passed: { required: false }, then don't require this
                return true;
            }

            return ((testVal + '').length > 0);
        },
        message: 'Obrigatório'
    };


    function minMaxValidatorFactory(validatorName) {
        var isMaxValidation = validatorName === "max";

        return function (val, options) {
            if (ko.validate.utils.isEmptyVal(val)) {
                return true;
            }

            var comparisonValue, type;
            if (options.typeAttr === undefined) {
                // This validator is being called from javascript rather than
                // being bound from markup
                type = "text";
                comparisonValue = options;
            } else {
                type = options.typeAttr;
                comparisonValue = options.value;
            }

            // From http://www.w3.org/TR/2012/WD-html5-20121025/common-input-element-attributes.html#attr-input-min,
            // if the value is parseable to a number, then the minimum should be numeric
            if (!isNaN(comparisonValue) && !(comparisonValue instanceof Date)) {
                type = "number";
            }

            var regex, valMatches, comparisonValueMatches;
            switch (type.toLowerCase()) {
                case "week":
                    regex = /^(\d{4})-W(\d{2})$/;
                    valMatches = val.match(regex);
                    if (valMatches === null) {
                        throw new Error("Invalid value for " + validatorName + " attribute for week input.  Should look like " +
                            "'2000-W33' http://www.w3.org/TR/html-markup/input.week.html#input.week.attrs.min");
                    }
                    comparisonValueMatches = comparisonValue.match(regex);
                    // If no regex matches were found, validation fails
                    if (!comparisonValueMatches) {
                        return false;
                    }

                    if (isMaxValidation) {
                        return (valMatches[1] < comparisonValueMatches[1]) || // older year
                                // same year, older week
                            ((valMatches[1] === comparisonValueMatches[1]) && (valMatches[2] <= comparisonValueMatches[2]));
                    } else {
                        return (valMatches[1] > comparisonValueMatches[1]) || // newer year
                                // same year, newer week
                            ((valMatches[1] === comparisonValueMatches[1]) && (valMatches[2] >= comparisonValueMatches[2]));
                    }
                    break;

                case "month":
                    regex = /^(\d{4})-(\d{2})$/;
                    valMatches = val.match(regex);
                    if (valMatches === null) {
                        throw new Error("Invalid value for " + validatorName + " attribute for month input.  Should look like " +
                            "'2000-03' http://www.w3.org/TR/html-markup/input.month.html#input.month.attrs.min");
                    }
                    comparisonValueMatches = comparisonValue.match(regex);
                    // If no regex matches were found, validation fails
                    if (!comparisonValueMatches) {
                        return false;
                    }

                    if (isMaxValidation) {
                        return ((valMatches[1] < comparisonValueMatches[1]) || // older year
                            // same year, older month
                        ((valMatches[1] === comparisonValueMatches[1]) && (valMatches[2] <= comparisonValueMatches[2])));
                    } else {
                        return (valMatches[1] > comparisonValueMatches[1]) || // newer year
                                // same year, newer month
                            ((valMatches[1] === comparisonValueMatches[1]) && (valMatches[2] >= comparisonValueMatches[2]));
                    }
                    break;

                case "number":
                case "range":
                    if (isMaxValidation) {
                        return (!isNaN(val) && parseFloat(val) <= parseFloat(comparisonValue));
                    } else {
                        return (!isNaN(val) && parseFloat(val) >= parseFloat(comparisonValue));
                    }
                    break;

                default:
                    if (isMaxValidation) {
                        return val <= comparisonValue;
                    } else {
                        return val >= comparisonValue;
                    }
            }
        };
    }

    ko.validate.rules['min'] = {
        validator: minMaxValidatorFactory("min"),
        message: 'Insira um valor maior ou igual a {0}.'
    };

    ko.validate.rules['max'] = {
        validator: minMaxValidatorFactory("max"),
        message: 'Insira um valor menor ou igual a {0}.'
    };

    ko.validate.rules['email'] = {
        validator: function (val, validate) {
            if (!validate) { return true; }
            //I think an empty email address is also a valid entry
            //if one want's to enforce entry it should be done with 'required: true'
            return ko.validate.utils.isEmptyVal(val) || (
                    // jquery validate regex - thanks Scott Gonzalez
                    validate && /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(val)
                );
        },
        message: 'Endereço de e-mail inválido'
    };

    ko.validate.rules['date'] = {
        validator: function (value, validate) {
            if (!validate) { return true; }
            return ko.validate.utils.isEmptyVal(value) || (validate && !/Invalid|NaN/.test(new Date(value)));
        },
        message: 'Data inválida'
    };

    ko.validate.rules['dateISO'] = {
        validator: function (value, validate) {
            if (!validate) { return true; }
            return ko.validate.utils.isEmptyVal(value) || (validate && /^\d{4}[-/](?:0?[1-9]|1[012])[-/](?:0?[1-9]|[12][0-9]|3[01])$/.test(value));
        },
        message: 'Data inválida'
    };

    ko.validate.rules['number'] = {
        validator: function (value, validate) {
            if (!validate) { return true; }
            return ko.validate.utils.isEmptyVal(value) || (validate && /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value));
        },
        message: 'Insira somente números'
    };

    ko.validate.rules['digit'] = {
        validator: function (value, validate) {
            if (!validate) return true;
            return ko.validate.utils.isEmptyVal(value) || (validate && /^\d+$/.test(value));
        },
        message: 'Insira somente dígitos'
    };

    ko.validate.rules['minLength'] = {
        validator: function (val, minLength) {
            if(ko.validate.utils.isEmptyVal(val)) { return true; }
            var normalizedVal = ko.validate.utils.isNumber(val) ? ('' + val) : val;
            return normalizedVal.length >= minLength;
        },
        message: 'Insira pelo menos {0} caracter(es)'
    };

    // brazilian postal code
    ko.validate.rules['cep'] = {
        validator: function (value, validate) {
            if (!validate) return true;
            if (ko.validate.utils.isEmptyVal(value)) return true;
            value = value.replace(/\D/g, "");
            return value.length === 8;
        },
        message: 'CEP inválido'
    };

    ko.validate.rules['maxLength'] = {
        validator: function (val, maxLength) {
            if(ko.validate.utils.isEmptyVal(val)) { return true; }
            var normalizedVal = ko.validate.utils.isNumber(val) ? ('' + val) : val;
            return normalizedVal.length <= maxLength;
        },
        message: 'Insira no máximo {0} caracter(es)'
    };

    ko.validate.rules['pattern'] = {
        validator: function (val, regex) {
            return ko.validate.utils.isEmptyVal(val) || val.toString().match(regex) !== null;
        },
        message: 'Valor inválido'
    };

    ko.validate.rules['phone'] = {
        validator: function (phoneNumber, validate) {
            if (!validate) { return true; }
            if (ko.validate.utils.isEmptyVal(phoneNumber)) { return true; } // makes it optional, use 'required' rule if it should be required
            phoneNumber = phoneNumber.replace(/\D/g, "");
            return phoneNumber.length === 11 || phoneNumber.length === 10;
        },
        message: 'Telefone inválido'
    };
    ko.validate.rules['phoneUS'] = {
        validator: function (phoneNumber, validate) {
            if (!validate) { return true; }
            if (ko.validate.utils.isEmptyVal(phoneNumber)) { return true; } // makes it optional, use 'required' rule if it should be required
            if (typeof (phoneNumber) !== 'string') { return false; }
            phoneNumber = phoneNumber.replace(/\s+/g, "");
            return validate && phoneNumber.length > 9 && phoneNumber.match(/^(1-?)?(\([2-9]\d{2}\)|[2-9]\d{2})-?[2-9]\d{2}-?\d{4}$/);
        },
        message: 'Telefone inválido'
    };
    ko.validate.rules['equal'] = {
        validator: function (val, params) {
            var otherValue = params;
            if (ko.validate.utils.isEmptyVal(val) && ko.validate.utils.isEmptyVal(otherValue))
                return true;
            return val === ko.validate.utils.getValue(otherValue);
        },
        message: 'Valores devem ser iguais'
    };
    ko.validate.rules['notEqual'] = {
        validator: function (val, params) {
            var otherValue = params;
            if (ko.validate.utils.isEmptyVal(val) && ko.validate.utils.isEmptyVal(otherValue))
                return true;
            return val !== ko.validate.utils.getValue(otherValue);
        },
        message: 'Valores não podem ser iguais'
    };

    ko.validate['setValidationProperties'] = function (vm) {
        var validateModel = function () {
            var self = this;
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
                        o = element.data('options'),
                        formGroup = element.closest('.' + o.classGroupContainer).addClass(o.classHasError);

                    element.addClass(o.classElementError);
                    if (o.appendMessageToContainer)
                        formGroup.find('.' + o.classMessageError).show();
                    else
                        element.next().show();

                    if (index === 0) {
                        if (element.is(':visible')) {
                            $(window).scrollTop(element.offset().top - 100);
                            element.focus();
                        }
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
                options = function () {
                    if (bindingContext.hasOwnProperty('validateOptions')) {
                        return $.extend(true, {}, ko.validate.configuration, bindingContext.validateOptions);
                    } else {
                        return ko.validate['configuration'];
                    }
                }(),
                element = $(element),
                setValid = function (elementId) {
                    viewModel.invalidFields.remove(elementId);
                },
                setRequiredMarker = function (element) {
                    element.closest('.' + options.classGroupContainer).addClass(options.classHasRequired);
                },
                removeRequiredMarker = function (element) {
                    element.closest('.' + options.classGroupContainer).removeClass(options.classHasRequired);
                },
                setMessage = function (element, message) {
                    if (options.appendMessageToContainer)
                        element.closest('.' + options.classGroupContainer).find('.' + options.classMessageError).text(message);
                    else
                        element.next().text(message);
                },
                setInvalid = function (elementId) {
                    viewModel.invalidFields.push(elementId);
                },
                hideError = function (element) {
                    var formGroup = element.closest('.' + options.classGroupContainer);
                    formGroup.removeClass(options.classHasError);
                    element.removeClass(options.classElementError);
                    if (options.appendMessageToContainer)
                        formGroup.find('.' + options.classMessageError).hide();
                    else
                        element.next().hide();
                },
                showError = function (element, message) {
                    var formGroup = element.closest('.' + options.classGroupContainer);
                    formGroup.addClass(options.classHasError);
                    element.addClass(options.classElementError);
                    if (options.appendMessageToContainer)
                        formGroup.find('.' + options.classMessageError).show();
                    else
                        element.next().show();
                },
                validateRules = function (valueAccessor, value) {
                    // valid params format are: validate: { value: property1, required: true, notEquals: property2 }
                    // or: validate: { value: property1: rules: { required: true, notEquals: property2 } }
                    var isValid = true, messages = [], param = '', hasRequiredRule = false, message = null;

                    if (valueAccessor.hasOwnProperty('rules')) {
                        valueAccessor = valueAccessor.rules;
                    }
                    for (var prop in valueAccessor) {
                        if (prop === 'value' || prop === 'options')
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
                                message = valueAccessor[prop] !== null && valueAccessor[prop].hasOwnProperty('message') ? valueAccessor[prop].message : validate.message;
                                messages.push(ko.validate.utils.formatMessage(message, param));
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

            // extend options from valueAccessor()
            if (valueAccessor().hasOwnProperty('options')) {
                options = $.extend(true, {}, options, valueAccessor().options);
            }

            if (options.appendMessageToContainer)
                $('<span class="' + options.classMessageError + '" style="display: none"></span>').appendTo(element.closest('.' + options.classGroupContainer));
            else
                $('<span class="' + options.classMessageError + '" style="display: none"></span>').insertAfter(element);

            // set element options parameters
            element.data('options', options);

            // append error list to root viewmodel
            if (options.hasOwnProperty('appendErrorsToRoot')) {
                if (options.appendErrorsToRoot)
                    viewModel = bindingContext.$root;
            } else if (options.hasOwnProperty('appendErrorsToContext')) {
                viewModel = bindingContext[options.appendErrorsToContext];
            }

            // check if viewmodel context has validation properties
            if (!viewModel.hasOwnProperty('isValid')) {
                ko.validate.setValidationProperties(viewModel, options);
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
                        if (e.keyCode === 13 && e.target.tagName != 'TEXTAREA' && !e.target.classList.contains('note-editable')) {
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
                        document.activeElement.blur();
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
        // TODO: Options error
        ko.validate.setValidationProperties(viewModel, options);
        ko.applyBindings(viewModel, rootNode);
    };

    // Localization

    var _locales = {};
    var _currentLocale;

    ko.validate.defineLocale = function(name, values) {

        if (name && values) {
            _locales[name.toLowerCase()] = values;
            return values;
        }
        return null;
    };

    ko.validate.locale = function(name) {
        if (name) {
            name = name.toLowerCase();

            if (_locales.hasOwnProperty(name)) {
                ko.validate.localize(_locales[name]);
                _currentLocale = name;
            }
            else {
                throw new Error('Localization ' + name + ' has not been loaded.');
            }
        }
        return _currentLocale;
    };

    //quick function to override rule messages
    ko.validate.localize = function (msgTranslations) {
        var rules = ko.validate.rules;
        //loop the properties in the object and assign the msg to the rule
        for (var ruleName in msgTranslations) {
            if (rules.hasOwnProperty(ruleName)) {
                rules[ruleName].message = msgTranslations[ruleName];
            }
        }
    };

    // Populate default locale (this will make en-US.js somewhat redundant)
    (function() {

        var localeData = {};
        var rules = ko.validate.rules;

        for (var ruleName in rules) {
            if (rules.hasOwnProperty(ruleName)) {
                localeData[ruleName] = rules[ruleName].message;
            }
        }
        ko.validate.defineLocale('pt-br', localeData);
    })();

    // No need to invoke locale because the messages are already defined along with the rules for en-US
    _currentLocale = 'pt-br';

}));

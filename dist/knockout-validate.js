/*globals require: false, exports: false, define: false, ko: false */

(function (factory) {
    // Module systems magic dance.

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
        classMessageError: 'error-message',
        classHasRequired: 'has-required',
        classHasError: 'has-error'
    };

    // make a copy  so we can use 'reset' later
    var configuration = ko.utils.extend({}, defaults);

    configuration.reset = function () {
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
    ko.validate.rules['cpf'] = {
        message: 'CPF inválido.',
        validator: function (cpf, params) {
            if (ko.validate.utils.isEmptyVal(cpf)) return true;

            var numeros, digitos, soma, i, resultado, digitos_iguais;
            cpf = cpf.replace(/(\.)|(\-)|(\/)/g, '');

            digitos_iguais = 1;
            if (cpf.length < 11)
                return false;
            for (i = 0; i < cpf.length - 1; i++)
                if (cpf.charAt(i) != cpf.charAt(i + 1)) {
                    digitos_iguais = 0;
                    break;
                }
            if (!digitos_iguais) {
                numeros = cpf.substring(0, 9);
                digitos = cpf.substring(9);
                soma = 0;
                for (i = 10; i > 1; i--)
                    soma += numeros.charAt(10 - i) * i;
                resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
                if (resultado != digitos.charAt(0))
                    return false;
                numeros = cpf.substring(0, 10);
                soma = 0;
                for (i = 11; i > 1; i--)
                    soma += numeros.charAt(11 - i) * i;
                resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
                if (resultado != digitos.charAt(1))
                    return false;
                return true;
            }
            else
                return false;
        }
    };
    ko.validate.rules['cnpj'] = {
        message: 'CNPJ inválido.',
        validator: function (cnpj, params) {
            if (ko.validate.utils.isEmptyVal(cnpj)) return true;

            var numeros, digitos, soma, i, resultado, pos, tamanho, digitos_iguais;
            cnpj = cnpj.replace(/(\.)|(\-)|(\/)/g, '');

            digitos_iguais = 1;
            if (cnpj.length < 14 && cnpj.length < 15)
                return false;
            for (i = 0; i < cnpj.length - 1; i++)
                if (cnpj.charAt(i) != cnpj.charAt(i + 1)) {
                    digitos_iguais = 0;
                    break;
                }
            if (!digitos_iguais) {
                tamanho = cnpj.length - 2
                numeros = cnpj.substring(0, tamanho);
                digitos = cnpj.substring(tamanho);
                soma = 0;
                pos = tamanho - 7;
                for (i = tamanho; i >= 1; i--) {
                    soma += numeros.charAt(tamanho - i) * pos--;
                    if (pos < 2)
                        pos = 9;
                }
                resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
                if (resultado != digitos.charAt(0))
                    return false;
                tamanho = tamanho + 1;
                numeros = cnpj.substring(0, tamanho);
                soma = 0;
                pos = tamanho - 7;
                for (i = tamanho; i >= 1; i--) {
                    soma += numeros.charAt(tamanho - i) * pos--;
                    if (pos < 2)
                        pos = 9;
                }
                resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
                if (resultado != digitos.charAt(1))
                    return false;
                return true;
            }
            else
                return false;
        }
    };
    // validação Usuário
    ko.validate.rules['validarUsuario'] = {
        valid: false,
        message: 'Nome de usuário já existe, escolha outro nome.',
        validator: function (val, idPessoa) {
            if (ko.validate.utils.isEmptyVal(val)) return true;
            ko.computed(function () {
                $.ajax({
                    url: '/Seguranca/Usuario/ValidarDuplicado',
                    data: { login: ko.utils.unwrapObservable(val), idPessoa: ko.utils.unwrapObservable(idPessoa) },
                    async: false
                }).success(function (result) {
                    ko.validate.rules.validarUsuario.valid = result.Sucesso;
                });
            });
        }
    };

    // validação Inscrição Estadual
    ko.validate.rules['inscricaoEstadual'] = {
        message: 'Inscrição Estadual inválida.',
        validator: function (val, validate) {
            if (!validate) { return true; }
            if (ko.validate.utils.isEmptyVal(value)) return true;
        }
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

    ko.validate.rules['cep'] = {
        validator: function (value, validate) {
            if (!validate) return true;
            if (ko.validate.utils.isEmptyVal(value)) return true;
            value = value.replace(/\D/g, "");
            return value.length === 8;
        },
        message: 'CEP inválido'
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
                        formGroup = element.closest('.form-group').addClass(options.classHasError);
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
                    element.closest('.form-group').addClass(options.classHasRequired);
                },
                removeRequiredMarker = function (element) {
                    element.closest('.form-group').removeClass(options.classHasRequired);
                },
                setMessage = function (element, message) {
                    element.next().text(message);
                    element.data('errorClass', options.classElementError);
                },
                setInvalid = function (elementId) {
                    viewModel.invalidFields.push(elementId);
                },
                hideError = function (element) {
                    element.closest('.form-group').removeClass(options.classHasError);
                    element.removeClass(options.classElementError);
                    element.next().hide();
                },
                showError = function (element, message) {
                    element.closest('.form-group').addClass(options.classHasError);
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
        ko.validate.setValidationProperties(viewModel, options);
        ko.applyBindings(viewModel, rootNode);
    };

}));
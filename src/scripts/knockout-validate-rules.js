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
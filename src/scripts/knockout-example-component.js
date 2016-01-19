define(['knockout'], function (ko) {
    ko.components.register('human-verification', {
        viewModel: function (params) {
            this.id = params.id;
            this.valueCheck = ko.observable();
            this.correctAnswer = ko.observable('20');
        },
        template: '<div class="form-group">' +
                    '<label for="password">Are you human? (Component example)</label>' +
                    '<div class="input-group">' +
                        '<div class="input-group-addon">10 + 10 = </div>' +
                        '<input class="form-control"  type="password" data-bind="value: valueCheck, attr: { id: id }, validate: { required: true, equalValue: correctAnswer }" />' +
                    '</div>' +
                  '</div>'
    });
})
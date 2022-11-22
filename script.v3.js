//* При клике на "Продолжить", открываем скрыте поля
$("#checkout").on("click", function () {
    $(".donorInfo").css("display", "block");
    $(".rulesBlock").css("display", "block");
    $("#checkout").addClass('.checkout')
});
//? Объявляем переменные (1/2) и регулярное выражение
var amount = "";
var patternMail = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
var patternTell = /^\d[\d\(\)\ -]{4,14}\d$/;
//* Создаем модальное окно с ошибкой
const createModal = (err) => {
    elem = `
        <!-- Modal -->
        <div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true" style="max-width: none; background-color:TRANSPARENT">
        <div class="modal-dialog">
            <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel">Ошибка заполнения полей</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                ${err}
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary">Save changes</button>
            </div>
            </div>
        </div>
        </div>`;
}
//? Объявляем переменные (1/2)
var validMail = true
var validTell = true
//* При изменении любого поля формы, задаем переменные. На кнопку Продолжыть устанавливаем вызов функции Pay
$("input").on("change", function () {
    if (this.name == 'subscribe') return
    if (this.name == 'amount') return
    subscribe = $("input[name = subscribe]:checked").val();
    if ($("#amountCustomInput").val() != "" && $("#amountCustomInput").val() > 9) {
        $('input[name="amount"]').prop('checked', false);
        amount = +$("#amountCustomInput").val()
    } else {
        amount = +$('input[name=amount]:checked').val()
    }
    $('#checkout').off().click(pay);
});
//* Валидируем форму
const validateForm = () => {
    console.log("validateForm");
    if ($("#donorFirstName").val() == "") {
        console.log(135);
        err = "Укажите Ваше имя";
        return false
    } else if ($("#donorLastName").val() == "") {
        err = "Укажите Вашу фамилию";
        return false
    } else if ($("#donorTell").val() == "") {
        err = "Укажите Ваш номер телефона";
        return false
    } else if ($("#donorMail").val() == "") {
        err = "Укажите Ваш E-mail";
        return false
    //TODO Подготовка к рассылкам, к сожалению оборота пожертвований не достаточно, для написания хотябы ежемесячной рассылки
        // } else if ($('#sendNews').is(':checked')) {
        //     err = "Подтвердите согласие на получение рассылок";

    } else if ($('#rulesConfidencial').is(':checked') == false) {
        err = "Примите соглашение о персональных данных";
        return false
    } else if ($('#rulesOferta').is(':checked') == false) {
        err = "Примите условия публичной оферты";
        return false
    } else if (amount > 9 == false) {
        err = "Сумма пожертвований должна быть больше 10 рублей";
        return false
    } else if (!validMail) {
        err = "Не корректно введен E-mail";
        return false
    } else if (!validTell) {
        err = "Не корректно введен телефон";
        return false
    } else {
        console.log('Поля заполнены');
        return true
    }
}
//* Вызываем функцию отправки платежа
this.pay = function () {
    if (!validateForm()) return createModal(err);
    //? Создаем класс Виджета
    var widget = new cp.CloudPayments();
    var data = {};
    if (subscribe == 'Month') {//создание ежемесячной подписки
        data.CloudPayments = {
            CustomerReceipt: receipt, //чек для первого платежа
            recurrent: {
                interval: 'Month',
                period: 1,
            }
        };
    } else {
        data = {
            firstName: $("#donorFirstName").val(),
            lastName: $("#donorLastName").val(),
            tell: $("#donorTell").val()
        }
    }
    donorInfo = {
        subscriber: $("input[name = subscribe]:checked").val(),
        summ: amount,
        firstName: $("#donorFirstName").val(),
        lastName: $("#donorLastName").val(),
        tell: $("#donorTell").val(),
        email: $("#donorMail").val()
    }
    //? Отправка данных на сервер платежной системы
    //! Платежные ID компании заменены
    widget.pay('charge', // или 'auth'
        { //options
            //publicId: 'pk_00000000000000000000000', //id tested
            publicId: 'pk_000000000000000000000000', //id Worked

            description: 'Пожертвование на уставные цели', //назначение
            amount: amount, //сумма
            currency: 'RUB', //валюта
            accountId: $("#donorMail").val(), //идентификатор плательщика (обязательно для создания подписки)
            skin: "classic", //дизайн виджета (необязательно)
            email: $("#donorMail").val(),
            data: data
        }, {
            onSuccess: function (options) { // success
                //действие при успешной оплате
                console.log("options", options);
            },
            onFail: function (reason, options) { // fail
                console.log("🚀 ~ file: script.js ~ line 72 ~ options", options)
                //действие при неуспешной оплате
                console.log("reason", reason);

            },
            onComplete: function (paymentResult, options) { //Вызывается как только виджет получает от api.cloudpayments ответ с результатом транзакции.

                console.log("paymentResult", paymentResult);
                sendData(donorInfo, paymentResult.code)
            }
        }
    )


};

//* Эта функция сработает при нажатии на кнопку
//! Планировалась для интеграции с CRM
function sendData(params, code) {
    var url = "";

    params.code = code
    var options = {
        method: "POST",
        mode: "no-cors",
        Headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: JSON.stringify(params)
    }

    fetch(url, options)
        .then(response => response.text())
        .then(result => console.log("result", result))
        .catch(error => console.log("error", error));
}

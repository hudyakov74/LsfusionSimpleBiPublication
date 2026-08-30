/*
Отлично! 🎉

Значит сейчас у нас рабочая схема для LSFusion 7:
🧮 кнопка появляется справа от числового поля;
кнопка не выбивает поле из режима редактирования;
калькулятор не забирает focus;
можно вводить выражения с клавиатуры;
соблюдается приоритет * / перед + -;
работают скобки и десятичные числа;
Enter считает, записывает результат и закрывает калькулятор;
при окончании редактирования кнопка сама исчезает.
*/

(function () {
    'use strict';

    // ==========================================================
    // СОСТОЯНИЕ
    // ==========================================================

    let calculator = null;
    let currentInput = null;
    let currentButton = null;
    let observer = null;


    // ==========================================================
    // SVG ИКОНКА КАЛЬКУЛЯТОРА
    // ==========================================================

    const calculatorSvg = `
        <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true">

            <rect
                x="4"
                y="2"
                width="16"
                height="20"
                rx="2"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"/>

            <rect
                x="7"
                y="5"
                width="10"
                height="4"
                rx="0.7"
                fill="currentColor"/>

            <circle cx="8" cy="12" r="1"
                fill="currentColor"/>

            <circle cx="12" cy="12" r="1"
                fill="currentColor"/>

            <circle cx="16" cy="12" r="1"
                fill="currentColor"/>

            <circle cx="8" cy="16" r="1"
                fill="currentColor"/>

            <circle cx="12" cy="16" r="1"
                fill="currentColor"/>

            <circle cx="16" cy="16" r="1"
                fill="currentColor"/>

            <circle cx="8" cy="20" r="1"
                fill="currentColor"/>

            <circle cx="12" cy="20" r="1"
                fill="currentColor"/>

            <circle cx="16" cy="20" r="1"
                fill="currentColor"/>
        </svg>
    `;


    // ==========================================================
    // ПРОВЕРКА NUMERIC INPUT
    // ==========================================================

    function isNumericInput(element) {

        return (
            element &&
            element.tagName === 'INPUT' &&
            element.type === 'text' &&
            element.getAttribute(
                'inputmode'
            ) === 'decimal'
        );
    }


    // ==========================================================
    // INPUT ЕЩЁ СУЩЕСТВУЕТ?
    // ==========================================================

    function isInputAlive(input) {

        return (
            input &&
            document.contains(input)
        );
    }


    // ==========================================================
    // НАЙТИ ТЕКУЩИЙ NUMERIC INPUT
    // ==========================================================

    function findNumericEditor() {

        const active =
            document.activeElement;


        if (
            isNumericInput(active)
        ) {

            return active;
        }


        const inputs =
            document.querySelectorAll(
                'input[inputmode="decimal"]'
            );


        for (
            const input of inputs
            ) {

            if (
                input.offsetParent !== null
            ) {

                return input;
            }
        }


        return null;
    }


    // ==========================================================
    // ДОБАВИТЬ КНОПКУ КАЛЬКУЛЯТОРА
    // ==========================================================

    function addCalculatorButton(input) {

        if (
            !isNumericInput(input)
        ) {

            return;
        }


        /*
         * Если кнопка для этого input
         * уже существует — повторно не создаём.
         */

        if (
            input.dataset.lsfCalculatorButton
        ) {

            return;
        }


        input.dataset.lsfCalculatorButton =
            '1';


        // ------------------------------------------------------
        // Создаём кнопку
        // ------------------------------------------------------

        const button =
            document.createElement(
                'button'
            );


        button.type = 'button';

        button.className =
            'lsf-calculator-button-open';

        button.title =
            'Калькулятор';

        button.setAttribute(
            'aria-label',
            'Калькулятор'
        );

        button.innerHTML =
            calculatorSvg;


        // ------------------------------------------------------
        // КРИТИЧНО:
        // кнопка не должна забирать focus
        // ------------------------------------------------------

        button.addEventListener(
            'mousedown',
            function (event) {

                event.preventDefault();
                event.stopPropagation();

            }
        );


        // ------------------------------------------------------
        // Нажатие кнопки
        // ------------------------------------------------------

        button.addEventListener(
            'click',
            function (event) {

                event.preventDefault();
                event.stopPropagation();


                if (
                    !isInputAlive(input)
                ) {

                    removeCalculatorButton(
                        button
                    );

                    return;
                }


                openCalculator(
                    input
                );

            }
        );


        // ------------------------------------------------------
        // НОВОЕ:
        // следим за окончанием редактирования
        // ------------------------------------------------------

        input.addEventListener(
            'blur',
            function () {

                /*
                 * LSFusion может выполнять свои
                 * действия сразу после blur.
                 *
                 * Поэтому ждём 50 мс.
                 */

                setTimeout(
                    function () {

                        /*
                         * Если focus действительно
                         * ушёл с этого input —
                         * удаляем его кнопку.
                         */

                        if (
                            document.activeElement !==
                            input
                        ) {

                            removeCalculatorButton(
                                button
                            );


                            /*
                             * Если калькулятор был
                             * открыт именно для этого
                             * input — закрываем его.
                             */

                            if (
                                currentInput ===
                                input
                            ) {

                                closeCalculator();

                                currentInput =
                                    null;
                            }
                        }

                    },
                    50
                );
            }
        );


        // ------------------------------------------------------
        // Добавляем кнопку в BODY
        // ------------------------------------------------------

        document.body.appendChild(
            button
        );


        currentButton =
            button;


        // ------------------------------------------------------
        // Ставим справа от input
        // ------------------------------------------------------

        positionButton(
            input,
            button
        );


        console.log(
            'LSFusion calculator button added:',
            input
        );
    }


    // ==========================================================
    // УДАЛИТЬ КНОПКУ
    // ==========================================================

    function removeCalculatorButton(
        button
    ) {

        if (button) {

            button.remove();

        }


        if (
            currentButton === button
        ) {

            currentButton =
                null;
        }
    }


    // ==========================================================
    // POSITION BUTTON
    //
    // КНОПКА СПРАВА ОТ INPUT
    // ==========================================================

    function positionButton(
        input,
        button
    ) {

        if (
            !input ||
            !button ||
            !document.contains(input)
        ) {

            return;
        }


        const rect =
            input.getBoundingClientRect();


        const size =
            28;


        /*
         * Главное отличие:
         *
         * НЕ rect.right - size
         *
         * а rect.right + 5
         *
         * то есть кнопка находится
         * СПРАВА от поля.
         */

        let left =
            rect.right + 5;


        let top =
            rect.top +
            (
                rect.height -
                size
            ) / 2;


        /*
         * Не даём кнопке уйти
         * за правый край экрана.
         */

        if (
            left + size >
            window.innerWidth
        ) {

            left =
                window.innerWidth -
                size -
                5;
        }


        /*
         * Не даём уйти выше экрана.
         */

        if (
            top < 2
        ) {

            top = 2;
        }


        /*
         * Не даём уйти ниже экрана.
         */

        if (
            top + size >
            window.innerHeight
        ) {

            top =
                window.innerHeight -
                size -
                2;
        }


        button.style.left =
            left + 'px';


        button.style.top =
            top + 'px';
    }


    // ==========================================================
    // ОТКРЫТЬ КАЛЬКУЛЯТОР
    // ==========================================================

    function openCalculator(
        input
    ) {

        if (
            !isNumericInput(input)
        ) {

            return;
        }


        closeCalculator();


        currentInput =
            input;


        calculator =
            document.createElement(
                'div'
            );


        calculator.className =
            'lsf-calculator';


        // ------------------------------------------------------
        // DISPLAY
        //
        // ВАЖНО:
        // это НЕ input.
        // ------------------------------------------------------

        const display =
            document.createElement(
                'div'
            );


        display.className =
            'lsf-calculator-display';


        display.textContent =
            input.value || '';


        calculator.appendChild(
            display
        );


        // ------------------------------------------------------
        // BUTTONS
        // ------------------------------------------------------

        const buttons =
            document.createElement(
                'div'
            );


        buttons.className =
            'lsf-calculator-buttons';


        const keys = [

            '7', '8', '9', '/',

            '4', '5', '6', '*',

            '1', '2', '3', '-',

            '0', ',', '(', ')',

            'C', '⌫', '=', '+'

        ];


        keys.forEach(
            function (key) {

                const button =
                    document.createElement(
                        'button'
                    );


                button.type =
                    'button';


                button.className =
                    'lsf-calculator-key';


                button.textContent =
                    key;


                if (
                    [
                        '+',
                        '-',
                        '*',
                        '/'
                    ].includes(key)
                ) {

                    button.classList.add(
                        'operator'
                    );
                }


                if (
                    key === '='
                ) {

                    button.classList.add(
                        'equals'
                    );
                }


                /*
                 * Кнопка калькулятора
                 * никогда не получает focus.
                 */

                button.addEventListener(
                    'mousedown',
                    function (event) {

                        event.preventDefault();

                        event.stopPropagation();

                    }
                );


                button.addEventListener(
                    'click',
                    function (event) {

                        event.preventDefault();

                        event.stopPropagation();


                        if (
                            !calculator
                        ) {

                            return;
                        }


                        if (
                            key === 'C'
                        ) {

                            display.textContent =
                                '';

                        }

                        else if (
                            key === '⌫'
                        ) {

                            display.textContent =
                                display
                                    .textContent
                                    .slice(
                                        0,
                                        -1
                                    );

                        }

                        else if (
                            key === '='
                        ) {

                            calculate(
                                display
                            );

                        }

                        else {

                            display.textContent +=
                                key;

                        }

                    }
                );


                buttons.appendChild(
                    button
                );

            }
        );


        calculator.appendChild(
            buttons
        );


        document.body.appendChild(
            calculator
        );


        positionCalculator(
            input
        );


        /*
         * НИКОГДА НЕ ДЕЛАЕМ:
         *
         * display.focus()
         *
         * input.focus()
         *
         *
         * LSFusion input уже находится
         * в focus.
         */

        console.log(
            'LSFusion calculator opened'
        );
    }


    // ==========================================================
    // POSITION CALCULATOR
    // ==========================================================

    function positionCalculator(
        input
    ) {

        if (
            !calculator ||
            !input
        ) {

            return;
        }


        const rect =
            input.getBoundingClientRect();


        const width =
            260;


        const height =
            300;


        let left =
            rect.left;


        let top =
            rect.bottom + 5;


        /*
         * Если снизу места нет —
         * показываем сверху.
         */

        if (
            top + height >
            window.innerHeight
        ) {

            top =
                rect.top -
                height -
                5;
        }


        /*
         * Правый край.
         */

        if (
            left + width >
            window.innerWidth
        ) {

            left =
                window.innerWidth -
                width -
                10;
        }


        calculator.style.left =
            Math.max(
                5,
                left
            ) + 'px';


        calculator.style.top =
            Math.max(
                5,
                top
            ) + 'px';
    }


    // ==========================================================
    // РАСЧЁТ
    // ==========================================================

    function calculate(
        display
    ) {

        if (
            !currentInput ||
            !isInputAlive(
                currentInput
            )
        ) {

            closeCalculator();

            return;
        }


        try {

            const result =
                evaluateExpression(
                    display.textContent
                );


            const value =
                formatNumber(
                    result
                );


            /*
             * Передаём значение LSFusion.
             */

            currentInput.value =
                value;


            currentInput.dispatchEvent(
                new Event(
                    'input',
                    {
                        bubbles: true
                    }
                )
            );


            currentInput.dispatchEvent(
                new Event(
                    'change',
                    {
                        bubbles: true
                    }
                )
            );


            console.log(
                'LSFusion calculator result:',
                value
            );


            /*
             * Закрываем popup сразу после
             * передачи результата.
             */

            closeCalculator();


        } catch (error) {

            console.error(
                'LSFusion calculator:',
                error
            );


            display.textContent =
                'Ошибка';
        }
    }


    // ==========================================================
    // ФОРМАТ ЧИСЛА
    // ==========================================================

    function formatNumber(
        value
    ) {

        const rounded =
            Math.round(
                (
                    value +
                    Number.EPSILON
                ) * 100
            ) / 100;


        return String(
            rounded
        ).replace(
            '.',
            ','
        );
    }


    // ==========================================================
    // МАТЕМАТИЧЕСКИЙ ПАРСЕР
    // ==========================================================

    function evaluateExpression(
        text
    ) {

        const source =
            String(text)
                .replace(
                    /,/g,
                    '.'
                )
                .replace(
                    /\s+/g,
                    ''
                );


        if (
            !source
        ) {

            throw new Error(
                'Пустое выражение'
            );
        }


        if (
            !/^[0-9.+\-*/()]+$/.test(
                source
            )
        ) {

            throw new Error(
                'Недопустимый символ'
            );
        }


        let pos =
            0;


        function expression() {

            let value =
                term();


            while (
                pos <
                source.length
                ) {

                const op =
                    source[pos];


                if (
                    op !== '+' &&
                    op !== '-'
                ) {

                    break;
                }


                pos++;


                const right =
                    term();


                if (
                    op === '+'
                ) {

                    value +=
                        right;

                } else {

                    value -=
                        right;
                }
            }


            return value;
        }


        function term() {

            let value =
                factor();


            while (
                pos <
                source.length
                ) {

                const op =
                    source[pos];


                if (
                    op !== '*' &&
                    op !== '/'
                ) {

                    break;
                }


                pos++;


                const right =
                    factor();


                if (
                    op === '*'
                ) {

                    value *=
                        right;

                } else {

                    if (
                        right === 0
                    ) {

                        throw new Error(
                            'Деление на ноль'
                        );
                    }


                    value /=
                        right;
                }
            }


            return value;
        }


        function factor() {

            if (
                source[pos] === '+'
            ) {

                pos++;

                return factor();
            }


            if (
                source[pos] === '-'
            ) {

                pos++;

                return -factor();
            }


            if (
                source[pos] === '('
            ) {

                pos++;


                const value =
                    expression();


                if (
                    source[pos] !== ')'
                ) {

                    throw new Error(
                        'Не закрыта скобка'
                    );
                }


                pos++;


                return value;
            }


            return number();
        }


        function number() {

            const start =
                pos;


            let dots =
                0;


            while (
                pos <
                source.length
                ) {

                const char =
                    source[pos];


                if (
                    char >= '0' &&
                    char <= '9'
                ) {

                    pos++;

                    continue;
                }


                if (
                    char === '.'
                ) {

                    dots++;


                    if (
                        dots > 1
                    ) {

                        throw new Error(
                            'Неверное число'
                        );
                    }


                    pos++;

                    continue;
                }


                break;
            }


            if (
                start === pos
            ) {

                throw new Error(
                    'Ожидалось число'
                );
            }


            const value =
                Number(
                    source.substring(
                        start,
                        pos
                    )
                );


            if (
                !Number.isFinite(
                    value
                )
            ) {

                throw new Error(
                    'Некорректное число'
                );
            }


            return value;
        }


        const result =
            expression();


        if (
            pos !==
            source.length
        ) {

            throw new Error(
                'Некорректное выражение'
            );
        }


        if (
            !Number.isFinite(
                result
            )
        ) {

            throw new Error(
                'Некорректный результат'
            );
        }


        return result;
    }


    // ==========================================================
    // КЛАВИАТУРА
    // ==========================================================

    document.addEventListener(
        'keydown',
        function (event) {

            if (
                !calculator ||
                !currentInput
            ) {

                return;
            }


            /*
             * Если LSFusion уже уничтожил
             * редактор — всё убрать.
             */

            if (
                !isInputAlive(
                    currentInput
                )
            ) {

                closeCalculator();

                removeCalculatorButton(
                    currentButton
                );

                currentInput =
                    null;

                return;
            }


            const display =
                calculator.querySelector(
                    '.lsf-calculator-display'
                );


            if (!display) {
                return;
            }


            // --------------------------------------------------
            // ENTER
            // --------------------------------------------------

            if (
                event.key === 'Enter'
            ) {

                event.preventDefault();

                event.stopPropagation();

                calculate(
                    display
                );

                return;
            }


            // --------------------------------------------------
            // ESC
            // --------------------------------------------------

            if (
                event.key === 'Escape'
            ) {

                event.preventDefault();

                event.stopPropagation();

                closeCalculator();

                return;
            }


            // --------------------------------------------------
            // BACKSPACE
            // --------------------------------------------------

            if (
                event.key === 'Backspace'
            ) {

                event.preventDefault();

                event.stopPropagation();

                display.textContent =
                    display.textContent
                        .slice(
                            0,
                            -1
                        );

                return;
            }


            // --------------------------------------------------
            // DELETE
            // --------------------------------------------------

            if (
                event.key === 'Delete'
            ) {

                event.preventDefault();

                event.stopPropagation();

                display.textContent =
                    '';

                return;
            }


            // --------------------------------------------------
            // ЦИФРЫ
            // --------------------------------------------------

            if (
                event.key >= '0' &&
                event.key <= '9'
            ) {

                event.preventDefault();

                event.stopPropagation();

                display.textContent +=
                    event.key;

                return;
            }


            // --------------------------------------------------
            // ОПЕРАТОРЫ
            // --------------------------------------------------

            const allowed = {

                '+': '+',
                '-': '-',
                '*': '*',
                '/': '/',
                '(': '(',
                ')': ')',
                ',': ',',
                '.': ','

            };


            if (
                Object.prototype
                    .hasOwnProperty
                    .call(
                        allowed,
                        event.key
                    )
            ) {

                event.preventDefault();

                event.stopPropagation();

                display.textContent +=
                    allowed[event.key];

                return;
            }


            // --------------------------------------------------
            // NUMPAD
            // --------------------------------------------------

            if (
                event.code ===
                'NumpadAdd'
            ) {

                event.preventDefault();

                event.stopPropagation();

                display.textContent +=
                    '+';

            }

            else if (
                event.code ===
                'NumpadSubtract'
            ) {

                event.preventDefault();

                event.stopPropagation();

                display.textContent +=
                    '-';

            }

            else if (
                event.code ===
                'NumpadMultiply'
            ) {

                event.preventDefault();

                event.stopPropagation();

                display.textContent +=
                    '*';

            }

            else if (
                event.code ===
                'NumpadDivide'
            ) {

                event.preventDefault();

                event.stopPropagation();

                display.textContent +=
                    '/';
            }

        },
        true
    );


    // ==========================================================
    // ЗАКРЫТЬ КАЛЬКУЛЯТОР
    // ==========================================================

    function closeCalculator() {

        if (calculator) {

            calculator.remove();
        }


        calculator =
            null;
    }


    // ==========================================================
    // ОБРАБОТКА НОВОГО DOM ELEMENT
    // ==========================================================

    function processNode(node) {

        if (
            !node ||
            node.nodeType !==
            Node.ELEMENT_NODE
        ) {

            return;
        }


        /*
         * Сам node
         */

        if (
            node.tagName ===
            'INPUT'
        ) {

            addCalculatorButton(
                node
            );
        }


        /*
         * INPUT внутри node
         */

        if (
            node.querySelectorAll
        ) {

            node
                .querySelectorAll(
                    'input[inputmode="decimal"]'
                )
                .forEach(
                    addCalculatorButton
                );
        }
    }


    // ==========================================================
    // MUTATION OBSERVER
    // ==========================================================

    function startObserver() {

        if (
            !document.body
        ) {

            return;
        }


        observer =
            new MutationObserver(
                function (mutations) {

                    mutations.forEach(
                        function (mutation) {

                            /*
                             * Новые элементы
                             */

                            mutation
                                .addedNodes
                                .forEach(
                                    processNode
                                );


                            /*
                             * Удалённые элементы
                             */

                            mutation
                                .removedNodes
                                .forEach(
                                    function (node) {

                                        if (
                                            currentInput &&
                                            node.contains &&
                                            node.contains(
                                                currentInput
                                            )
                                        ) {

                                            closeCalculator();


                                            removeCalculatorButton(
                                                currentButton
                                            );


                                            currentInput =
                                                null;
                                        }

                                    }
                                );

                        }
                    );


                    /*
                     * Обновляем положение
                     * кнопки.
                     */

                    if (
                        currentInput &&
                        currentButton &&
                        document.contains(
                            currentInput
                        )
                    ) {

                        positionButton(
                            currentInput,
                            currentButton
                        );
                    }


                    /*
                     * Если input исчез —
                     * убрать всё.
                     */

                    if (
                        currentInput &&
                        !document.contains(
                            currentInput
                        )
                    ) {

                        closeCalculator();


                        removeCalculatorButton(
                            currentButton
                        );


                        currentInput =
                            null;
                    }

                }
            );


        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );


        console.log(
            'LSFusion calculator observer started'
        );
    }


    // ==========================================================
    // СКАНИРОВАНИЕ
    // ==========================================================

    function scan() {

        if (
            !document.body
        ) {

            return;
        }


        document
            .querySelectorAll(
                'input[inputmode="decimal"]'
            )
            .forEach(
                addCalculatorButton
            );
    }


    // ==========================================================
    // INIT
    // ==========================================================

    function init() {

        console.log(
            'LSFusion calculator loaded'
        );


        scan();


        startObserver();
    }


    // ==========================================================
    // START
    // ==========================================================

    if (
        document.body
    ) {

        init();

    } else {

        document.addEventListener(
            'DOMContentLoaded',
            init,
            {
                once: true
            }
        );
    }

})();
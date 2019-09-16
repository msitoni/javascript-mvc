var calc = (function() {
    //separate model for publish and subscription pattern 
    //implementation
    function PubSub() {
        var pubSub = {};

        //uid is not used in this app, as well as 'unsubscribe'
        //method, which it is used for. It's here just for demo
        var topics = {},
            uid = 0;

        //subscribe listeners for a topic
        pubSub.subscribe = function(topic, callback) {
            //if no topic is present, register a new one
            if (!topics[topic])
                topics[topic] = [];

            var curUid = uid.toString();

            topics[topic].push({
                uid: curUid,
                callback: callback
            });

            uid++;

            return curUid;
        }

        //unsubscribe topic listeners
        pubSub.unsubscribe = function(uid) {
            for (var topic in topics) {
                var tempTopic = topics[topic];
                if (tempTopic) {
                    for (var i = 0, j = tempTopic.length; i < j; i++) {
                        if (tempTopic[i].uid === uid) {
                            tempTopic.splice(i, 1);
                            return uid;
                        }
                    }
                }
            }
            return this;
        }

        //publish event with data
        pubSub.publish = function(topic, args) {
            if (!topics[topic])
                return false;
            //notify all listeners
            topics[topic].forEach(function(sub) {
                sub.callback(args);
            });
        }

        return pubSub;
    }


    function CalculatorModel(pubSub) {
        var self = this;

        self.result = 0;
        self.pubSub = pubSub;

        //do a calculations and notify listeners about change in result

        self.add = function(values) {
            result = values[0] + values[1];

            self.pubSub.publish('result_changed', result);

            return result.toString();
        }

        self.subtract = function(values) {
            result = values[0] - values[1];

            self.pubSub.publish('result_changed', result);

            return result.toString();
        }

        self.multiply = function(values) {
            result = values[0] * values[1];

            self.pubSub.publish('result_changed', result);

            return result.toString();
        }

        //parse simple ariphmetic string expression with only positive numbers
        //and calculate the result
        self.parseAndCalcInput = function(input) {
            var numbersTemplate = /\d+/g,
                operationTemplate = /\*|\/|\\|\+|-/g;

            var numbers = [],
                operation = '',
                operationRegexResult = operationTemplate.exec(input),
                found;

            if (operationRegexResult) {
                operation = operationRegexResult[0] || operationRegexResult;

                //get all numbers from a string
                while (found = numbersTemplate.exec(input))
                    numbers.push(parseInt(found[0]));

                //apply only corresponding operation to extracted numbers
                switch (operation) {
                    case '+':
                        self.add(numbers);
                        break;
                    case '-':
                        self.subtract(numbers);
                        break;
                    case '*':
                        self.multiply(numbers);
                        break;

                    default:
                        console.error('Wrong operation');
                        break;
                }
            }
        };
        //subscribe for topic from Controller
        self.pubSub.subscribe('parse_calc_input', self.parseAndCalcInput);
    }

    function CalculatorView(pubSub, elements) {
        var self = this;

        self.elements = elements;
        self.pubSub = pubSub;

        self.calcTotal = function() {
            self.pubSub.publish('calc_total', {});
        };
        //re-render display with a new values, or simply refresh it
        self.renderDisplay = function(text) {
            self.elements.display.innerText = text;
        };
        //clear display and input properties at controller and view
        self.clearDisplay = function() {
            self.input = '';
            self.pubSub.publish('clear_input', {});
            self.renderDisplay(self.input);
        };
        //button press handler
        self.buttonPressed = function() {
            self.pubSub.publish('button_pressed', this.dataset.val);
        };

        //register handlers for all active buttons on calculator
        for (var i = 0; i < self.elements.buttons.length; i++) {
            self.elements.buttons[i].onclick = self.buttonPressed;
        }
        self.elements.total.onclick = self.calcTotal;
        self.elements.clear.onclick = self.clearDisplay;

        //subscribe for topic from Controller
        self.pubSub.subscribe('refresh_display', self.renderDisplay);
    }

    function CalculatorController() {
        var self = this;

        self.pubSub = new PubSub;
        self.model = new CalculatorModel(self.pubSub);
        self.view = new CalculatorView(self.pubSub, {
            display: document.querySelector('.display'),
            buttons: document.querySelectorAll('.btn'),
            clear: document.querySelector('.clear'),
            total: document.querySelector('.op_total')
        });
        self.input = '';

        self.onButtonClick = function(input_value) {
            //Digits should come before symbols at the beginning of input
            if (self.input.length === 0 && (input_value === '+' || input_value === '-' || input_value === '*')) {
                self.pubSub.publish('refresh_display', self.input);
                return;
            }

            self.input = self.input.concat(input_value);
            self.pubSub.publish('result_changed', self.input);
        };

        self.calculateResult = function() {
            var input = self.input;
            self.input = '';
            self.pubSub.publish('parse_calc_input', input);
        };

        self.refreshView = function(result) {
            self.pubSub.publish('refresh_display', result);
        };

        //subscribe for different topics from View and Model
        self.pubSub.subscribe('button_pressed', self.onButtonClick);
        self.pubSub.subscribe('calc_total', self.calculateResult);
        self.pubSub.subscribe('result_changed', self.refreshView);
        self.pubSub.subscribe('clear_input', function() {
            self.input = '';
        });
    }

    return new CalculatorController();
})();
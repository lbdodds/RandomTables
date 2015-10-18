;(function(undefined) {
    "use strict";

    function isFunction(functionToCheck) { var getType = {}; return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]'; }
    function randomBetween(l, h) { return l + Math.floor(Math.random() * (h-l+1)); }
    function randomFromArray(arr) { if(!Array.isArray(arr)) { throw new TypeError("Must be an array"); } var index = randomBetween(0, arr.length - 1); return arr[index]; }
    function execAll (regex, string) {
        if(!regex.global) { throw new Error("Must be a global search"); }
        var match = null;
        var matches = new Array();
        while (match = regex.exec(string)) {
            var matchArray = [];
            for (var i in match) {
                if (parseInt(i) == i) {
                    matchArray.push(match[i]);
                }
            }
            matches.push(matchArray);
        }
        return matches;
    }

    function getJSON(url, callback, error) {
        if(!isFunction(error)) { error = function() { console.log("Somethin' fucked up"); } }
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    var response = JSON.parse(xhr.responseText);
                    callback(response);
                } catch(ex) {
                    error(ex);
                }
            }
        };
        xhr.send();
    }

    var V = {
        url: { base: "json/" },
        data: undefined,
        regex: {
            template: /{(.+?)}/g
        },
        display: {
            selector: "body"
        }
    }

    function Display(_selector, _config) {
        this.selector = _selector;
        this.config = _config;
    }

    Display.prototype.get = function() {
        var displayArea = document.querySelector(this.selector);
        if(displayArea === null) {
            throw new Exception("Display area " + this.selector + " not found");
        }
        return displayArea;
    }

    Display.prototype.clear = function() {
        var displayArea = this.get();
        displayArea.innerHTML = "";
    }

    Display.prototype.addTable = function(table) {
        var div = document.createElement("div");
        if(Array.isArray(this.config.extraClasses)) {
            this.config.extraClasses.forEach(function(cls) { div.classList.add(cls); });
        } else {
            div.classList.add(this.config.extraClasses);
        }
        var displayArea = this.get();

        var template = this.config.template;

        div.innerHTML = populateTemplate(template, { title: table.title, value: table.generate(), table: table, config: this.config });
        displayArea.appendChild(div);
    }

    function populateTemplate(template, data) {
        var string = template.slice(0);
        var matches = execAll(V.regex.template, string);

        matches.forEach(function(matchArr) {
                var str = matchArr[0],
                    name = matchArr[1].split(".");

                var value = data;
                name.forEach(function(key) {
                    key = key.trim();
                    if(value.hasOwnProperty(key)) {
                        value = value[key];
                        
                        if(isFunction(value)) {
                            value = value();
                        }

                        if(Array.isArray(value)) {
                            value = randomFromArray(value);
                        }

                    } else { value = "[NOTFOUND]"; }
                });

                string = string.replace(str, value);
            });

        return string;
    }

    function loadDataFromJson(file) {
        var load = V.url.base + file;
        var callback = function(data) { 
            var display;

            verifyData(data);

            for(var i = 0; i < data.tables.length; i++) {
                var table = data.tables[i];
                data.tables[i] = createValueObject(table);
            }

            display = new Display(V.display.selector, data);
            display.clear();
            data.tables.forEach(function(table) {
                display.addTable(table);
            });

            V.data = data;
        };
        getJSON(load, callback);
    }

    function verifyData(data) {
        var config = {
            name: "[NAME NOT SET]",
            description: "...",
            extraClasses: ["generated"],
            template: "<h1>{title}</h1><span>{value}</span>"
        }

        Object.keys(config).forEach(function(key) {
            if(!data.hasOwnProperty(key)) {
                data[key] = config[key];
            }
        });
    }

    function createValueObject(obj) {
        if(typeof {} !== typeof obj) {
            obj = {
                template: "{value}",
                value: obj
            }
        }

        if(!obj.hasOwnProperty("template")) {
            obj.template = "{value}";
        }

        var template = obj.template;
        var regex = V.regex.template;
        var matches = execAll(regex, template);

        matches.forEach(function(matchArr) {
            var str = matchArr[0], name = matchArr[1];
            if(obj.hasOwnProperty(name) && Array.isArray(obj[name])) {
                for(var i = 0; i < obj[name].length; i++) {
                    obj[name][i] = createValueObject(obj[name][i]);
                }
            }
        });

        obj.generate = function() {
            if(!this.hasOwnProperty("template")) { return false; }


            // populateTemplate(this.template, { this: this });

            var string = this.template.slice(0);
            var matches = execAll(V.regex.template, this.template);
            matches.forEach(function(matchArr) {
                var str = matchArr[0],
                    name = matchArr[1];

                var value = "";

                if(obj.hasOwnProperty(name)) {
                    if(Array.isArray(obj[name])) {
                        var el = randomFromArray(obj[name]);
                        value = el.generate();
                    } else {
                        value = obj[name];
                    }
                }

                string = string.replace(str, value);
            });

            return string;
        }

        return obj;
    }

    function getV() {
        return V;
    }
    
    function expose() {
        [].forEach.call(arguments, function(argument) {
            if(isFunction(argument)) {
                window[argument.name] = argument;
            }
        })
    }

    expose(loadDataFromJson);
})();
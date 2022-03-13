class Setting {
    constructor(element, name, targets){
        this.element = element;
        this.default = element.val();
        this.name = name;
        if (targets !== undefined){
            this.targets = targets;
        } else {
            this.targets = {};
        }
        let storageValue = localStorage.getItem(this.name);
        if (storageValue !== null){
            this.val = storageValue;
            this.update();
        } else {
            this.val = this.default;
        }

        this.onupdate = function(){};
    }

    updateValFromElement(){
        this.val = this.element.val();
        this.update(this.val);
    }

    updateVal(val){
        this.val = val;
        this.element.val(val);
        this.update(val);
    }

    update(value){
        localStorage.setItem(this.name, value);
        if (this.targets.css !== undefined){
            for (const [attr, list] of Object.entries(this.targets.css)) {
                list.forEach(function(element){
                    $(element).css(attr, value);
                });
            }
        }
        if (this.targets.attr !== undefined){
            for (const [attr, list] of Object.entries(this.targets.attr)){
                list.forEach(function(element){
                    $(element).attr(attr, value);
                });
            }
        }
        if (this.onupdate !== undefined){
            this.onupdate(value);
        }
    }
}

class NumberSetting extends Setting {
    constructor(element, name, min, max, targets, suffix){
        super(element, name, targets);
        this.min = min;
        this.max = max;

        if (suffix !== undefined){
            this.suffix = suffix;
        } else {
            this.suffix = "";
        }
    }

    update(){
        if (this.element.val() < this.min){
            return this.updateVal(this.min);
        }

        if (this.element.val() > this.max){
            return this.updateVal(this.max);
        }

        let val = this.val + this.suffix;
        super.update(val);
    }
}

class Settings {
    constructor(){
        this.settings = {};
    }
    add(setting){
        this.settings[setting.name] = setting;
    }

    reset(){
        localStorage.clear();
        for (const [key, setting] of Object.entries(this.settings)){
            setting.updateVal(setting.default);
        }
        localStorage.setItem("acknowledged", "true");
    }

    refreshAll(){
        for (const [key, setting] of Object.entries(this.settings)){
            setting.update(setting.val);
        }
    }

    getSetting(key){
        return this.settings[key].val;
    }
}

function hideAcknowledge(){
    localStorage.setItem("acknowledged", "true");
    $("#acknowledgement").fadeOut(500, function(){
        $("#customize").fadeIn(500);
    });
}

function copyToClipboard(){
    $("#codeText").select();
    navigator.clipboard.writeText($("#codeText").text());
}
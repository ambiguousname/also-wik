class Setting {
    constructor(defaultSetting, element, name, targets){
        this.element = element;
        this.default = defaultSetting;
        this.name = name;
        if (targets !== undefined){
            this.targets = targets;
        } else {
            this.targets = {};
        }
        let storageValue = localStorage.getItem(this.name);
        if (storageValue !== undefined && storageValue !== null){
            this.updateVal(storageValue);
        } else {
            this.val = this.default;
        }

        this.onupdate = function(){};
        this.onrefresh = function(){};
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
        this.refreshChanges(value);
        if (this.onupdate !== undefined){
            this.onupdate(value);
        }
    }

    refreshChanges(value){
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
        if (this.onrefresh !== undefined){
            this.onrefresh(value);
        }
    }
}

class NumberSetting extends Setting {
    constructor(defaultSetting, element, name, min, max, targets, suffix){
        super(defaultSetting, element, name, targets);
        this.min = min;
        this.max = max;

        if (suffix !== undefined){
            this.suffix = suffix;
        } else {
            this.suffix = "";
        }
    }

    refreshChanges(value){
        var self = this;
        if (this.targets.css !== undefined){
            for (const [attr, list] of Object.entries(this.targets.css)) {
                list.forEach(function(element){
                    $(element).css(attr, value + self.suffix);
                });
            }
        }
        if (this.targets.attr !== undefined){
            for (const [attr, list] of Object.entries(this.targets.attr)){
                list.forEach(function(element){
                    $(element).attr(attr, value + self.suffix);
                });
            }
        }
        if (this.onrefresh !== undefined){
            this.onrefresh(value);
        }
    }

    update(){
        let val = parseInt(this.element.val());
        if (val < this.min){
            return this.updateVal(this.min);
        }

        if (val > this.max){
            return this.updateVal(this.max);
        }

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
            setting.refreshChanges(setting.val);
        }
    }

    getSetting(key){
        return this.settings[key].val;
    }
}

function hideAcknowledge(){
    localStorage.setItem("acknowledged", "true");
    $("#acknowledgement").fadeOut(500, function(){
        $(".centered").hide();
        $("#customized").show();
    });
}

function copyToClipboard(){
    $("#codeText").select();
    navigator.clipboard.writeText($("#codeText").text());
}
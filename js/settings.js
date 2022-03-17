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
        localStorage.setItem("version", version);
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
    gm.Reveal.sync();
    $("#acknowledgement").fadeOut(500, function(){
        $(".centered").hide();
        $("#customize").show();
        $(".reveal").hide();
        $(".reveal").fadeIn(500);
    });
}

function copyToClipboard(){
    $("#codeText").select();
    navigator.clipboard.writeText($("#codeText").text());
}

function showOptions(){
    $(".reveal").fadeOut(500, function(){
        $(".centered").fadeIn(500);
    });
}

function hideOptions() {
    $(".centered").fadeOut(500, function(){
        setTimeout(function(){
            $(".reveal").fadeIn(500);
            Reveal.sync();
        }, 100);
    });
}

// From https://github.com/PimpTrizkit/PJs/wiki/12.-Shade,-Blend-and-Convert-a-Web-Color-(pSBC.js)#--version-2-universal-b--:

function shadeBlend(p,c0,c1) {
    var n=p<0?p*-1:p,u=Math.round,w=parseInt;
    if(c0.length>7){
        var f=c0.split(","),t=(c1?c1:p<0?"rgb(0,0,0)":"rgb(255,255,255)").split(","),R=w(f[0].slice(4)),G=w(f[1]),B=w(f[2]);
        return "rgb("+(u((w(t[0].slice(4))-R)*n)+R)+","+(u((w(t[1])-G)*n)+G)+","+(u((w(t[2])-B)*n)+B)+")"
    }else{
        var f=w(c0.slice(1),16),t=w((c1?c1:p<0?"#000000":"#FFFFFF").slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF;
        return "#"+(0x1000000+(u(((t>>16)-R1)*n)+R1)*0x10000+(u(((t>>8&0x00FF)-G1)*n)+G1)*0x100+(u(((t&0x0000FF)-B1)*n)+B1)).toString(16).slice(1)
    }
}
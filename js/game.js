class GameManager {
    constructor(numImages, Reveal, settings){
        this.wikihow = new WikihowGetter();
        this.Reveal = Reveal;
        this.settings = settings;
        this.title = "";

        const storageTitle = localStorage.getItem("title");
        if (storageTitle !== null){
            this.title = storageTitle;
        }
        this.images = [];
        this.setNumImages(numImages);
        const storageImages = localStorage.getItem("images");
        const num = localStorage.getItem("numImages");
        if (storageImages !== null && num !== null){
            this.images = JSON.parse(storageImages);
            this.numImages = num;
            this.createSlideshow();
        }

        this.timerActive = false;
        this.latestSlide = 0;

        var self = this;

        this.Reveal.on('slidechanged', function(){
            localStorage.setItem("title", self.title);
            localStorage.setItem("images", JSON.stringify(self.images));
            localStorage.setItem("currSlide", Reveal.getState().indexh);
            localStorage.setItem("numImages", self.numImages);

            if (self.images.length < self.numImages){
                if (self.Reveal.getSlidePastCount() >= self.latestSlide && self.timerActive === true){
                    self.Reveal.slide(self.latestSlide);
                } else if (self.timerActive === false && self.Reveal.getSlidePastCount() === self.latestSlide){
                    self.resetTimer();
                    self.showTimer();
                }
                
                if (self.timerActive === true){
                    if (self.Reveal.getSlidePastCount() >= self.latestSlide){
                        self.showTimer();
                    } else {
                        self.hideTimer();
                    }
                }
            }
        });
    }

    setNumImages(num){
        this.numImages = num;
        localStorage.setItem("numImages", num);
    }

    async setTitle(){
        if (this.title === ""){
            this.title = await this.wikihow.getArticleTitle();
        }
        localStorage.setItem("title", this.title);
        $("#title").text(this.title);
    }

    async addImage(){
        let img_url = await this.wikihow.getArticleImage();
        this.images.push(img_url);
        localStorage.setItem("images", JSON.stringify(this.images));
        $("#codeText").text(this.dumpDataToURL());
        $("#img" + (this.images.length - 1)).append("<img src=\"" + img_url + "\" style=\"z-index: 0;\"/>");
        this.Reveal.sync();
    }

    createTimer(){
            
        let secondary = this.settings.getSetting("secondary-color");
        let primary = this.settings.getSetting("primary-color");
        let size = this.settings.getSetting("font-size");
        $("<div class=\"indicator\"></div>").insertAfter(".reveal");
        $(".indicator").radialIndicator({
            barColor: secondary,
            barWidth: parseInt(size)/2,
            barBgColor: primary,
            fontSize: size * 2,
            initValue: 5000,
            maxValue: 5000,
            frameNum: 200,
            format: function(value){
                return Math.floor(value/1000);
            }
        });
    }

    resetTimer(){
        let time = 5000;
        this.timerActive = true;
        var self = this;
        $(".indicator").data("radialIndicator").value(5000);
        var timeInterval = setInterval(function(){
            time -= 1000;
            // If the indicator somehow gets destryoed during this:
            if ($(".indicator").length === 0){
                clearInterval(timeInterval);
                self.timerActive = false;
                return;
            }
            $(".indicator").data("radialIndicator").animate(time);
            // 3 seconds have passed:
            if (time === 2000 && self.images.length < self.numImages){
                self.addImage();
            }
            if (time <= -1000){
                self.hideTimer();
                self.latestSlide += 1;
                clearInterval(timeInterval);
                self.timerActive = false;
            }
        }, 1000);
    }

    showTimer(){
        $(".indicator").show();
        $(".navigate-right").hide();
    }

    hideTimer(){
        $(".indicator").hide();
        $(".navigate-right").show();
    }

    createSlideshow(){
        var self = this;
        $(".reveal").hide();
        for (var i = 0; i < this.numImages; i++){
            $("<section id=\"img" + i + "\" class=\"img-section\"></section>").insertBefore("#end");
            if (self.images[i] !== undefined){
                $("#img" + i).append("<img src=\"" + self.images[i] + "\"/>");
            }
        }
        $(".centered").fadeOut(500, function(){
            self.setTitle().then(function(){
                $("#codeText").text(self.dumpDataToURL());
                self.Reveal.initialize({controlsTutorial: true, controlsBackArrows: "visible", mouseWheel: true, transition: "slide"}).then(function(){  
                    self.settings.refreshAll();
                    let slideNum = localStorage.getItem("currSlide");
                    if (slideNum !== null){
                        self.Reveal.slide(parseInt(slideNum));
                        self.latestSlide = parseInt(slideNum);
                    } else {
                        self.latestSlide = 0;
                    }
                    if (self.images.length < self.numImages){
                        self.createTimer();
                        self.showTimer();
                        self.resetTimer();
                    }
                });
                $(".reveal").fadeIn(500);
                $("#endPresentation").fadeIn(500);
            });
        });
    }

    async present(code){
        if (code.length > 0){
            this.dataFromURL(code);
            if (this.title !== ""){
                $(".centered").hide();
                this.createSlideshow();
            }
        } else {
            this.createSlideshow();
        }
    }

    dumpDataToURL(){
        var string = "title=" + this.title + "";
        for (var i = 0; i < this.images.length; i++){
            var img_url = this.images[i];
            // Get rid of the beginnings and ends of the image we already know about:
            img_url = img_url.replace("https://www.wikihow.com/images/", "");
            string += "&img" + i + "=" + img_url;
        }
        return string;
    }

    dataFromURL(string){
        let params = new URLSearchParams(string);
        if (params.has("title") && string.length > 0){
            this.numImages = 0;
            for (const [key, value] of params){
                if (key == "title"){
                    this.title = value;
                } else if (key.match(/img\d+/g) !== null){
                    let int = parseInt(key.substr(3));
                    // Placeholder:
                    let full_path = "https://www.wikihow.com/images/" + value;
                    this.images[int - 1] = full_path;
                    if (int > this.numImages){
                        this.numImages = int;
                    }
                }
            }
        } else {
            alert("Invalid presentation code: " + string);
        }
    }

    reset(){
        this.images = [];
        this.title = "";
        $(".indicator").remove();
        $("#endPresentation").fadeOut(500);
    }
}

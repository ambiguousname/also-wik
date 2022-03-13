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
        if (storageImages !== null){
            this.images = JSON.parse(storageImages);
            this.numImages = this.images.length;
            this.createSlideshow();
        }

        // If we're at the last slide, we want to stop storing the current slideshow to allow for new ones:
        this.Reveal.on('slidechanged', function(){
            if (Reveal.isLastSlide()){
                localStorage.removeItem("title");
                localStorage.removeItem("images");
                localStorage.removeItem("currSlide");
            } else {
                localStorage.setItem("title", gm.title);
                localStorage.setItem("images", JSON.stringify(gm.images));
                localStorage.setItem("currSlide", Reveal.getState().indexh);
            }
        });
    }

    setNumImages(num){
        this.numImages = num;
        localStorage.setItem("numImages", num);
    }

    async setTitle(){
        this.title = await this.wikihow.getArticleTitle();
        localStorage.setItem("title", this.title);
        $("#title").text(this.title);
    }

    async addImage(){
        let img_url = await this.wikihow.getArticleImage();
        this.images.push(img_url);
        localStorage.setItem("images", JSON.stringify(this.images));
        console.log("Added " + img_url);
    }

    createTimer(){
        $("<div class=\"indicator\"></div>").insertAfter(".controls-arrow");
        let secondary = this.settings.getSetting("secondary-color");
        let size = this.settings.getSetting("font-size");
        this.timer = $(".indicator").radialIndicator({
            barColor: secondary,
            barWidth: size,
            roundCorner: true,
            initValue: 5000,
            maxValue: 5000,
            format: function(value){
                return Math.floor(value/1000);
            }
        });
    }

    resetTimer(){
        let time = 5000;
        var timeInterval = setInterval(function(){
            time -= 500;
            this.timer.value(time);
            if (time <= 0){
                clearInterval(timeInterval);
            }
        }, 500);
    }

    showTimer(){
        $(".navigate-right").attr("class", "navigate-right disabled");
        if (this.timer === null){
            this.createTimer();
        }
        this.resetTimer();
        this.timer.show();
    }

    hideTimer(){
        $(".navigate-right").attr("class", "navigate-right enabled");
        this.timer.hide();
    }

    createSlideshow(){
        $(".centered").fadeOut(100);
        this.setTitle();
        $("#codeText").text(this.dumpDataToURL());

        var self = this;
        this.Reveal.initialize({controlsTutorial: true, controlsBackArrows: "visible", mouseWheel: true, transition: "slide"}).then(function(){  
            this.settings.refreshAll();
            let slideNum = localStorage.getItem("currSlide");
            if (slideNum !== null){
                self.Reveal.slide(slideNum);
            }
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
        for (var i = 0; i < this.numImages; i++){
            var img_url = this.images[i];
            // Get rid of the beginnings and ends of the image we already know about:
            img_url = img_url.replace("https://www.wikihow.com/images/", "");
            img_url = img_url.replace(".jpg", "");
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
                    let full_path = "https://www.wikihow.com/images/" + value + ".jpg";
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
}

class GameManager {
    constructor(numImages, Reveal){
        this.wikihow = new WikihowGetter();
        this.Reveal = Reveal;
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

    disableRight(){
        $(".navigate-right").attr("class", "navigate-right disabled");
    }

    enableRight(){
        $(".navigate-right").attr("class", "navigate-right enabled");
    }

    createTimer(){
        $("<div class=\"indicator\"></div>").insertAfter(".controls-arrow");
        $(".indicator").radialIndicator({});
    }

    resetTimer(){

    }

    createSlideshow(){
        $(".centered").fadeOut(100);
        this.setTitle();
        $("#codeText").text(this.dumpDataToURL());

        var self = this;
        this.Reveal.initialize({controlsTutorial: true, controlsBackArrows: "visible", mouseWheel: true, transition: "slide"}).then(function(){  
            updateSlideColors();            
            let slideNum = localStorage.getItem("currSlide");
            if (slideNum !== null){
                self.Reveal.slide(slideNum);
            }
        });
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

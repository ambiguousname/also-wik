class GameManager {
    constructor(numImages, Reveal, settings){
        this.wikihow = new WikihowGetter();
        this.Reveal = Reveal;
        this.settings = settings;

        this.slideshow = new Slideshow(Reveal, settings);
        var self = this;
        this.slideshow.onfinish = function(){
            $("#codeText").text(self.dumpDataToURL());
        }


        // For title previewing. We get a whole bunch, and then the user gets one at a time, randomly. Then we get a new batch if they don't like any of them:
        this.titles = [];
        this.title = "";

        this.transition = "";

        this.images = [];
        this.setNumImages(numImages);
        const storageImages = localStorage.getItem("images");
        const num = localStorage.getItem("numImages");
        const storageTitle = localStorage.getItem("title");
        var self = this;
        this.Reveal.initialize({controlsTutorial: true, controlsBackArrows: "visible", mouseWheel: true}).then(function(){
            self.Reveal.lockSlides(0, 0);
            if (num !== null && storageTitle !== null){
                if (storageImages !== null){
                    self.images = JSON.parse(storageImages);
                }
                self.numImages = num;
                self.title = storageTitle;
                $("#title").text(self.title);
                self.createSlideshow();
            } else {
                self.getTitles();
            }
    
            // Just in case we're loading existing slides:
            $("#codeText").text(self.dumpDataToURL());
        });
    }

    setNumImages(num){
        this.numImages = num;
        localStorage.setItem("numImages", num);
    }

    async getTitles(){
        if (this.titles.length === 0){
            // 6 is roughly good, because we're waiting half a second in between each (so 3 seconds for the full list).
            this.titles = await this.wikihow.getArticleTitleList(6);
        }
        $("#newTitle").attr("disabled", "true");
        setTimeout(function(){
            $("#newTitle").removeAttr("disabled");
        }, 700);
        this.title = this.titles.pop();
        $("#title").text(this.title);
        this.Reveal.sync();
        setTimeout(function(){this.Reveal.sync();}, 100);
    }

    createSlideshow(){
        localStorage.setItem("title", this.title);
        let start = new Slide(true);
        this.slideshow.addExistingSlide(start);
        for (var i = 0; i < this.numImages; i++){
            let text = new TextSlide(false, "Step " + (i + 1));
            var img;
            if (i < this.images.length){
                img = new ImageSlide(true, this.wikihow, this.images, this.images[i]);
            } else {
                img = new ImageSlide(true, this.wikihow, this.images);
            }
            this.slideshow.addSlide(text);
            this.slideshow.addSlide(img);
        }
        let end = new Slide(false);
        this.slideshow.addExistingSlide(end);

        // Because we don't want Reveal.sync() messing with the dimensions of the title slide:
        $(".keep-size").css("min-height", $(".keep-size").height());
        $("#newTitle").fadeOut();
        $("#startPresent").fadeOut();
        $("#showOptions").fadeOut();
        $("#codeParagraph").fadeOut();
        $("#endPresentation").fadeIn(500);

        this.slideshow.createPresentation(this.transition);
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
        $("#endPresentation").fadeOut(500);
        var self = this;
        $(".reveal").fadeOut(500, function(){
            self.Reveal.lockSlides(0, 0);
            self.Reveal.slide(0);

            self.images = [];
            self.getTitles();

            localStorage.removeItem("images");
            localStorage.removeItem("title");
            localStorage.removeItem("numImages");
            
            $(".img-section").remove();

            
            $(".keep-size").css("min-height", "");
            $("#newTitle").show();
            $("#startPresent").show();
            $("#showOptions").show();
            $("#codeParagraph").show();

            self.slideshow.resetPresentation();
            $(".reveal").fadeIn(500);
        });
    }
}

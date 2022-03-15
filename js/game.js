class GameManager {
    constructor(numImages, Reveal, settings){
        this.wikihow = new WikihowGetter();
        this.Reveal = Reveal;
        this.settings = settings;

        var currSlide = localStorage.getItem("currSlide");
        if (currSlide !== null){
            currSlide = parseInt(currSlide);
        } else {
            currSlide = 0;
        }

        this.slideshow = new Slideshow(Reveal, settings, 1, currSlide);


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

    createSlideshow(){
        for (var i = 0; i < this.numImages; i++){
            let text = new TextSlide(false, "Step " + i);
            const img;
            if (i < this.images.length){
                img = new ImageSlide(true, this.wikihow, this.images, this.images[i]);
            } else {
                img = new ImageSlide(true, this.wikihow, this.images);
            }
            this.slideshow.addSlide(text);
            this.slideshow.addSlide(img);
        }

        var self = this;
        $(".reveal").hide();
        $(".centered").fadeOut(500, function(){
            self.setTitle().then(function(){
                self.slideshow.createPresentation();
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

        
        $(".img-section").remove();
        Reveal.destroy();

        $("#customize").show();
        $("#endPresentation").fadeOut(500);
        $(".centered").fadeIn(500);

        this.slideshow.resetPresentation();
    }
}

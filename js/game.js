class GameManager {
    constructor(numImages, init){
        this.wikihow = new WikihowGetter();
        this.init = init;
        this.title = "";
        const storageTitle = localStorage.getItem("title");
        if (storageTitle !== null){
            this.title = storageTitle;
        }
        this.images = [];
        this.numImages = numImages;
        const storageImages = localStorage.getItem("images");
        if (storageImages !== null){
            this.images = JSON.parse(storageImages);
            this.numImages = this.images.length;
            this.createSlideshow();
        }
    }

    async setTitle(){
        this.title = await this.wikihow.getArticleTitle();
        localStorage.setItem("title", this.title);
    }

    async setImages(){
        for (var i = 0; i < this.numImages; i++){
            let img_url = await this.wikihow.getArticleImage();
            this.images.push(img_url);
        }
        localStorage.setItem("images", JSON.stringify(this.images));
    }

    async getGameData(){
        await this.setTitle();
        await this.setImages();
    }

    createSlideshow(){
        $("#title").text(this.title);

        let self = this;
        for (var i = 0; i < this.numImages; i++){
            $("<section><img src=\"" + self.images[i] + "\"></section>").insertAfter("#title");
        }

        this.init();
    }
}
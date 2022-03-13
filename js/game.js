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

    async getImagePatient(index){
        let img_url = await this.wikihow.getArticleImage();
        this.images.push(img_url);
        return new Promise(function(resolve){
            setTimeout(function(){
                resolve();
            }, 3000);
        });
    }

    async setImages(){
        for (var i = 0; i < this.numImages; i++){
            await this.getImagePatient();
        }
        localStorage.setItem("images", JSON.stringify(this.images));
    }

    async getGameData(){
        await this.setTitle();
        // We've already made a request, so now we have to wait.
        await new Promise(function(resolve){
            setTimeout(function(){
                this.setImages().then(resolve);
            }, 3000);
        });
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
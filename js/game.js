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
        this.progress = 0;
        this.isDone = false;
    }

    async setTitle(){
        this.title = await this.wikihow.getArticleTitle();
        localStorage.setItem("title", this.title);
    }

    async getImagePatient(){
        let img_url = await this.wikihow.getArticleImage();
        this.images.push(img_url);
        console.log("Added " + img_url);
        return new Promise(function(resolve){
            setTimeout(function(){
                resolve();
            }, 3000);
        });
    }

    async setImages(){
        var self = this;
        for (var i = 0; i < this.numImages; i++){
            await self.getImagePatient();
            this.progress += 1/(self.numImages + 1);
        }
        localStorage.setItem("images", JSON.stringify(this.images));
    }

    async getGameData(){
        this.isDone = false;
        this.progress = 0;
        await this.setTitle();
        $("#title").text(this.title);
        this.progress += 1/(this.numImages + 1);
        var self = this;
        // We've already made a request, so now we have to wait.
        await new Promise(function(resolve){
            setTimeout(function(){
                self.setImages().then(resolve);
            }, 3000);
        });
        this.isDone = true;
        this.progress = 1;
    }

    createSlideshow(){
        var self = this;
        $("#title").text(this.title);

        for (var i = 0; i < this.numImages; i++){
            $("<section><img src=\"" + self.images[i] + "\"></section>").insertAfter("#title-slide");
        }

        $("#codeText").text(this.dumpDataToURL());
        
        this.init();
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

class GameManager {
    constructor(callback){
        this.wikihow = new WikihowGetter();
        this.initialize(callback);
    }

    async initialize(callback){
        let text = await this.wikihow.getArticleTitle();
        var title = document.getElementById("title");
        title.innerText = "How to " + text; 
        for (var i = 0; i < 6; i++){
            let img_url = await this.wikihow.getArticleImage();
            var element = document.createElement("section");
            var transitions = ["none", "zoom", "fade", "slide", "convex", "concave"];
            element.setAttribute("data-transition", transitions[Math.floor(Math.random() * transitions.length)]);
            var img = document.createElement("img");
            img.src = img_url;
            element.appendChild(img);
            title.parentNode.insertBefore(element, title.nextSibling);
        }
        callback();
    }

    async reloadImage(node){
        let img_url = await this.wikihow.getArticleImage();
        node.src = img_url;
    }
}
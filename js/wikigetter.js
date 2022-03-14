class WikihowGetter {
  constructor(){
    this.canAccess = true;
  }

  xmlLoadHTML(url){
    console.log("Loading " + url + " ...");
    var self = this;
    if (this.canAccess){
      this.canAccess = false;
      setTimeout(function(){
        self.canAccess = true;
      }, 3000);
    } else {
      console.error("Too many requests to wikiHow! Staggering...");
      setTimeout(function(){
        self.xmlLoadHTML(url);
      }, 3000);
      return;
    }

    let xml = new XMLHttpRequest();
    let promise = new Promise(function(resolve, reject){
      xml.addEventListener("loadend", function(){ 
        if (xml.status === 200){
          resolve(xml.responseText);
        } else {
          console.log(xml);
          alert("Error getting wikiHow data. Your computer has probably requested data from wikiHow too many times. See the console for more info, please wait and try again later.");
          reject(null);
        }
      });
    });
    xml.open("GET", url);
    xml.send();
    return promise;
  }

  async getArticleTitle(){
    // Based on https://www.mediawiki.org/wiki/API:Query
    // grnnamespace=0 tells us to get a random article name.
    const title_url = "https://www.wikihow.com/api.php?action=query&origin=*&format=json&list=random&rnnamespace=0";
    let t = await this.xmlLoadHTML(title_url);
    let text = JSON.parse(t);
    return text.query.random[0].title;
  }

  async getArticleImage(){
    // I can't find a way to only get article images, so we're just going to filter through a bunch and hope we get the right one.
    const img_url = "https://www.wikihow.com/api.php?action=query&origin=*&format=json&list=random&rnnamespace=6&rnlimit=5";

    let t = await this.xmlLoadHTML(img_url);
    let images = JSON.parse(t).query.random;
    images.forEach(function(page){
      if (page.title.includes("Step")){
        return "https:://www.wikihow.com/images/" + page.title;
      }
    });

        // If we don't get one, ehhh... should be fine to include anyways. Just less visually interesting.
    return "https:://www.wikihow.com/images/" + images[0].title;
  }
}
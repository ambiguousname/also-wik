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
      return new Promise(function(resolve){
        setTimeout(function(){
          resolve(self.xmlLoadHTML(url));
        }, 3000);
      });
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
    return "How to " + text.query.random[0].title;
  }

  async getArticleImage(){
    // I can't find a way to only get article images, so we're just going to filter through a bunch and hope we get the right one.
    // For some reason, list doesn't return imageinfo.
    const img_url = "https://www.wikihow.com/api.php?action=query&origin=*&format=json&generator=random&grnnamespace=6&grnlimit=5&prop=imageinfo&iiprop=url";

    let t = await this.xmlLoadHTML(img_url);
    let text = JSON.parse(t);
    let images = Object.values(text.query.pages);
    for (var page of images){
      if (page.title.includes("Step")){
        return page.imageinfo[0].url;
      }
    }

    // If we don't get one, ehhh... should be fine to include anyways. Just less visually interesting.
    return images[Math.floor(Math.random() * images.length)].imageinfo[0].url;
  }
}
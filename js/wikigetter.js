class WikihowGetter {
  constructor(){
    this.canAccess = true;
  }

  xmlLoadHTML(url){
    if (this.canAccess){
      this.canAccess = false;
      setTimeout(function(){
        this.canAccess = true;
      }, 3000);
    } else {
      console.error("Too many requests to wikiHow! Staggering...");
      setTimeout(function(){
        xmlLoadHTML(url);
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
    const title_url = "https://www.wikihow.com/api.php?action=query&origin=*&format=json&generator=random&grnnamespace=0";
    let t = await this.xmlLoadHTML(title_url);
    let text = JSON.parse(t);
    return Object.values(text.query.pages)[0].title;
  }

  async getArticleImage(){
    // We get imageinfo, and we can customize the info we get from iiprop.
    const img_url = "https://www.wikihow.com/api.php?action=query&origin=*&format=json&generator=random&grnnamespace=6&prop=imageinfo&iiprop=url";
    let t = await this.xmlLoadHTML(img_url);
    let text = JSON.parse(t);
    let root = Object.values(text.query.pages)[0];
    // WikiHow is sometimes filled with random images not related to the articles, so if we don't get an image with "Step"
    // in the title, we can reasonably assume it is not an article image.
    // And yes, this is the best solution I can think of. I don't know of a way to only filter for wikiHow articles.
    // And the other images that this gets look definitively NOT like wikiHow images. And they scale weirdly.
    if (root.title.includes("Step")) {
      return root.imageinfo[0].url;
    } else {
      let url = await new Promise(function(resolve){
        setTimeout(function(){
          this.getArticleImage().then(resolve);
        }, 3000);
      });
      return url;
    }
  }
}
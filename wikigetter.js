class WikihowGetter {
  xmlLoadHTML(url){
    let xml = new XMLHttpRequest();
    let promise = new Promise(function(resolve){
      xml.addEventListener("loadend", function(){
        resolve(xml.responseText);
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
    if (root.title.includes("Step")) {
      return root.imageinfo[0].url;
    } else {
      let url = await this.getArticleImage();
      return url;
    }
  }
}
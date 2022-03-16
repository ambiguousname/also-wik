class Slide {
    constructor(isTimerSlide){
        this.elements = [];
        this.isTimerSlide = isTimerSlide;
        this.isMade = false;
    }

    async generateSlide(){
        this.isMade = false;
    }

    makeSlide(selector){
        if (this.elements.length > 0){
            this.elements.forEach(function(element){
                $(selector).append(element);
            });
            this.isMade = true;
        }
    }
}

class ImageSlide extends Slide {
    constructor (isTimerSlide, wikiGetter, images, existing_url){
        super(isTimerSlide);
        // Javascript's pass by reference is confusing, but this should work as a reference to the original array:
        this.images = images;
        this.wikiGetter = wikiGetter;
        if (existing_url !== undefined){
            this.elements = ["<img src=\"" + existing_url + "\"/>"];
        }
    }

    async generateSlide(){
        let img_url = await this.wikiGetter.getArticleImage();
        this.images.push(img_url);
        localStorage.setItem("images", JSON.stringify(this.images));
        this.elements = ["<img src=\"" + img_url + "\"/>"];
        super.generateSlide();
    }
}

class TextSlide extends Slide {
    constructor (isTimerSlide, text){
        super(isTimerSlide);
        this.elements = [text];
    }
}

// Manage the actual slideshow. This class just cares about manipulating images, text, and the timer. It doesn't care about the overall game structure.
class Slideshow {
    constructor(Reveal, settings, startIndex, currIndex){
        this.Reveal = Reveal;
        this.settings = settings;
        this.startIndex = startIndex;

        this.onfinish = function(){};

        // Slides should be created before createPresentation() is called via addSlide().
        // Once slides are created, they'll be hidden until the next 
        this.slides = [];
        if (currIndex !== null){
            // The latestSlide that we're allowed to reach:
            this.latestSlide = currIndex;
        } else {
            this.latestSlide = startIndex;
        }

        this.timerActive = false;

        var self = this;
        this.Reveal.on('slidechanged', function(){self.slideChange();});
    }

    createTimer(){
        let secondary = this.settings.getSetting("secondary-color");
        let primary = this.settings.getSetting("primary-color");
        let size = this.settings.getSetting("font-size");
        let fontFamily = this.settings.getSetting("font-family");
        $("<div class=\"indicator\"></div>").insertAfter(".reveal");
        $(".indicator").radialIndicator({
            barColor: secondary,
            barWidth: parseInt(size)/2,
            barBgColor: primary,
            fontSize: size * 2,
            fontFamily: fontFamily,
            initValue: 5000,
            maxValue: 5000,
            frameNum: 200,
            format: function(value){
                return Math.floor(value/1000);
            }
        });
    }

    resetTimer(){
        let time = 5000;
        this.timerActive = true;
        var self = this;
        $(".indicator").data("radialIndicator").value(5000);
        var timeInterval = setInterval(function(){
            time -= 1000;
            // If the indicator somehow gets destryoed during this:
            if ($(".indicator").length === 0){
                clearInterval(timeInterval);
                self.timerActive = false;
                return;
            }
            $(".indicator").data("radialIndicator").animate(time);
            // 3 seconds have passed:
            if (time === 2000){
                self.updateNextSlides();
            }
            if (time <= -1000){
                self.hideTimer();
                self.allowMoveForward();
                clearInterval(timeInterval);
                self.timerActive = false;
            }
        }, 1000);
    }

    showTimer(){
        $(".indicator").show();
    }

    hideTimer(){
        $(".indicator").hide();
    }

    slideChange(){
        localStorage.setItem("currSlide", this.Reveal.getState().indexh);

        let currSlide = this.Reveal.getSlidePastCount();
        if (this.latestSlide < this.slides.length + this.startIndex){
            if (this.timerActive === false && currSlide === this.latestSlide){
                // If we don't have a timer, and we're at the latest allowable slide, create a new timer:
                this.resetTimer();
                this.showTimer();
            }

            if (this.timerActive === true){
                if (currSlide >= this.latestSlide){
                    this.showTimer();
                } else {
                    this.hideTimer();
                }
            }
        }
    }
    
    // Generate content for the next set of slides:
    updateNextSlides(){
        for (var i = this.latestSlide + 1; i < this.slides.length; i++){
            let slide = this.slides[i];
            if (slide.isMade === false){
                slide.generateSlide().then(function() {slide.makeSlide("#slide" + i);});
            }

            if (slide.isTimerSlide){
                break;
            }
        }
    }

    allowMoveForward(){
        this.Reveal.sync();
        for (var i = this.latestSlide; i < this.Reveal.getTotalSlides(); i++){
            this.latestSlide += 1;
            if (this.slides[i].isTimerSlide){
                break;
            }
        }
        this.Reveal.lockSlides(0, this.latestSlide);

        if (this.latestSlide === this.Reveal.getTotalSlides() && this.onfinish !== undefined && this.onfinish !== null){
            this.onfinish();
        }
    }

    addSlide(slide){
        this.slides.push(slide);
        this.Reveal.sync();
    }

    createPresentation(startTimer){
        for (var i = 0; i < this.slides.length; i++){
            $("<section id=\"slide" + i + "\" class=\"createdSlide future\"></section>").insertBefore("#end");
            // For any slides that already have generated content:
            this.slides[i].makeSlide("#slide" + i);
        }
        
        this.createTimer();
        this.hideTimer();
        this.settings.refreshAll();

        // If we have not yet started the presentation...
        if (startTimer){
            this.showTimer();
            this.resetTimer();
        } else {
            // Otherwise, we need to lock based on the current slide:
            let slideCount = this.Reveal.getTotalSlides();
            this.Reveal.lockSlides(0, slideCount);
            this.Reveal.slide(this.latestSlide);

            var index = this.latestSlide;
            while (this.slides[index].isTimerSlide === false){
                index += 1;
            }
            this.Reveal.lockSlides(0, index);
        }
        // Just in case stuff doesn't update:
        setTimeout(function(){
            this.Reveal.sync();
        }, 100);
    }

    resetPresentation(){
        for (var i = 0; i < this.slides.length; i++){
            $("#slide" + i).remove();
        }
        this.slides = [];
        this.latestSlide = 0;
        localStorage.removeItem("currSlide");
        $(".indicator").remove();
    }
}
class Slide {
    constructor(isTimerSlide){
        this.elements = [];
        this.isTimerSlide = isTimerSlide;
        this.isMade = false;
    }

    // generateSlide is for Slides that have content that needs to be generated on the fly. If a slide already has content,
    // then this.elements.length is > 0, and so makeSlide will set .isMade to true when called during createPresentation.
    // Whenever updateNextSlides is called, generateSlide is also called for whatever slides are not made.
    // Right now, this is only a thing for image slides.
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
    constructor(Reveal, settings){
        this.Reveal = Reveal;
        this.settings = settings;

        var currSlide = localStorage.getItem("currSlide");
        if (currSlide !== null){
            this.currSlide = parseInt(currSlide);
        } else {
            this.currSlide = 0;
        }

        this.onfinish = function(){};

        // Slides should be created before createPresentation() is called via addSlide().
        // Once slides are created, they'll be hidden until the next 
        this.slides = [];

        var latestIndex = localStorage.getItem("latestSlide");
        if (latestIndex !== null){
            // The latestSlide that we're allowed to reach:
            this.latestSlide = parseInt(latestIndex);
        } else {
            this.latestSlide = 0;
        }

        this.timerActive = false;

        var self = this;
        this.Reveal.on('slidechanged', function(){self.slideChange();});
    }

    // Creates a div containing the radialIndicator stuff for timing. This is created at the start of every presentation and destroyed afterwards.
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
            frameNum: 200, // I wish there were some better way to change the speed of the timer, but right now it's slow and weird due to me not understanding the API.
            // Maybe someday I'll switch out radialIndicator for something better that actually counts down continuously.
            format: function(value){
                return Math.floor(value/1000);
            }
        });
    }

    // Start the timer counting down from 5 seconds. At 3 seconds past, the next slides will be updated, and at the end of the timer, 
    // the timer will hide itself and unlock the presentation for the next set of slides.
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

    // This is called when Reveal detects a change in the current slide. It's just meant to hide and show the timer depending on what slide we're on.
    slideChange(){
        this.currSlide = this.Reveal.getSlidePastCount();
        localStorage.setItem("currSlide", this.currSlide);
        if (this.currSlide < this.slides.length){
            if (this.timerActive === false && this.currSlide === this.latestSlide){
                // If we don't have a timer, and we're at the latest allowable slide, create a new timer:
                this.resetTimer();
                this.showTimer();
            }

            if (this.timerActive === true){
                if (this.currSlide >= this.latestSlide){
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

    // Increment latestSlide and lock the new set slides based on what is or isn't a timer slide.
    allowMoveForward(){
        this.Reveal.sync();

        this.latestSlide += 1;
        while(this.latestSlide < this.slides.length && this.slides[this.latestSlide].isTimerSlide === false){
            this.latestSlide += 1;
        }
        
        this.Reveal.lockSlides(0, this.latestSlide);

        if (this.latestSlide === this.slides.length && this.onfinish !== undefined && this.onfinish !== null){
            this.onfinish();
        }
        localStorage.setItem("latestSlide", this.latestSlide);
    }

    addSlide(slide){
        this.slides.push(slide);
        this.Reveal.sync();
    }

    addExistingSlide(slide){
        this.slides.push(slide);
        slide.isMade = true;
    }

    createPresentation(transition){
        for (var i = 0; i < this.slides.length; i++){
            if (this.slides[i].isMade === false){
                var t = transition;
                if (transition === "random"){
                    let transitions = ["none", "fade", "slide", "convex", "concave", "zoom"];
                    t = transitions[Math.floor(Math.random() * transitions.length)];
                }

                $("<section id=\"slide" + i + "\" class=\"createdSlide future\" data-transition=\"" + t + "\"></section>").insertBefore("#end");
            
                // For any slides that already have generated content:
                this.slides[i].makeSlide("#slide" + i);
            }
        }
        
        this.createTimer();
        this.hideTimer();
        this.settings.refreshAll();

        this.Reveal.lockSlides(0, this.latestSlide);
        this.Reveal.slide(this.currSlide);
        // If we're locked at slide 0, that means the timer won't get updated during slideChange.
        if (this.latestSlide === 0){
            this.resetTimer();
            this.showTimer();
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
        localStorage.removeItem("latestSlide");
        $(".indicator").remove();
    }
}
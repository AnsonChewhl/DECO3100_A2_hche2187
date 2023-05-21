// Check the users window width and height for testing purpose
confirm(`Window width x height: ${window.innerWidth} x ${window.innerHeight}`);

// Functions to call when the page finishes loading
document.addEventListener('DOMContentLoaded', contentUpdate);

// Ensure the plots are correctly built even when the users have resized their screen
window.addEventListener('resize', contentUpdate, true);

// Variables for jumping to different sections
const allNavLinks = document.querySelectorAll(".navbar-link");
const allSections = document.querySelectorAll(".main-section");
let sectionOffset = [0, 0, 0, 0];
let currentSection = 0;
window.onscroll = () => {
    // console.log(window.pageYOffset);

    const totalSections = sectionOffset.length;
    for (var i = 0; i < totalSections; i++) {
        // Check whether the scroll position arrived a new section
        if (window.pageYOffset >= sectionOffset[i] - 64 && i != currentSection) {
            // Function for the nav bar current selection underliner
            // Change the id attribute to restyle the nav bar and current selection
            allNavLinks[currentSection].removeAttribute("id");
            allNavLinks[i].setAttribute("id", "current-section");
            currentSection = i;
        }
    }
};

// Keep tracking the scroll position to trigger the parallax effect in specific point
window.addEventListener('scroll', () => {
    var scrollPosition = window.scrollY;
    parallaxEffect(scrollPosition);
});





// Main functions
function contentUpdate() {
    try {
        buildPlots();
    } catch (e) {
        console.warn(e);
    }
    
    sectionOffsetCheck(); // Re-calculate the offset position of each section
}

function buildPlots() {
	plasticPollution(generateColorScale());
	threatenedSpecies();
	marineSpeciesPopulation();
    yearIndicator();
}





// Sub functions
function sectionOffsetCheck() {
    // Check each sections' offset from the top of the website
    for (var i = 0; i < 4; i++) {
        sectionOffset[i] = allSections[i].offsetTop + 0.5;
        // console.log(i + ": " + allSections[i].offsetTop);
    }
}

/* Below parallax effect were learnt from W3 school but added extra styling and functionality by myself https://www.w3schools.com/howto/howto_css_parallax.asp */
const bottle = document.getElementById('parallax-bottle');
const bottlePos = window.pageYOffset + bottle.getBoundingClientRect().top;

const bag = document.getElementById('parallax-bag');
const bagPos = window.pageYOffset + bag.getBoundingClientRect().top;

const parallaxBg = document.querySelectorAll('.parallax-bg');
const sea_turtle = document.getElementById('parallax-sea-turtle');
const sea_plasticBag = document.getElementById('parallax-sea-bag');
const dish_salmon = document.getElementById('parallax-dish-salmon');
const dish_plasticBag = document.getElementById('parallax-dish-bag');

function parallaxEffect(scrollPosition) {
    parallaxTransform(scrollPosition, bottlePos, 1, 20, 500, bottle, -700, 1700, 20, 0.2, -700, 1650, 45, 0.2, 0.05);
    parallaxTransform(scrollPosition, bagPos, 1.5, 15, 450, bag, 800, 1840, 5, 0.1, 850, 1800, 20, 0.15, 0.1);

    parallaxSeaScale(scrollPosition, sea_turtle, 0.1, 10, 5);
    parallaxSeaScale(scrollPosition, sea_plasticBag, 0.05, 5, 0.5);

    parallaxDishScale(scrollPosition, dish_salmon, 30, 0);
    parallaxDishScale(scrollPosition, dish_plasticBag, 0, 25);
}

function parallaxTransform(scrollPosition, startPos, movSpeed, rotationSpeed, maxRange, obj, startX, startY, startRotation, startScale, x, y, rotation, scale, opacity) {
    // Moving the parallax object when users scroll
    scrollPosition += 500;
    var distance = (scrollPosition - startPos) * movSpeed;
    if (scrollPosition < startPos) {
        obj.style.transform = `translate3d(${startX}px, ${startY}px , 0px) rotate(${startRotation}deg) scale(${startScale})`;
    } else if (scrollPosition >= startPos && scrollPosition <= startPos + maxRange) {
        obj.style.transform = `translate3d(${x}px, ${y + distance}px , 0px) rotate(${rotation + distance / rotationSpeed}deg) scale(${scale})`;
        obj.style.opacity = opacity
    } else {
        obj.style.opacity = 0;
    }
}

function parallaxSeaScale(scrollPosition, obj, movSpeed, startY, initialSize) {
    const bgPos = window.pageYOffset + parallaxBg[0].getBoundingClientRect().top - 200;
    var distance = (scrollPosition - bgPos) * movSpeed;

    if (scrollPosition < bgPos) {
        obj.style.backgroundPosition = `47.5% ${startY}%`;
        obj.style.backgroundSize = `${initialSize}%`;
    } else if (scrollPosition >= bgPos && scrollPosition <= bgPos + 1000) {
        obj.style.backgroundPosition = `47.5% ${startY + distance / 3}%`;
        obj.style.backgroundSize = `${initialSize + distance}%`;
    }
}

function parallaxDishScale(scrollPosition, obj, initialSize, finalSize) {
    const bgPos = window.pageYOffset + parallaxBg[1].getBoundingClientRect().top;

    if (scrollPosition < bgPos) {
        obj.style.backgroundSize = `${initialSize}%`;
    } else if (scrollPosition >= bgPos && scrollPosition <= bgPos + 1000) {
        obj.style.backgroundSize = `${finalSize}%`;
    }
}






// Button functions
function sectionJump(section) {
    // Check every section offset is updated
    sectionOffsetCheck();

    // Scroll to the clicked section afterwards
    window.scrollTo({
        top: sectionOffset[section] - 64,
        behavior: "smooth",
    });
}

// Update the value immediately when it is on drag https://www.quora.com/How-do-you-make-an-HTML-slider-value-update-when-its-being-dragged-by-a-mouse
const yearSelectore = document.querySelector('.slidecontainer > .slider');
yearSelectore.addEventListener('input', yearIndicator);
function yearIndicator() {
    var year = yearSelectore.value;

    yearDisplay = document.getElementById('yearDisplay');
    yearDisplay.innerHTML = year;
    seafoodConsumption(year);
}

// Allows users to click the play button to play the consumption changes animation
var consumptionAnimating = false;
var stopAnimation = false;
function consumptionAnimation(event) {
    console.log(consumptionAnimating);
    var animation;
    if (!consumptionAnimating) {
        event.innerHTML = "&#9208";
        consumptionAnimating = true;
        stopAnimation = false;

        // Play the animation from the point users stop
        var value = parseInt(yearSelectore.value);
        if (value == 2020) {
            value = 1990;
            yearSelectore.value = value;
            yearIndicator();
        }
    
        // Using set interval to create animation https://www.w3schools.com/jsref/met_win_setinterval.asp
        animation = setInterval(function() {
            if (value == 2020 || stopAnimation) {
                console.log(value);
                clearInterval(animation);
                consumptionAnimating = false;
                return;
            }
            value += 1;
            yearSelectore.value = value;
            yearIndicator();
        }, 300);
    } else {
        // If users click the button again, stop the animation
        event.innerHTML = "&#9205";
        consumptionAnimating = false;
        stopAnimation = true;
    }
}
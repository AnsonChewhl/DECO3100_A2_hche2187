// Check the users window width and height for testing purpose
// confirm(`Window width x height: ${window.innerWidth} x ${window.innerHeight}`);

// Functions to call when the page finishes loading
document.addEventListener('DOMContentLoaded', () => {
    navbarAnimation();

    setColorScale();
    generateColorbar(mpwDivision, mpwColorbar, chart1_colorbar);
    generateColorbar(seafoodDivision, seafoodColorbar, chart2_colorbar);

    contentUpdate();
});

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
	plasticPollution();
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

function generateColorbar(division, colorLst, container) {
	for (var i = 0; i < colorLst.length; i++) {
		// Using block scope to allow directly adding event listener that call on the object https://stackoverflow.com/questions/19586137/addeventlistener-using-for-loop-and-passing-values
		let color = document.createElement("span");
		color.style.backgroundColor = colorLst[i];

		// Hover effect to focus inspired by this website https://ourworldindata.org/plastic-pollution#
		// Onmouseover & onmouseout https://www.w3schools.com/jsref/event_onmouseover.asp
		color.onmouseover = () => {
            var index = colorBarHover(container);
            // Generate a new color scale that only colors the countries that match the color
            if (division == mpwDivision) {
                chart1_colorScale = generateColorScale(division, colorLst, index, chart1_selectedLst);
                plasticPollution();
            } 
            else {
                chart2_colorScale = generateColorScale(division, colorLst, index, chart2_selectedLst);
                yearIndicator();
            }
        }
		color.onmouseout = () => {
            // Reset the plot
            setColorScale();
            
            if (division == mpwDivision) plasticPollution();
            else yearIndicator();
        };

		color.addEventListener("click", () => {
            if (division == mpwDivision) colorBarSelected(container, 1, color);
            else colorBarSelected(container, 2, color);
        });

		container.appendChild(color);

		var txt = document.createElement("p");
		if (division == mpwDivision) txt.innerText = numAbbr(division[i]);
		else txt.innerText = division[i];
		color.appendChild(txt);
	}
}

// Normalise function https://gist.github.com/Anthodpnt/aafeb0dc669fb9137dd0550b6f5d8630
function norm(value, min, max) {
    return (value - min) / (max - min);
}
  
function addDecimal(num) {
	// A function to ensure that the percent is actually greater than the actual (e.g. 0.34 -> 0.35)
	if (num >= 1) return num;

	const decimal = num.toString().split('.')[1] || '';
	const decimalPlaces = decimal.length;

	// Formula created by myself but Concept inspired by https://www.tutorialspoint.com/How-can-I-round-a-number-to-1-decimal-place-in-JavaScript
	// Avoid no digit after the first digit
	const numStr = num.toFixed(decimalPlaces + 1).toString().split(".")[1].split("");

	var newNum = [0, "."];
	for (var i = 0; i < numStr.length; i++) {
		// First digit find
		if (numStr[i] != "0") {
			// Check whether it will adds up more than 9
			if (numStr[i + 1] == 9) {
				if (numStr[i] == 9) {
					newNum[i - 1] = 1;
					break
				} else {
					newNum.push(parseInt(numStr[i]) + 1);
					break
				}
			}

			newNum.push(parseInt(numStr[i]));
			newNum.push(parseInt(numStr[i + 1]) + 1);
			break;
		} else {
			newNum.push(0);
		}
	}

	return newNum.join("");
}

function numAbbr(num) {
	// A function to make the display into abbr form (e.g. 10000 -> 10k)
	// Formula created by myself but inspired by https://stackoverflow.com/questions/2685911/is-there-a-way-to-round-numbers-into-a-reader-friendly-format-e-g-1-1k
	var numSplit = num.toString().split('');
	var newNum = [];

	if (numSplit.length > 3 && numSplit.length < 7) {
		for (var i = 0; i < numSplit.length - 3; i++) newNum.push(numSplit[i]);
		return newNum.join("") + "k";
	} else {
		return num;
	}
}

// Linear regression function that predicts the amount of threaten species 
// Code was taken from https://stackoverflow.com/questions/6195335/linear-regression-in-javascript
// Concept was learn from https://oliverjumpertz.com/simple-linear-regression-theory-math-and-implementation-in-javascript/
function linearRegression(y, x) {
	var lr = {};
	var n = y.length;
	var sum_x = 0;
	var sum_y = 0;
	var sum_xy = 0;
	var sum_xx = 0;
	var sum_yy = 0;

	for (var i = 0; i < y.length; i++) {

		sum_x += x[i];
		sum_y += y[i];
		sum_xy += (x[i] * y[i]);
		sum_xx += (x[i] * x[i]);
		sum_yy += (y[i] * y[i]);
	}

	lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
	lr['intercept'] = (sum_y - lr.slope * sum_x) / n;
	lr['r2'] = Math.pow((n * sum_xy - sum_x * sum_y) / Math.sqrt((n * sum_xx - sum_x * sum_x) * (n * sum_yy - sum_y * sum_y)), 2);

	return lr;
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

function navbarAnimation() {
    // Nav-bar animation learnt from DECO1016
    // Create a variable to reference the toggle <button>
    var navbarToggle = navbar.querySelector("#navbar-toggle");

    // Create a variable to reference the nav menu container <div>
    var navbarMenu = document.querySelector("#navbar-menu");

    // Create a variable to reference the <ul> list of nav links
    var navbarLinksContainer = navbarMenu.querySelector(".navbar-links");

    // Add or remove the 'active' class on the toggle <button> when clicked
    navbarToggle.addEventListener("click", () => { navbarToggle.classList.toggle('active') });

    // Remove the 'active' class on the menu container <div> when clicked 
    // This will close the menu if the user clicks outside the nav link <ul>
    navbarMenu.addEventListener("click", () => { navbarToggle.classList.remove('active') });

    // Close the nav bar menu when users click any section tag
    for (var i = 0; i < allNavLinks.length; i++) {
        allNavLinks[i].addEventListener("click", () => { navbarToggle.classList.remove('active') });
    }

    navbarMenu.addEventListener("click", () => { navbarToggle.classList.remove('active') });

    // Stop clicks on the navbar links from toggling the menu (for when it's not mobile)
    navbarLinksContainer.addEventListener("click", (e) => e.stopPropagation());
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
    // console.log(consumptionAnimating);
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
                // console.log(value);
                clearInterval(animation);
                event.innerHTML = "&#9205";
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
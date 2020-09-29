// Wait for document to load
document.addEventListener("DOMContentLoaded", function (event) {
    let resp = $.ajax({})
    console.log(resp.state())

    let currentTheme = localStorage.getItem("data-theme")
    const Theme = {
        "dark": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"\n" +
            "         stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n" +
            "        <path d=\"M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z\"></path>\n" +
            "    </svg>",
        "light": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" " +
            "viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">" +
            "<circle cx=\"12\" cy=\"12\" r=\"5\"></circle>" +
            "<line x1=\"12\" y1=\"1\" x2=\"12\" y2=\"3\"></line>" +
            "<line x1=\"12\" y1=\"21\" x2=\"12\" y2=\"23\"></line>" +
            "<line x1=\"4.22\" y1=\"4.22\" x2=\"5.64\" y2=\"5.64\"></line>" +
            "<line x1=\"18.36\" y1=\"18.36\" x2=\"19.78\" y2=\"19.78\"></line>" +
            "<line x1=\"1\" y1=\"12\" x2=\"3\" y2=\"12\"></line>" +
            "<line x1=\"21\" y1=\"12\" x2=\"23\" y2=\"12\"></line>" +
            "<line x1=\"4.22\" y1=\"19.78\" x2=\"5.64\" y2=\"18.36\"></line>" +
            "<line x1=\"18.36\" y1=\"5.64\" x2=\"19.78\" y2=\"4.22\"></line>" +
            "</svg>"
    }
    document.documentElement.setAttribute("data-theme", currentTheme ? currentTheme : "light");

    let themeSwitcher = document.getElementById("theme-switcher");
    themeSwitcher.innerHTML = Theme[currentTheme] ? Theme[currentTheme] : Theme["dark"]
    themeSwitcher.onclick = function () {
        let currentTheme = document.documentElement.getAttribute("data-theme");

        let switchToTheme = currentTheme === "dark" ? "light" : "dark"
        
        themeSwitcher.innerHTML = Theme[switchToTheme]
        document.documentElement.setAttribute("data-theme", switchToTheme);

        localStorage.setItem("data-theme", switchToTheme)
    }

});

$(document).scroll(function () {
    let $nav = $(".navbar");
    if (document.documentElement.scrollTop > 750) $nav.toggleClass('scrolled', true);
    else $nav.toggleClass('scrolled', false);
    
    scrollFunction()
});

let navigator = $('.navigator')

function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        navigator.css('display', 'block')
    } else {
        navigator.css('display', 'none')
    }
}

const scrollToTop = () => $(window).scrollTop(0);
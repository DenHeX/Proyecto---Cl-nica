
function smoothScroll(target) {
    var targetElement = document.getElementById(target);
    window.scrollTo({
        top: targetElement.offsetTop,
        behavior: 'smooth'
    });
}



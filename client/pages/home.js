(function() {
    var scrollBgPic = function(event) {
            var pagesElement = document.getElementById('pages'),
                bgPic = pagesElement.getElementsByClassName('header')[0],
                initialPositionY = 50,
                newPositionY;

            // stop scroll of bg if pic is out of the viewport
            if(bgPic && pagesElement.scrollTop < bgPic.clientHeight) {
                bgPic.style.backgroundPositionY = initialPositionY - pagesElement.scrollTop / 20 + '%';
            }
        };

    Template.home.rendered = function() {
        document.getElementById('pages').addEventListener('scroll', scrollBgPic);
        document.getElementById('pages').addEventListener('touchmove', scrollBgPic);
    };
    
    Template.home.destroyed = function() {
        document.getElementById('pages').removeEventListener('scroll', scrollBgPic);
        document.getElementById('pages').removeEventListener('touchmove', scrollBgPic);
    };
})();
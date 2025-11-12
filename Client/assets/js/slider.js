function initSlider() {
    const mainImage = document.getElementById("mainImage");
    const nameList = document.querySelector(".image-name-list");
    
    if (!mainImage || !nameList) return;
    
    const items = Array.from(nameList.querySelectorAll("span"));
    let isDown = false, startX = 0, scrollStart = 0;
    let currentIndex = 0, autoTimer = null, resumeTimer = null;

    function updateActive() {
        const center = nameList.scrollLeft + nameList.offsetWidth / 2;
        let closest = items[0], minDist = Infinity, closestIdx = 0;

        items.forEach((item, i) => {
            const itemCenter = item.offsetLeft + item.offsetWidth / 2;
            const dist = Math.abs(center - itemCenter);
            if (dist < minDist) {
                closest = item;
                closestIdx = i;
                minDist = dist;
            }
            
            const opacity = Math.max(0.2, 1 - (dist / nameList.offsetWidth) * 1.2);
            item.style.opacity = opacity;
        });

        currentIndex = closestIdx;
        items.forEach(i => i.classList.remove("active"));
        closest.classList.add("active");
        
        if (!mainImage.src.includes(closest.dataset.img)) {
            mainImage.classList.add("fade-out");
            setTimeout(() => {
                mainImage.src = closest.dataset.img;
                mainImage.alt = closest.textContent;
                mainImage.classList.remove("fade-out", "fade-in");
                void mainImage.offsetWidth;
                mainImage.classList.add("fade-in");
            }, 400);
        }
    }

    function scrollToCenter(item) {
        const itemCenter = item.offsetLeft + item.offsetWidth / 2;
        nameList.scrollLeft = itemCenter - nameList.offsetWidth / 2;
    }

    function autoRotate() {
        currentIndex = (currentIndex + 1) % items.length;
        scrollToCenter(items[currentIndex]);
        updateActive();
    }

    function startAutoRotate() {
        if (autoTimer) clearInterval(autoTimer);
        autoTimer = setInterval(autoRotate, 3000);
    }

    function stopAutoRotate() {
        if (autoTimer) clearInterval(autoTimer);
        if (resumeTimer) clearTimeout(resumeTimer);
        resumeTimer = setTimeout(startAutoRotate, 3000);
    }

    // Click
    items.forEach(item => {
        item.addEventListener("click", () => {
            stopAutoRotate();
            scrollToCenter(item);
            updateActive();
        });
    });

    // Drag
    nameList.addEventListener("mousedown", e => {
        stopAutoRotate();
        isDown = true;
        startX = e.pageX;
        scrollStart = nameList.scrollLeft;
    });

    document.addEventListener("mousemove", e => {
        if (!isDown) return;
        nameList.scrollLeft = scrollStart - (e.pageX - startX) * 0.8;
        updateActive();
    });

    document.addEventListener("mouseup", () => {
        isDown = false;
    });

    // Touch
    nameList.addEventListener("touchstart", e => {
        stopAutoRotate();
        isDown = true;
        startX = e.touches[0].clientX;
        scrollStart = nameList.scrollLeft;
    });

    document.addEventListener("touchmove", e => {
        if (!isDown) return;
        nameList.scrollLeft = scrollStart - (e.touches[0].clientX - startX) * 0.8;
        updateActive();
    });

    document.addEventListener("touchend", () => {
        isDown = false;
    });

    // Init
    setTimeout(() => {
        scrollToCenter(items[0]);
        updateActive();
        startAutoRotate();
    }, 50);
}

document.addEventListener("DOMContentLoaded", initSlider);

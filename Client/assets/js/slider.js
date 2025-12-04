function initSlider() {
  const mainImage = document.getElementById("mainImage");
  const nameList = document.querySelector(".image-name-list");

  if (!mainImage || !nameList) return;

  const items = Array.from(nameList.querySelectorAll("span"));
  let isDown = false,
    startX = 0,
    scrollStart = 0;
  let currentIndex = 0,
    autoTimer = null,
    resumeTimer = null;
  let velocity = 0,
    lastX = 0,
    lastTime = 0,
    momentumAnimationId = null;

  // Throttle để giảm số lần update
  let lastUpdateTime = 0;
  let updateQueued = false;
  const UPDATE_INTERVAL = 16; // ~60fps

  // ----------- Chuyển ảnh mượt với preload -----------
  function changeImage(newSrc, newAlt) {
    // fade-out trước
    mainImage.classList.remove("fade-in");
    mainImage.classList.add("fade-out");

    // preload ảnh mới
    const img = new Image();
    img.src = newSrc;
    img.onload = () => {
      mainImage.src = newSrc;
      mainImage.alt = newAlt;

      // fade-in
      mainImage.classList.remove("fade-out");
      void mainImage.offsetWidth; // trigger reflow
      mainImage.classList.add("fade-in");
    };
  }

  function updateActive(force = false) {
    const now = performance.now();

    // Throttle updates nếu không force
    if (!force && now - lastUpdateTime < UPDATE_INTERVAL) {
      if (!updateQueued) {
        updateQueued = true;
        requestAnimationFrame(() => {
          updateQueued = false;
          updateActive(true);
        });
      }
      return;
    }
    lastUpdateTime = now;

    const center = nameList.scrollLeft + nameList.offsetWidth / 2;
    let closest = items[0],
      minDist = Infinity,
      closestIdx = 0;

    items.forEach((item, i) => {
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;
      const dist = Math.abs(center - itemCenter);
      if (dist < minDist) {
        closest = item;
        closestIdx = i;
        minDist = dist;
      }

      // Smooth opacity dựa trên khoảng cách
      const normalizedDist = dist / nameList.offsetWidth;
      const opacity = Math.max(0.3, 1 - normalizedDist * 1.5);
      item.style.opacity = opacity;
    });

    if (currentIndex !== closestIdx) {
      currentIndex = closestIdx;
      items.forEach((i) => i.classList.remove("active"));
      closest.classList.add("active");

      // Chuyển ảnh mượt nếu khác src
      if (!mainImage.src.includes(closest.dataset.img)) {
        changeImage(closest.dataset.img, closest.textContent);
      }
    }
  }

  // ----------- Scroll tới center -----------
  function scrollToCenter(item) {
    const itemCenter = item.offsetLeft + item.offsetWidth / 2;
    const targetScroll = itemCenter - nameList.offsetWidth / 2;
    smoothScrollTo(targetScroll);
  }

  function smoothScrollTo(target) {
    if (momentumAnimationId) cancelAnimationFrame(momentumAnimationId);

    const start = nameList.scrollLeft;
    const distance = target - start;
    const duration = 600; // Giảm từ 800 xuống 600 cho snappy hơn
    let startTime = null;

    // Easing mượt hơn
    function easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function animate(currentTime) {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      nameList.scrollLeft = start + distance * easeOutExpo(progress);
      updateActive();

      if (progress < 1) {
        momentumAnimationId = requestAnimationFrame(animate);
      } else {
        momentumAnimationId = null;
      }
    }

    momentumAnimationId = requestAnimationFrame(animate);
  }

  // ----------- Momentum khi drag/touch -----------
  function applyMomentum() {
    if (Math.abs(velocity) < 0.3) {
      // Snap to nearest item khi velocity thấp
      scrollToCenter(items[currentIndex]);
      return;
    }

    if (momentumAnimationId) cancelAnimationFrame(momentumAnimationId);

    const friction = 0.92; // Giảm từ 0.95 để dừng nhanh hơn
    const minVelocity = 0.2;

    function momentum() {
      velocity *= friction;
      nameList.scrollLeft -= velocity;
      updateActive();

      if (Math.abs(velocity) > minVelocity) {
        momentumAnimationId = requestAnimationFrame(momentum);
      } else {
        momentumAnimationId = null;
        velocity = 0;
        // Snap to center sau khi momentum dừng
        scrollToCenter(items[currentIndex]);
      }
    }

    momentumAnimationId = requestAnimationFrame(momentum);
  }

  // ----------- Auto rotate -----------
  function autoRotate() {
    currentIndex = (currentIndex + 1) % items.length;
    scrollToCenter(items[currentIndex]);
  }

  function startAutoRotate() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = setInterval(autoRotate, 4000);
  }

  function stopAutoRotate() {
    if (autoTimer) clearInterval(autoTimer);
    if (resumeTimer) clearTimeout(resumeTimer);
    resumeTimer = setTimeout(startAutoRotate, 4000);
  }

  // ----------- Click -----------
  items.forEach((item) => {
    item.addEventListener("click", () => {
      stopAutoRotate();
      scrollToCenter(item);
    });
  });

  // ----------- Drag & Touch -----------
  function startDrag(clientX) {
    if (momentumAnimationId) cancelAnimationFrame(momentumAnimationId);
    stopAutoRotate();
    isDown = true;
    startX = clientX;
    lastX = clientX;
    lastTime = Date.now();
    scrollStart = nameList.scrollLeft;
    velocity = 0;
  }

  function moveDrag(clientX) {
    if (!isDown) return;

    const currentTime = Date.now();
    const deltaX = clientX - lastX;
    const deltaTime = currentTime - lastTime;

    velocity = deltaTime > 0 ? deltaX / deltaTime : 0;

    nameList.scrollLeft = scrollStart - (clientX - startX) * 0.8;
    updateActive();

    lastX = clientX;
    lastTime = currentTime;
  }

  function endDrag() {
    if (!isDown) return;
    isDown = false;
    applyMomentum();
  }

  nameList.addEventListener("mousedown", (e) => startDrag(e.pageX));
  document.addEventListener("mousemove", (e) => moveDrag(e.pageX));
  document.addEventListener("mouseup", endDrag);

  nameList.addEventListener("touchstart", (e) =>
    startDrag(e.touches[0].clientX)
  );
  document.addEventListener("touchmove", (e) => moveDrag(e.touches[0].clientX));
  document.addEventListener("touchend", endDrag);

  // ----------- Init -----------
  setTimeout(() => {
    scrollToCenter(items[0]);
    updateActive();
    startAutoRotate();
  }, 50);
}

document.addEventListener("DOMContentLoaded", initSlider);

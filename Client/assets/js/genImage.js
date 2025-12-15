let trendData = [];
let currentUserPlan = "free";
let availableModels = ["nano-banana"];

// Load user premium status and available models
async function loadUserPremiumStatus() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      currentUserPlan = "free";
      availableModels = ["nano-banana"];
      return;
    }

    const response = await fetch("/api/premium/current", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const premiumData = await response.json();
      currentUserPlan = premiumData.plan?.toLowerCase() || "free";

      // Determine available models based on plan
      switch (currentUserPlan) {
        case "max":
          availableModels = ["nano-banana", "gemini-2.0-flash", "gemini-3-pro"];
          break;
        case "pro":
        case "monthly":
        case "yearly":
          availableModels = ["nano-banana", "gemini-2.0-flash"];
          break;
        default:
          availableModels = ["nano-banana"];
      }
    } else {
      currentUserPlan = "free";
      availableModels = ["nano-banana"];
    }
  } catch (error) {
    console.error("Error loading user premium status:", error);
    currentUserPlan = "free";
    availableModels = ["nano-banana"];
  }
}

// Populate model dropdown UI based on available models
function populateModelSelections() {
  const modelDropdowns = [
    {
      id: "model-selection",
      triggerId: "model-dropdown-trigger",
      menuId: "model-dropdown-menu",
      name: "ai-model",
    },
    {
      id: "bg-model-selection",
      triggerId: "bg-model-dropdown-trigger",
      menuId: "bg-model-dropdown-menu",
      name: "bg-ai-model",
    },
    {
      id: "outfit-model-selection",
      triggerId: "outfit-model-dropdown-trigger",
      menuId: "outfit-model-dropdown-menu",
      name: "outfit-ai-model",
    },
  ];

  const allModelConfigs = {
    "nano-banana": {
      name: "Basic AI",
      desc: "Miễn phí",
      badge: "FREE",
      badgeClass: "free",
    },
    "gemini-2.0-flash": {
      name: "Pro AI",
      desc: "Nhanh & Chất lượng cao",
      badge: "PRO",
      badgeClass: "pro",
    },
    "gemini-3-pro": {
      name: "Ultra AI",
      desc: "Chất lượng cao nhất",
      badge: "MAX",
      badgeClass: "max",
    },
  };

  modelDropdowns.forEach(({ id, triggerId, menuId, name }) => {
    const container = document.getElementById(id);
    const trigger = document.getElementById(triggerId);
    const menu = document.getElementById(menuId);

    if (!container || !trigger || !menu) return;

    let menuHtml = "";
    let selectedModel = null;

    // Show all models, but lock ones not available to user
    const allModels = ["nano-banana", "gemini-2.0-flash", "gemini-3-pro"];

    allModels.forEach((model) => {
      const config = allModelConfigs[model];
      const isAvailable = availableModels.includes(model);

      // Select best available model by default
      if (
        isAvailable &&
        model === availableModels[availableModels.length - 1]
      ) {
        selectedModel = model;
      }

      menuHtml += `
        <div class="model-dropdown-option ${
          !isAvailable ? "locked" : ""
        }" data-model="${model}" data-available="${isAvailable}">
          <div class="model-info">
            <div class="model-name">${config.name}</div>
            <div class="model-desc">${config.desc}</div>
            <div class="model-badge ${
              !isAvailable ? "locked" : config.badgeClass
            }">${!isAvailable ? "🔒 " + config.badge : config.badge}</div>
          </div>
        </div>
      `;
    });

    menu.innerHTML = menuHtml;

    // Update trigger to show selected model
    if (selectedModel) {
      updateDropdownTrigger(
        trigger,
        selectedModel,
        allModelConfigs[selectedModel]
      );
    }

    // Add click event to trigger
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      container.classList.toggle("open");

      // Close other dropdowns
      document.querySelectorAll(".model-dropdown").forEach((dropdown) => {
        if (dropdown !== container) {
          dropdown.classList.remove("open");
        }
      });
    });

    // Add click events to dropdown options
    menu.querySelectorAll(".model-dropdown-option").forEach((option) => {
      option.addEventListener("click", (e) => {
        const model = option.dataset.model;
        const isAvailable = option.dataset.available === "true";

        if (!isAvailable) {
          e.stopPropagation();
          // Redirect to pricing page for locked models
          window.location.href = "/topup.html";
          return;
        }

        updateDropdownTrigger(trigger, model, allModelConfigs[model]);

        // Update selected state
        menu.querySelectorAll(".model-dropdown-option").forEach((opt) => {
          opt.classList.remove("selected");
        });
        option.classList.add("selected");

        // Close dropdown
        container.classList.remove("open");
      });
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", () => {
    document.querySelectorAll(".model-dropdown").forEach((dropdown) => {
      dropdown.classList.remove("open");
    });
  });
}

// Update dropdown trigger with selected model info
function updateDropdownTrigger(trigger, model, config) {
  const selectedInfo = trigger.querySelector(".selected-model-info");
  if (selectedInfo) {
    selectedInfo.innerHTML = `
      <div class="model-info">
        <div class="model-name">${config.name}</div>
        <div class="model-desc">${config.desc}</div>
        <div class="model-badge ${config.badgeClass}">${config.badge}</div>
      </div>
    `;
  }

  // Store selected model value
  trigger.dataset.selectedModel = model;
}

// Load trending prompts từ API
async function loadTrendingPrompts() {
  try {
    const response = await fetch("/api/prompts-trending");
    if (!response.ok) {
      console.error("Lỗi khi load trending prompts");
      return;
    }

    trendData = await response.json();
    initTrendsGrid();
  } catch (error) {
    console.error("Lỗi load trending prompts:", error);
  }
}

// Initialize trends grid
function initTrendsGrid() {
  const trendsGrid = document.getElementById("trendsGrid");
  if (trendData.length === 0) {
    trendsGrid.innerHTML =
      '<p style="grid-column: 1/-1; text-align: center; color: #999;">Không có trending prompts</p>';
    return;
  }

  trendsGrid.innerHTML = trendData
    .map(
      (trend, index) => `
          <div class="trend-card" onclick="selectTrend(${index})">
            <div class="trend-image-wrapper">
              <img src="${
                trend.image || "https://via.placeholder.com/300"
              }" alt="${trend.title}" class="trend-image">
              <div class="trend-overlay">
                <p>${trend.title}</p>
              </div>
            </div>
          </div>
        `
    )
    .join("");
}

// Select trend and populate prompt
function selectTrend(index) {
  if (!checkAuthBeforeAction()) return;

  const trend = trendData[index];
  if (!trend) return;

  // Show trend creator section
  document.getElementById("trendCreatorSection").style.display = "block";
  document.querySelector(".trends-section").style.display = "none";

  // Update trend name display
  document.getElementById("trend-selected-style").textContent = trend.title;

  // Store trend data globally
  window.currentTrend = trend;
  window.trendSelectedFile = null;
  window.currentTrendIndex = index;

  // Setup upload area - remove old elements and recreate to clear listeners
  const uploadArea = document.getElementById("trend-upload-area");
  const fileInput = document.getElementById("trend-file-input");
  const chooseBtn = document.getElementById("trend-choose-btn");

  // Clone and replace to remove all old event listeners
  const newUploadArea = uploadArea.cloneNode(true);
  const newFileInput = fileInput.cloneNode(true);
  const newChooseBtn = chooseBtn.cloneNode(true);

  uploadArea.parentNode.replaceChild(newUploadArea, uploadArea);
  fileInput.parentNode.replaceChild(newFileInput, fileInput);
  chooseBtn.parentNode.replaceChild(newChooseBtn, chooseBtn);

  // Get references to new elements
  const updatedUploadArea = document.getElementById("trend-upload-area");
  const updatedFileInput = document.getElementById("trend-file-input");
  const updatedChooseBtn = document.getElementById("trend-choose-btn");

  updatedChooseBtn.addEventListener("click", (e) => {
    console.log("Button clicked");
    e.stopPropagation();
    updatedFileInput.click();
  });

  updatedUploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    updatedUploadArea.style.borderColor = "#666";
  });

  updatedUploadArea.addEventListener("dragleave", () => {
    updatedUploadArea.style.borderColor = "#ccc";
  });

  updatedUploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleTrendFile(file);
  });

  const fileChangeHandler = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("File input change triggered");
      handleTrendFile(file);
      updatedFileInput.value = "";
    }
  };
  updatedFileInput.addEventListener("change", fileChangeHandler);

  // Scroll to top
  window.scrollTo(0, 0);

  // Show notification
  const notification = document.createElement("div");
  notification.className = "trend-notification";
  notification.innerHTML = `
          <div class="notification-content">
            <strong> ${trend.title}</strong> đã được chọn!
            <p>Hãy tải ảnh lên và nhấn "Tạo ảnh"</p>
          </div>
        `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Handle trend file upload
function handleTrendFile(file) {
  console.log("handleTrendFile called with:", file.name);
  window.trendSelectedFile = file;
  const uploadArea = document.getElementById("trend-upload-area");
  const reader = new FileReader();
  reader.onload = () => {
    uploadArea.innerHTML = `
      <div style="position: relative; width: 100%; height: 100%;">
        <img src="${reader.result}" 
          style="max-width:100%; max-height:100%; border-radius:8px; display:block; margin:auto; object-fit: contain;">
        <button class="change-image-btn" onclick="changeTrendImage(event)" title="Chọn ảnh khác">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          Chọn ảnh khác
        </button>
      </div>
    `;
  };
  reader.readAsDataURL(file);
}

function changeTrendImage(event) {
  event.stopPropagation();
  event.preventDefault();
  const trendFileInput = document.getElementById("trend-file-input");
  trendFileInput.click();
}

// Reset trend creator
function resetTrendCreator() {
  document.getElementById("trendCreatorSection").style.display = "none";
  document.querySelector(".trends-section").style.display = "block";
  window.currentTrend = null;
  window.trendSelectedFile = null;
  document.getElementById("trend-additional-desc").value = "";
  document.getElementById("trend-output-area").innerHTML = `
          <div class="output-placeholder">
            <p>Ảnh kết quả sẽ xuất hiện tại đây</p>
          </div>
        `;
  document.getElementById("trend-download-btn").style.display = "none";
}

// Generate trend image
document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("trend-generate-btn");
  if (generateBtn) {
    generateBtn.addEventListener("click", async () => {
      if (!checkAuthBeforeAction()) return;

      if (!window.trendSelectedFile) {
        showToast("Vui lòng chọn ảnh trước", 'warning');
        return;
      }

      const additionalDesc = document.getElementById(
        "trend-additional-desc"
      ).value;

      showConfirmDialog(null, window.trendSelectedFile, "trending", {
        trendDescription: additionalDesc,
      });
    });
  }
});

function displayTrendOutput(result) {
  const outputArea = document.getElementById("trend-output-area");
  const downloadBtn = document.getElementById("trend-download-btn");

  outputArea.innerHTML = `
          <img src="${result.localPath}?t=${Date.now()}" alt="Generated image">
        `;

  downloadBtn.style.display = "flex";
  downloadBtn.onclick = () =>
    downloadTrendImage(result.localPath, `trend_${window.currentTrend.title}`);
}

async function downloadTrendImage(imagePath, name) {
  try {
    // Nếu là Cloudinary URL, thêm transformation để tải chất lượng cao nhất
    let downloadUrl = imagePath;
    if (imagePath.includes('cloudinary.com')) {
      downloadUrl = imagePath.replace('/upload/', '/upload/q_100,fl_preserve_transparency/');
      console.log('📥 Downloading high quality trend image from:', downloadUrl);
    }

    // Fetch the image as a blob
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch image");
    }

    const blob = await response.blob();

    // Create an object URL for the blob
    const blobUrl = URL.createObjectURL(blob);

    // Create download link
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${name}_${Date.now()}_HQ.jpg`;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the object URL after a short delay
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 100);
    
    showToast("Đã tải ảnh chất lượng cao!", 'success');
  } catch (error) {
    console.error("Error downloading image:", error);
    showToast("Không thể tải ảnh. Vui lòng thử lại sau.", 'error');
  }
}

// Tab switching
const tabButtons = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const tabName = button.dataset.tab;

    // Remove active from all buttons and contents
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    tabContents.forEach((content) => content.classList.remove("active"));

    // Add active to clicked button and corresponding content
    button.classList.add("active");
    document.getElementById(`${tabName}-tab`).classList.add("active");
  });
});

// ASCII Art Generation
const uploadArea = document.getElementById("upload-area");
const fileInput = document.getElementById("file-input");
const chooseBtn = document.getElementById("choose-btn");
const genderSelect = document.getElementById("gender-select");
const promptSelect = document.getElementById("prompt-select");
const generateBtn = document.getElementById("generate-btn");
let selectedFile = null;

uploadArea.addEventListener("click", (e) => {
  if (e.target === chooseBtn || chooseBtn.contains(e.target)) return;
  fileInput.click();
});
chooseBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  fileInput.click();
});

uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = "#666";
});

uploadArea.addEventListener("dragleave", () => {
  uploadArea.style.borderColor = "#ccc";
});

uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

function handleFile(file) {
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    uploadArea.innerHTML = `
      <div style="position: relative; width: 100%; height: 100%;">
        <img src="${reader.result}" 
          style="max-width:100%; max-height:100%; border-radius:8px; display:block; margin:auto; object-fit: contain;">
        <button class="change-image-btn" onclick="changeImage(event)" title="Chọn ảnh khác">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          Chọn ảnh khác
        </button>
      </div>
    `;
  };
  reader.readAsDataURL(file);
}

function changeImage(event) {
  event.stopPropagation();
  event.preventDefault();
  fileInput.click();
}

// Load prompts từ API
async function loadPrompts(gender = "") {
  try {
    const url = gender ? `/api/prompts?gender=${gender}` : "/api/prompts";
    const response = await fetch(url);
    const prompts = await response.json();

    // Clear all existing options except first one
    promptSelect.innerHTML = '<option value="">Chọn prompt...</option>';

    // Add new options
    prompts.forEach((prompt) => {
      if (prompt.isActive) {
        const option = document.createElement("option");
        option.value = prompt.name;
        option.textContent = prompt.title || prompt.name;
        promptSelect.appendChild(option);
      }
    });
  } catch (error) {
    console.error("Lỗi load prompts:", error);
    promptSelect.innerHTML = '<option value="">Lỗi load prompts</option>';
  }
}

// Generate ảnh
let currentImageUrl = null;

generateBtn.addEventListener("click", async () => {
  if (!checkAuthBeforeAction()) return;

  if (!selectedFile) {
    showToast("Vui lòng chọn ảnh trước", 'warning');
    return;
  }
  if (!promptSelect.value) {
    showToast("Vui lòng chọn chế độ ảnh", 'warning');
    return;
  }

  showConfirmDialog(promptSelect.value, selectedFile, "faceImage", {
    promptSelect: promptSelect.value,
  });
});

// Hiển thị kết quả output
function displayOutput(result) {
  const outputArea = document.getElementById("output-area");
  const outputInfo = document.getElementById("output-info");
  const downloadBtn = document.getElementById("download-btn");

  // Hiển thị ảnh
  outputArea.innerHTML = `
          <img src="${result.localPath}?t=${Date.now()}" alt="Generated image">
        `;

  // Hiển thị thông tin
  document.getElementById("output-prompt-name").textContent = result.promptName;
  document.getElementById("output-prompt-title").textContent =
    result.promptTitle;
  outputInfo.style.display = "block";

  // Hiển thị nút download
  downloadBtn.style.display = "flex";
  downloadBtn.onclick = () =>
    downloadImage(result.localPath, result.promptName);
}

// Download ảnh với chất lượng gốc (không resize)
async function downloadImage(imagePath, promptName) {
  try {
    // Nếu là Cloudinary URL, tải ảnh gốc không resize
    let downloadUrl = imagePath;
    if (imagePath.includes('cloudinary.com')) {
      // Tải ảnh gốc với chất lượng 100%, không resize
      downloadUrl = imagePath.replace('/upload/', '/upload/q_100,fl_preserve_transparency,fl_attachment/');
      console.log('📥 Downloading original quality image from:', downloadUrl);
    }

    // Show loading toast
    showToast("⏳ Đang tải ảnh chất lượng gốc...", 'info');

    // Fetch the image as a blob
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch image");
    }

    const blob = await response.blob();
    const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
    console.log(`📦 Downloaded image size: ${sizeMB}MB`);

    // Create an object URL for the blob
    const blobUrl = URL.createObjectURL(blob);

    // Create download link
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${promptName}_ORIGINAL_${Date.now()}.jpg`;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the object URL after a short delay
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 100);
    
    showToast(`✅ Đã tải ảnh gốc! (${sizeMB}MB)`, 'success');
  } catch (error) {
    console.error("Error downloading image:", error);
    showToast("Không thể tải ảnh. Vui lòng thử lại sau.", 'error');
  }
}

// Load prompts khi page load
document.addEventListener("DOMContentLoaded", () => {
  loadTrendingPrompts();
  loadPrompts();

  // Load user premium status and populate model selections
  loadUserPremiumStatus()
    .then(() => {
      populateModelSelections();
    })
    .catch((error) => {
      console.error("Error initializing model selections:", error);
      // Fallback to basic model selection
      populateModelSelections();
    });

  // Add event listener for gender filter
  genderSelect.addEventListener("change", () => {
    const selectedGender = genderSelect.value;
    // Reset prompt dropdown trước khi load lại
    promptSelect.innerHTML = '<option value="">Loading prompts...</option>';
    loadPrompts(selectedGender);
  });
});

// Background Image Generation
const bgPromptInput = document.getElementById("bg-prompt-input");
const bgGenerateBtn = document.getElementById("bg-generate-btn");

bgGenerateBtn.addEventListener("click", async () => {
  if (!checkAuthBeforeAction()) return;

  const prompt = bgPromptInput.value.trim();
  if (!prompt) {
    showToast("Vui lòng nhập mô tả bối cảnh bạn muốn tạo", 'warning');
    return;
  }

  showConfirmDialog(null, null, "background", {
    bgPrompt: prompt,
  });
});

function displayBgOutput(result) {
  const bgOutputArea = document.getElementById("bg-output-area");
  const bgDownloadBtn = document.getElementById("bg-download-btn");

  bgOutputArea.innerHTML = `
          <img src="${
            result.localPath
          }?t=${Date.now()}" alt="Generated background">
        `;

  bgDownloadBtn.style.display = "flex";
  bgDownloadBtn.onclick = () =>
    downloadImage(result.localPath, `background_${Date.now()}`);
}

// Outfit Tab
const outfitUploadArea = document.getElementById("outfit-upload-area");
const outfitFileInput = document.getElementById("outfit-file-input");
const outfitChooseBtn = document.getElementById("outfit-choose-btn");
const clothingUploadArea = document.getElementById("clothing-upload-area");
const clothingFileInput = document.getElementById("clothing-file-input");
const clothingChooseBtn = document.getElementById("clothing-choose-btn");
const outfitGenderSelect = document.getElementById("outfit-gender-select");
const outfitTypeSelect = document.getElementById("outfit-type-select");
const outfitHairstyleSelect = document.getElementById(
  "outfit-hairstyle-select"
);
const outfitGenerateBtn = document.getElementById("outfit-generate-btn");
let outfitSelectedFile = null;
let clothingSelectedFile = null;

// Load outfit types and hairstyles based on gender
async function loadOutfitStyles(gender) {
  try {
    const response = await fetch(`/api/outfit-styles?gender=${gender}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Lỗi load dữ liệu");
    }

    // Load outfit types
    outfitTypeSelect.innerHTML = '<option value="">Chọn loại</option>';
    if (data.outfitTypes && data.outfitTypes.length > 0) {
      data.outfitTypes.forEach((type) => {
        const option = document.createElement("option");
        option.value = type.value;
        option.textContent = type.name;
        outfitTypeSelect.appendChild(option);
      });
      outfitTypeSelect.disabled = false;
    } else {
      outfitTypeSelect.disabled = true;
    }

    // Load hairstyles
    outfitHairstyleSelect.innerHTML = '<option value="">Chọn kiểu tóc</option>';
    if (data.hairstyles && data.hairstyles.length > 0) {
      data.hairstyles.forEach((hairstyle) => {
        const option = document.createElement("option");
        option.value = hairstyle.value;
        option.textContent = hairstyle.name;
        outfitHairstyleSelect.appendChild(option);
      });
      outfitHairstyleSelect.disabled = false;
    } else {
      outfitHairstyleSelect.disabled = true;
    }
  } catch (error) {
    console.error("Lỗi load outfit styles:", error);
    outfitTypeSelect.innerHTML = '<option value="">Lỗi load dữ liệu</option>';
    outfitHairstyleSelect.innerHTML =
      '<option value="">Lỗi load dữ liệu</option>';
    outfitTypeSelect.disabled = true;
    outfitHairstyleSelect.disabled = true;
  }
}

// Gender selection event
outfitGenderSelect.addEventListener("change", (e) => {
  const gender = e.target.value;
  if (gender) {
    loadOutfitStyles(gender);
  } else {
    outfitTypeSelect.innerHTML = '<option value="">Chọn loại</option>';
    outfitHairstyleSelect.innerHTML = '<option value="">Chọn kiểu tóc</option>';
    outfitTypeSelect.disabled = true;
    outfitHairstyleSelect.disabled = true;
  }
});

outfitUploadArea.addEventListener("click", (e) => {
  if (e.target === outfitChooseBtn || outfitChooseBtn.contains(e.target))
    return;
  outfitFileInput.click();
});
outfitChooseBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  outfitFileInput.click();
});

outfitUploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  outfitUploadArea.style.borderColor = "#666";
});

outfitUploadArea.addEventListener("dragleave", () => {
  outfitUploadArea.style.borderColor = "#ccc";
});

outfitUploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) handleOutfitFile(file);
});

outfitFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) handleOutfitFile(file);
});

function handleOutfitFile(file) {
  outfitSelectedFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    outfitUploadArea.innerHTML = `
      <div style="position: relative; width: 100%; height: 100%;">
        <img src="${reader.result}" 
          style="max-width:100%; max-height:100%; border-radius:8px; display:block; margin:auto; object-fit: contain;">
        <button class="change-image-btn" onclick="changeOutfitImage(event)" title="Chọn ảnh khác">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          Chọn ảnh khác
        </button>
      </div>
    `;
  };
  reader.readAsDataURL(file);
}

function changeOutfitImage(event) {
  event.stopPropagation();
  event.preventDefault();
  outfitFileInput.click();
}

// Clothing upload handlers
clothingUploadArea.addEventListener("click", (e) => {
  if (e.target === clothingChooseBtn || clothingChooseBtn.contains(e.target))
    return;
  clothingFileInput.click();
});
clothingChooseBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  clothingFileInput.click();
});

clothingUploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  clothingUploadArea.style.borderColor = "#666";
});

clothingUploadArea.addEventListener("dragleave", () => {
  clothingUploadArea.style.borderColor = "#ccc";
});

clothingUploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) handleClothingFile(file);
});

clothingFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) handleClothingFile(file);
});

function handleClothingFile(file) {
  clothingSelectedFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    clothingUploadArea.innerHTML = `
      <div style="position: relative; width: 100%; height: 100%;">
        <img src="${reader.result}" 
          style="max-width:100%; max-height:100%; border-radius:8px; display:block; margin:auto; object-fit: contain;">
        <button class="change-image-btn" onclick="changeClothingImage(event)" title="Chọn ảnh khác">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          Chọn ảnh khác
        </button>
      </div>
    `;
  };
  reader.readAsDataURL(file);
}

function changeClothingImage(event) {
  event.stopPropagation();
  event.preventDefault();
  clothingFileInput.click();
}

outfitGenerateBtn.addEventListener("click", async () => {
  if (!checkAuthBeforeAction()) return;

  if (!outfitSelectedFile) {
    showToast("Vui lòng chọn ảnh người trước", 'warning');
    return;
  }

  if (!clothingSelectedFile) {
    if (!outfitGenderSelect.value) {
      showToast("Vui lòng chọn giới tính", 'warning');
      return;
    }
    if (!outfitTypeSelect.value || !outfitHairstyleSelect.value) {
      showToast("Vui lòng chọn loại trang phục và kiểu tóc", 'warning');
      return;
    }
  }

  const outfitDescription = document.getElementById("outfit-description").value;

  showConfirmDialog(null, outfitSelectedFile, "outfit", {
    outfitType: outfitTypeSelect.value,
    outfitHairstyle: outfitHairstyleSelect.value,
    outfitDescription: outfitDescription,
    clothingFile: clothingSelectedFile,
  });
});

function displayOutfitOutput(result) {
  const outfitOutputArea = document.getElementById("outfit-output-area");
  const outfitDownloadBtn = document.getElementById("outfit-download-btn");

  outfitOutputArea.innerHTML = `
          <img src="${result.localPath}?t=${Date.now()}" alt="Generated outfit">
        `;

  outfitDownloadBtn.style.display = "flex";
  outfitDownloadBtn.onclick = () =>
    downloadImage(result.localPath, `outfit_${outfitTypeSelect.value}`);
}

// Check authentication and show modal if needed
function checkAuthBeforeAction() {
  const token = localStorage.getItem("token");
  if (!token) {
    showLoginModal();
    return false;
  }
  return true;
}

function showLoginModal() {
  const modal = document.getElementById("loginModal");
  modal.classList.remove("hidden");
}

function closeLoginModal() {
  const modal = document.getElementById("loginModal");
  modal.classList.add("hidden");
}

// Close modal when clicking overlay
document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("loginModal");
  const overlay = modal.querySelector(".modal-overlay");
  if (overlay) {
    overlay.addEventListener("click", closeLoginModal);
  }
});

// Confirmation Dialog Functions
let pendingGenerateData = {
  promptName: null,
  selectedFile: null,
  type: "faceImage",
};

// Cache data để tránh fetch lại nhiều lần
let cachedData = {
  prompts: null,
  trendingPrompts: null,
  serviceConfigs: {},
  lastFetch: 0
};

const CACHE_DURATION = 60000; // 1 phút

async function showConfirmDialog(
  promptName,
  file,
  type = "faceImage",
  extra = {}
) {
  try {
    pendingGenerateData = { promptName, selectedFile: file, type, extra };

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    let fee = 0;

    const now = Date.now();
    const needRefresh = now - cachedData.lastFetch > CACHE_DURATION;

    // Fetch data (sử dụng cache nếu có)
    let prompts, trendingPrompts, serviceConfig, profileData, quotaInfo;

    if (needRefresh || !cachedData.prompts) {
      // Fetch mới và cache
      const [promptsRes, trendingRes, profileRes, quotaRes] = await Promise.all([
        fetch("/api/prompts", { headers }),
        fetch("/api/prompts-trending", { headers }),
        fetch("/api/profile/me", { headers }),
        fetch("/api/ai/daily-quota", { headers }).catch(() => null)
      ]);

      [prompts, trendingPrompts, profileData, quotaInfo] = await Promise.all([
        promptsRes.json(),
        trendingRes.json(),
        profileRes.json(),
        quotaRes ? quotaRes.json() : null
      ]);

      // Cache prompts
      cachedData.prompts = prompts;
      cachedData.trendingPrompts = trendingPrompts;
      cachedData.lastFetch = now;
    } else {
      // Dùng cache cho prompts, chỉ fetch profile và quota
      prompts = cachedData.prompts;
      trendingPrompts = cachedData.trendingPrompts;

      const [profileRes, quotaRes] = await Promise.all([
        fetch("/api/profile/me", { headers }),
        fetch("/api/ai/daily-quota", { headers }).catch(() => null)
      ]);

      [profileData, quotaInfo] = await Promise.all([
        profileRes.json(),
        quotaRes ? quotaRes.json() : null
      ]);
    }

    // Fetch service config nếu cần (cache riêng)
    const serviceConfigEndpoint = type === "outfit"
      ? "/api/service-config/outfit"
      : type === "background"
        ? "/api/service-config/background"
        : null;

    if (serviceConfigEndpoint) {
      if (!cachedData.serviceConfigs[type]) {
        const res = await fetch(serviceConfigEndpoint, { headers });
        serviceConfig = await res.json();
        cachedData.serviceConfigs[type] = serviceConfig;
      } else {
        serviceConfig = cachedData.serviceConfigs[type];
      }
    }

    // Tìm promptData
    let promptData = prompts.find((p) => p.name === promptName);
    if (!promptData) {
      promptData = trendingPrompts.find((p) => p.name === promptName);
    }

    // Xác định fee
    if (type === "faceImage") {
      fee = promptData?.fee || 0;
    } else if (serviceConfig) {
      fee = serviceConfig.fee || 0;
    }

    const balance = profileData.balance || 0;

    // Display free quota section
    const freeQuotaSection = document.getElementById("freeQuotaSection");
    const quotaNote = document.getElementById("quotaNote");

    if (quotaInfo && quotaInfo.maxFree > 0) {
      freeQuotaSection.style.display = "block";
      document.getElementById("remainingFree").textContent =
        quotaInfo.remainingFree;
      document.getElementById("maxFree").textContent = quotaInfo.maxFree;

      if (quotaInfo.remainingFree > 0) {
        freeQuotaSection.classList.remove("exhausted");
        quotaNote.classList.remove("warning");
      } else {
        freeQuotaSection.classList.add("exhausted");
        quotaNote.textContent = "⚠️ Đã hết lượt miễn phí, sẽ trừ từ số dư";
        quotaNote.classList.add("warning");
      }
    } else {
      freeQuotaSection.style.display = "none";
    }

    document.getElementById("confirmPrice").textContent =
      fee.toLocaleString() + " VND";
    document.getElementById("confirmBalance").textContent =
      balance.toLocaleString() + " VND";

    // Check if can proceed: has free quota OR has enough balance
    const hasFreeQuota = quotaInfo && quotaInfo.remainingFree > 0;

    if (hasFreeQuota) {
      // Has free quota - always allow
      document.getElementById("confirmBalance").style.color = "#10b981";
      document.querySelector(".btn-confirm").disabled = false;
      // Show that this is free
      document.getElementById(
        "confirmPrice"
      ).innerHTML = `<span style="text-decoration: line-through; color: #9ca3af;">${fee.toLocaleString()} VND</span> <span style="color: #16a34a; font-weight: 600;">MIỄN PHÍ</span>`;
    } else if (balance < fee) {
      document.getElementById("confirmBalance").style.color = "#d32f2f";
      document.querySelector(".btn-confirm").disabled = true;
      document.getElementById("confirmPrice").textContent =
        fee.toLocaleString() + " VND";
    } else {
      document.getElementById("confirmBalance").style.color = "#10b981";
      document.querySelector(".btn-confirm").disabled = false;
      document.getElementById("confirmPrice").textContent =
        fee.toLocaleString() + " VND";
    }

    const dialog = document.getElementById("confirmDialog");
    dialog.classList.remove("hidden");
  } catch (error) {
    console.error("Lỗi load thông tin giá:", error);
    showToast("Lỗi khi tải thông tin giá", 'error');
  }
}

function closeConfirmDialog() {
  const dialog = document.getElementById("confirmDialog");
  dialog.classList.add("hidden");
  pendingGenerateData = {
    promptName: null,
    selectedFile: null,
    type: "faceImage",
  };
}

async function proceedGenerate() {
  const type = pendingGenerateData.type;

  if (type === "faceImage") {
    await proceedGenerateFaceImage();
  } else if (type === "background") {
    await proceedGenerateBackground();
  } else if (type === "outfit") {
    await proceedGenerateOutfit();
  } else if (type === "trending") {
    await proceedGenerateTrending();
  }
}

async function proceedGenerateFaceImage() {
  if (!pendingGenerateData.selectedFile || !pendingGenerateData.promptName) {
    showToast("Dữ liệu không hợp lệ", 'error');
    return;
  }

  const promptName = pendingGenerateData.promptName;
  const selectedFile = pendingGenerateData.selectedFile;

  closeConfirmDialog();

  const token = localStorage.getItem("token");

  // Get selected model from dropdown
  const modelTrigger = document.getElementById("model-dropdown-trigger");
  const modelName = modelTrigger
    ? modelTrigger.dataset.selectedModel || "nano-banana"
    : "nano-banana";

  const formData = new FormData();
  formData.append("promptName", promptName);
  formData.append("image", selectedFile);
  formData.append("model", modelName);

  try {
    const generateBtn = document.getElementById("generate-btn");
    generateBtn.disabled = true;
    generateBtn.innerHTML =
      "<span class='loading-spinner'></span>Đang xử lý...";

    const outputArea = document.getElementById("output-area");
    outputArea.innerHTML = `
          <div class="loading-container">
            <div class="loading-spinner"></div>
          </div>
        `;

    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      currentImageUrl = result.localPath;

      // Display model info in the result
      if (result.model && result.userPlan) {
        console.log(
          `✅ Generated with ${result.model} for ${result.userPlan} user`
        );
      }

      displayOutput(result);
    } else {
      const outputArea = document.getElementById("output-area");
      outputArea.innerHTML = `
            <div class="output-placeholder" style="color: #d32f2f;">
              <p>❌ ${result.error || result.message}</p>
            </div>
          `;
      showToast("Lỗi: " + (result.error || result.message), 'error');
    }
  } catch (error) {
    console.error("Lỗi:", error);
    const outputArea = document.getElementById("output-area");
    outputArea.innerHTML = `
          <div class="output-placeholder" style="color: #d32f2f;">
            <p>❌ Lỗi khi tạo ảnh: ${error.message}</p>
          </div>
        `;
    showToast("Lỗi khi tạo ảnh: " + error.message, 'error');
  } finally {
    const generateBtn = document.getElementById("generate-btn");
    generateBtn.disabled = false;
    generateBtn.innerHTML = "<span></span>Tạo ảnh";
  }
}

async function proceedGenerateBackground() {
  if (!pendingGenerateData.extra.bgPrompt) {
    showToast("Dữ liệu không hợp lệ", 'error');
    return;
  }

  const bgPrompt = pendingGenerateData.extra.bgPrompt;

  closeConfirmDialog();

  const token = localStorage.getItem("token");

  // Get selected model from dropdown
  const bgModelTrigger = document.getElementById("bg-model-dropdown-trigger");
  const bgModelName = bgModelTrigger
    ? bgModelTrigger.dataset.selectedModel || "nano-banana"
    : "nano-banana";

  try {
    const bgGenerateBtn = document.getElementById("bg-generate-btn");
    bgGenerateBtn.disabled = true;
    bgGenerateBtn.innerHTML =
      "<span class='loading-spinner'></span>Đang xử lý...";

    const bgOutputArea = document.getElementById("bg-output-area");
    bgOutputArea.innerHTML = `
          <div class="loading-container">
            <div class="loading-spinner"></div>
          </div>
        `;

    const response = await fetch("/api/ai/generate-background", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: bgPrompt,
        model: bgModelName,
      }),
    });

    const result = await response.json();

    if (result.success) {
      // Display model info in the result
      if (result.model && result.userPlan) {
        console.log(
          `✅ Background generated with ${result.model} for ${result.userPlan} user`
        );
      }

      displayBgOutput(result);
    } else {
      const bgOutputArea = document.getElementById("bg-output-area");
      bgOutputArea.innerHTML = `
            <div class="output-placeholder" style="color: #d32f2f;">
              <p>❌ ${result.error || result.message}</p>
            </div>
          `;
      showToast("Lỗi: " + (result.error || result.message), 'error');
    }
  } catch (error) {
    console.error("Lỗi:", error);
    const bgOutputArea = document.getElementById("bg-output-area");
    bgOutputArea.innerHTML = `
          <div class="output-placeholder" style="color: #d32f2f;">
            <p>❌ Lỗi khi tạo bối cảnh: ${error.message}</p>
          </div>
        `;
    showToast("Lỗi khi tạo bối cảnh: " + error.message, 'error');
  } finally {
    const bgGenerateBtn = document.getElementById("bg-generate-btn");
    bgGenerateBtn.disabled = false;
    bgGenerateBtn.innerHTML = "<span></span>Tạo Bối Cảnh";
  }
}

async function proceedGenerateOutfit() {
  if (!pendingGenerateData.selectedFile) {
    showToast("Dữ liệu không hợp lệ", 'error');
    return;
  }

  const selectedFile = pendingGenerateData.selectedFile;
  const outfitType = pendingGenerateData.extra.outfitType;
  const outfitHairstyle = pendingGenerateData.extra.outfitHairstyle;
  const outfitDescription = pendingGenerateData.extra.outfitDescription;
  const clothingFile = pendingGenerateData.extra.clothingFile;

  closeConfirmDialog();

  const token = localStorage.getItem("token");

  // Get selected model from dropdown
  const outfitModelTrigger = document.getElementById(
    "outfit-model-dropdown-trigger"
  );
  const outfitModelName = outfitModelTrigger
    ? outfitModelTrigger.dataset.selectedModel || "nano-banana"
    : "nano-banana";

  const formData = new FormData();
  formData.append("type", outfitType);
  formData.append("hairstyle", outfitHairstyle);
  formData.append("description", outfitDescription);
  formData.append("image", selectedFile);
  formData.append("model", outfitModelName);
  if (clothingFile) {
    formData.append("clothing", clothingFile);
  }

  try {
    const outfitGenerateBtn = document.getElementById("outfit-generate-btn");
    outfitGenerateBtn.disabled = true;
    outfitGenerateBtn.innerHTML =
      "<span class='loading-spinner'></span>Đang xử lý...";

    const outfitOutputArea = document.getElementById("outfit-output-area");
    outfitOutputArea.innerHTML = `
          <div class="loading-container">
            <div class="loading-spinner"></div>
          </div>
        `;

    const response = await fetch("/api/ai/generate-outfit", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      // Display model info in the result
      if (result.model && result.userPlan) {
        console.log(
          `✅ Outfit generated with ${result.model} for ${result.userPlan} user`
        );
      }

      displayOutfitOutput(result);
    } else {
      const outfitOutputArea = document.getElementById("outfit-output-area");
      outfitOutputArea.innerHTML = `
            <div class="output-placeholder" style="color: #d32f2f;">
              <p>❌ ${result.error || result.message}</p>
            </div>
          `;
      showToast("Lỗi: " + (result.error || result.message), 'error');
    }
  } catch (error) {
    console.error("Lỗi:", error);
    const outfitOutputArea = document.getElementById("outfit-output-area");
    outfitOutputArea.innerHTML = `
          <div class="output-placeholder" style="color: #d32f2f;">
            <p>❌ Lỗi khi thay đổi trang phục: ${error.message}</p>
          </div>
        `;
    showToast("Lỗi khi thay đổi trang phục: " + error.message, 'error');
  } finally {
    const outfitGenerateBtn = document.getElementById("outfit-generate-btn");
    outfitGenerateBtn.disabled = false;
    outfitGenerateBtn.innerHTML = "<span></span>Thay Đổi";
  }
}

async function proceedGenerateTrending() {
  if (!pendingGenerateData.selectedFile || !window.currentTrend) {
    showToast("Dữ liệu không hợp lệ", 'error');
    return;
  }

  const selectedFile = pendingGenerateData.selectedFile;
  const currentTrend = window.currentTrend;
  const trendDescription = pendingGenerateData.extra.trendDescription;

  closeConfirmDialog();

  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("promptName", currentTrend.name);
  formData.append("image", selectedFile);
  if (trendDescription) {
    formData.append("description", trendDescription);
  }

  try {
    const trendGenerateBtn = document.getElementById("trend-generate-btn");
    trendGenerateBtn.disabled = true;
    trendGenerateBtn.innerHTML =
      "<span class='loading-spinner'></span>Đang xử lý...";

    const trendOutputArea = document.getElementById("trend-output-area");
    trendOutputArea.innerHTML = `
          <div class="loading-container">
            <div class="loading-spinner"></div>
          </div>
        `;

    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      displayTrendOutput(result);
    } else {
      const trendOutputArea = document.getElementById("trend-output-area");
      trendOutputArea.innerHTML = `
            <div class="output-placeholder" style="color: #d32f2f;">
              <p>❌ ${result.error || result.message}</p>
            </div>
          `;
      showToast("Lỗi: " + (result.error || result.message), 'error');
    }
  } catch (error) {
    console.error("Lỗi:", error);
    const trendOutputArea = document.getElementById("trend-output-area");
    trendOutputArea.innerHTML = `
          <div class="output-placeholder" style="color: #d32f2f;">
            <p> Lỗi khi tạo ảnh: ${error.message}</p>
          </div>
        `;
    showToast("Lỗi khi tạo ảnh: " + error.message, 'error');
  } finally {
    const trendGenerateBtn = document.getElementById("trend-generate-btn");
    trendGenerateBtn.disabled = false;
    trendGenerateBtn.innerHTML = "<span></span>Tạo ảnh";
  }
}
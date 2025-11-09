    let trendData = [];

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
          trendsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Không có trending prompts</p>';
          return;
        }

        trendsGrid.innerHTML = trendData.map((trend, index) => `
          <div class="trend-card" onclick="selectTrend(${index})">
            <div class="trend-image-wrapper">
              <img src="${trend.image || 'https://via.placeholder.com/300'}" alt="${trend.title}" class="trend-image">
              <div class="trend-overlay">
                <p>${trend.title}</p>
              </div>
            </div>
          </div>
        `).join("");
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

        // Setup upload area
        const uploadArea = document.getElementById("trend-upload-area");
        const fileInput = document.getElementById("trend-file-input");
        const chooseBtn = document.getElementById("trend-choose-btn");

        uploadArea.addEventListener("click", () => fileInput.click());
        chooseBtn.addEventListener("click", () => fileInput.click());

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
          if (file) handleTrendFile(file);
        });

        fileInput.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (file) handleTrendFile(file);
        });

        // Scroll to top
        window.scrollTo(0, 0);

        // Show notification
        const notification = document.createElement("div");
        notification.className = "trend-notification";
        notification.innerHTML = `
          <div class="notification-content">
            <strong>✨ ${trend.title}</strong> đã được chọn!
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
        window.trendSelectedFile = file;
        const uploadArea = document.getElementById("trend-upload-area");
        const reader = new FileReader();
        reader.onload = () => {
          uploadArea.innerHTML = `
            <img src="${reader.result}" 
              style="max-width:100%; border-radius:8px; display:block; margin:auto;">
          `;
        };
        reader.readAsDataURL(file);
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
              alert("Vui lòng chọn ảnh trước");
              return;
            }

            const additionalDesc = document.getElementById("trend-additional-desc").value;

            showConfirmDialog(null, window.trendSelectedFile, "trending", {
              trendDescription: additionalDesc
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
          downloadImage(result.localPath, `trend_${window.currentTrend.title}`);
      }

      function downloadImage(imagePath, name) {
        const link = document.createElement("a");
        link.href = imagePath;
        link.download = `${name}_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

      // Initialize on page load
      document.addEventListener("DOMContentLoaded", () => {
        loadTrendingPrompts();
      });

      // ASCII Art Generation
      const uploadArea = document.getElementById("upload-area");
      const fileInput = document.getElementById("file-input");
      const chooseBtn = document.getElementById("choose-btn");
      const promptSelect = document.getElementById("prompt-select");
      const generateBtn = document.getElementById("generate-btn");
      let selectedFile = null;

      uploadArea.addEventListener("click", () => fileInput.click());
      chooseBtn.addEventListener("click", () => fileInput.click());

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
            <img src="${reader.result}" 
              style="max-width:100%; border-radius:8px; display:block; margin:auto;">
          `;
        };
        reader.readAsDataURL(file);
      }

      // Load prompts từ API
      async function loadPrompts() {
        try {
          const response = await fetch("/api/prompts");
          const prompts = await response.json();
          promptSelect.innerHTML = '<option value="">Chọn chế độ ảnh</option>';
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
          alert("Vui lòng chọn ảnh trước");
          return;
        }
        if (!promptSelect.value) {
          alert("Vui lòng chọn chế độ ảnh");
          return;
        }

        showConfirmDialog(promptSelect.value, selectedFile, "faceImage", {
          promptSelect: promptSelect.value
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
        document.getElementById("output-prompt-name").textContent =
          result.promptName;
        document.getElementById("output-prompt-title").textContent =
          result.promptTitle;
        outputInfo.style.display = "block";

        // Hiển thị nút download
        downloadBtn.style.display = "flex";
        downloadBtn.onclick = () =>
          downloadImage(result.localPath, result.promptName);
      }

      // Download ảnh
      function downloadImage(imagePath, promptName) {
        const link = document.createElement("a");
        link.href = imagePath;
        link.download = `${promptName}_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Load prompts khi page load
      document.addEventListener("DOMContentLoaded", () => {
        loadPrompts();
      });

      // Background Image Generation
      const bgUploadArea = document.getElementById("bg-upload-area");
      const bgFileInput = document.getElementById("bg-file-input");
      const bgChooseBtn = document.getElementById("bg-choose-btn");
      const bgTypeSelect = document.getElementById("bg-type-select");
      const bgGenerateBtn = document.getElementById("bg-generate-btn");
      let bgSelectedFile = null;

      bgUploadArea.addEventListener("click", () => bgFileInput.click());
      bgChooseBtn.addEventListener("click", () => bgFileInput.click());

      bgUploadArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        bgUploadArea.style.borderColor = "#666";
      });

      bgUploadArea.addEventListener("dragleave", () => {
        bgUploadArea.style.borderColor = "#ccc";
      });

      bgUploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleBgFile(file);
      });

      bgFileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) handleBgFile(file);
      });

      function handleBgFile(file) {
        bgSelectedFile = file;
        const reader = new FileReader();
        reader.onload = () => {
          bgUploadArea.innerHTML = `
            <img src="${reader.result}" 
              style="max-width:100%; border-radius:8px; display:block; margin:auto;">
          `;
        };
        reader.readAsDataURL(file);
      }

      bgGenerateBtn.addEventListener("click", async () => {
        if (!checkAuthBeforeAction()) return;

        if (!bgSelectedFile) {
          alert("Vui lòng chọn ảnh trước");
          return;
        }
        if (!bgTypeSelect.value) {
          alert("Vui lòng chọn loại bối cảnh");
          return;
        }

        showConfirmDialog(null, bgSelectedFile, "background", {
          bgType: bgTypeSelect.value,
          bgDescription: document.getElementById("bg-description").value
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
          downloadImage(result.localPath, `background_${bgTypeSelect.value}`);
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
          outfitHairstyleSelect.innerHTML = '<option value="">Lỗi load dữ liệu</option>';
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

      outfitUploadArea.addEventListener("click", () => outfitFileInput.click());
      outfitChooseBtn.addEventListener("click", () => outfitFileInput.click());

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
            <img src="${reader.result}" 
              style="max-width:100%; border-radius:8px; display:block; margin:auto;">
          `;
        };
        reader.readAsDataURL(file);
      }

      // Clothing upload handlers
      clothingUploadArea.addEventListener("click", () => clothingFileInput.click());
      clothingChooseBtn.addEventListener("click", () => clothingFileInput.click());

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
            <img src="${reader.result}" 
              style="max-width:100%; border-radius:8px; display:block; margin:auto;">
          `;
        };
        reader.readAsDataURL(file);
      }

      outfitGenerateBtn.addEventListener("click", async () => {
        if (!checkAuthBeforeAction()) return;

        if (!outfitSelectedFile) {
          alert("Vui lòng chọn ảnh người trước");
          return;
        }

        if (!clothingSelectedFile) {
          if (!outfitGenderSelect.value) {
            alert("Vui lòng chọn giới tính");
            return;
          }
          if (!outfitTypeSelect.value || !outfitHairstyleSelect.value) {
            alert("Vui lòng chọn loại trang phục và kiểu tóc");
            return;
          }
        }

        const outfitDescription = document.getElementById("outfit-description").value;

        showConfirmDialog(null, outfitSelectedFile, "outfit", {
          outfitType: outfitTypeSelect.value,
          outfitHairstyle: outfitHairstyleSelect.value,
          outfitDescription: outfitDescription,
          clothingFile: clothingSelectedFile
        });
      });

      function displayOutfitOutput(result) {
        const outfitOutputArea = document.getElementById("outfit-output-area");
        const outfitDownloadBtn = document.getElementById(
          "outfit-download-btn"
        );

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
      type: "faceImage"
    };

    async function showConfirmDialog(promptName, file, type = "faceImage", extra = {}) {
      try {
        pendingGenerateData = { promptName, selectedFile: file, type, extra };
        
        const token = localStorage.getItem("token");
        let promptData = null;
        let fee = 0;
        
        const response = await fetch("/api/prompts", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const prompts = await response.json();
        promptData = prompts.find(p => p.name === promptName);
        
        if (!promptData) {
          const trendingResponse = await fetch("/api/prompts-trending", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const trendingPrompts = await trendingResponse.json();
          promptData = trendingPrompts.find(p => p.name === promptName);
        }
        
        if (type === "faceImage") {
          fee = promptData?.fee || 0;
        } else if (type === "outfit") {
          const configResponse = await fetch("/api/service-config/outfit", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const configData = await configResponse.json();
          fee = configData?.fee || 0;
        } else if (type === "background") {
          const configResponse = await fetch("/api/service-config/background", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const configData = await configResponse.json();
          fee = configData?.fee || 0;
        }
        
        const profileResponse = await fetch("/api/profile/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const profileData = await profileResponse.json();
        const balance = profileData.balance || 0;
        
        document.getElementById("confirmPrice").textContent = fee.toLocaleString() + " VND";
        document.getElementById("confirmBalance").textContent = balance.toLocaleString() + " VND";
        
        if (balance < fee) {
          document.getElementById("confirmBalance").style.color = "#d32f2f";
          document.querySelector(".btn-confirm").disabled = true;
        } else {
          document.getElementById("confirmBalance").style.color = "#10b981";
          document.querySelector(".btn-confirm").disabled = false;
        }
        
        const dialog = document.getElementById("confirmDialog");
        dialog.classList.remove("hidden");
      } catch (error) {
        console.error("Lỗi load thông tin giá:", error);
        alert("Lỗi khi tải thông tin giá");
      }
    }

    function closeConfirmDialog() {
      const dialog = document.getElementById("confirmDialog");
      dialog.classList.add("hidden");
      pendingGenerateData = { promptName: null, selectedFile: null, type: "faceImage" };
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
        alert("Dữ liệu không hợp lệ");
        return;
      }

      closeConfirmDialog();
      
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("promptName", pendingGenerateData.promptName);
      formData.append("image", pendingGenerateData.selectedFile);

      try {
        const generateBtn = document.getElementById("generate-btn");
        generateBtn.disabled = true;
        generateBtn.innerHTML = "<span class='loading-spinner'></span>Đang xử lý...";
        
        const outputArea = document.getElementById("output-area");
        outputArea.innerHTML = `
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">Đang tạo ảnh...</div>
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
          displayOutput(result);
        } else {
          const outputArea = document.getElementById("output-area");
          outputArea.innerHTML = `
            <div class="output-placeholder" style="color: #d32f2f;">
              <p>❌ ${result.error || result.message}</p>
            </div>
          `;
          alert("Lỗi: " + (result.error || result.message));
        }
      } catch (error) {
        console.error("Lỗi:", error);
        const outputArea = document.getElementById("output-area");
        outputArea.innerHTML = `
          <div class="output-placeholder" style="color: #d32f2f;">
            <p>❌ Lỗi khi tạo ảnh: ${error.message}</p>
          </div>
        `;
        alert("Lỗi khi tạo ảnh: " + error.message);
      } finally {
        const generateBtn = document.getElementById("generate-btn");
        generateBtn.disabled = false;
        generateBtn.innerHTML = "<span>✨</span>Tạo ảnh";
      }
    }

    async function proceedGenerateBackground() {
      if (!pendingGenerateData.selectedFile) {
        alert("Dữ liệu không hợp lệ");
        return;
      }

      closeConfirmDialog();
      
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("type", pendingGenerateData.extra.bgType);
      formData.append("description", pendingGenerateData.extra.bgDescription);
      formData.append("image", pendingGenerateData.selectedFile);

      try {
        const bgGenerateBtn = document.getElementById("bg-generate-btn");
        bgGenerateBtn.disabled = true;
        bgGenerateBtn.innerHTML = "<span class='loading-spinner'></span>Đang xử lý...";
        
        const bgOutputArea = document.getElementById("bg-output-area");
        bgOutputArea.innerHTML = `
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">Đang tạo bối cảnh...</div>
          </div>
        `;

        const response = await fetch("/api/ai/generate-background", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          displayBgOutput(result);
        } else {
          const bgOutputArea = document.getElementById("bg-output-area");
          bgOutputArea.innerHTML = `
            <div class="output-placeholder" style="color: #d32f2f;">
              <p>❌ ${result.error || result.message}</p>
            </div>
          `;
          alert("Lỗi: " + (result.error || result.message));
        }
      } catch (error) {
        console.error("Lỗi:", error);
        const bgOutputArea = document.getElementById("bg-output-area");
        bgOutputArea.innerHTML = `
          <div class="output-placeholder" style="color: #d32f2f;">
            <p>❌ Lỗi khi tạo bối cảnh: ${error.message}</p>
          </div>
        `;
        alert("Lỗi khi tạo bối cảnh: " + error.message);
      } finally {
        const bgGenerateBtn = document.getElementById("bg-generate-btn");
        bgGenerateBtn.disabled = false;
        bgGenerateBtn.innerHTML = "<span></span>Tạo Bối Cảnh";
      }
    }

    async function proceedGenerateOutfit() {
      if (!pendingGenerateData.selectedFile) {
        alert("Dữ liệu không hợp lệ");
        return;
      }

      closeConfirmDialog();
      
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("type", pendingGenerateData.extra.outfitType);
      formData.append("hairstyle", pendingGenerateData.extra.outfitHairstyle);
      formData.append("description", pendingGenerateData.extra.outfitDescription);
      formData.append("image", pendingGenerateData.selectedFile);
      if (pendingGenerateData.extra.clothingFile) {
        formData.append("clothing", pendingGenerateData.extra.clothingFile);
      }

      try {
        const outfitGenerateBtn = document.getElementById("outfit-generate-btn");
        outfitGenerateBtn.disabled = true;
        outfitGenerateBtn.innerHTML = "<span class='loading-spinner'></span>Đang xử lý...";

        const outfitOutputArea = document.getElementById("outfit-output-area");
        outfitOutputArea.innerHTML = `
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">Đang thay đổi trang phục...</div>
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
          displayOutfitOutput(result);
        } else {
          const outfitOutputArea = document.getElementById("outfit-output-area");
          outfitOutputArea.innerHTML = `
            <div class="output-placeholder" style="color: #d32f2f;">
              <p>❌ ${result.error || result.message}</p>
            </div>
          `;
          alert("Lỗi: " + (result.error || result.message));
        }
      } catch (error) {
        console.error("Lỗi:", error);
        const outfitOutputArea = document.getElementById("outfit-output-area");
        outfitOutputArea.innerHTML = `
          <div class="output-placeholder" style="color: #d32f2f;">
            <p>❌ Lỗi khi thay đổi trang phục: ${error.message}</p>
          </div>
        `;
        alert("Lỗi khi thay đổi trang phục: " + error.message);
      } finally {
        const outfitGenerateBtn = document.getElementById("outfit-generate-btn");
        outfitGenerateBtn.disabled = false;
        outfitGenerateBtn.innerHTML = "<span></span>Thay Đổi";
      }
    }

    async function proceedGenerateTrending() {
      if (!pendingGenerateData.selectedFile || !window.currentTrend) {
        alert("Dữ liệu không hợp lệ");
        return;
      }

      closeConfirmDialog();
      
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("promptName", window.currentTrend.name);
      formData.append("image", pendingGenerateData.selectedFile);
      if (pendingGenerateData.extra.trendDescription) {
        formData.append("description", pendingGenerateData.extra.trendDescription);
      }

      try {
        const trendGenerateBtn = document.getElementById("trend-generate-btn");
        trendGenerateBtn.disabled = true;
        trendGenerateBtn.innerHTML = "<span class='loading-spinner'></span>Đang xử lý...";

        const trendOutputArea = document.getElementById("trend-output-area");
        trendOutputArea.innerHTML = `
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">Đang tạo ảnh...</div>
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
          alert("Lỗi: " + (result.error || result.message));
        }
      } catch (error) {
        console.error("Lỗi:", error);
        const trendOutputArea = document.getElementById("trend-output-area");
        trendOutputArea.innerHTML = `
          <div class="output-placeholder" style="color: #d32f2f;">
            <p>❌ Lỗi khi tạo ảnh: ${error.message}</p>
          </div>
        `;
        alert("Lỗi khi tạo ảnh: " + error.message);
      } finally {
        const trendGenerateBtn = document.getElementById("trend-generate-btn");
        trendGenerateBtn.disabled = false;
        trendGenerateBtn.innerHTML = "<span>✨</span>Tạo ảnh";
      }
    }

const API_CONFIG = {
  getApiUrl: () => {
    const hostname = window.location.hostname;
    ư;
    if (hostname === "localhost") {
      return "http://localhost:5000";
    }
    if (
      hostname === "enternapic.io.vn" ||
      hostname === "www.enternapic.io.vn"
    ) {
      return "http://enternapic.io.vn:5000";
    }

    // Nếu truy cập bằng IP
    if (hostname === "103.77.215.231") {
      return "http://103.77.215.231:5000";
    }

    // Fallback
    return window.location.origin;
  },

  endpoint: (path) => {
    const base = API_CONFIG.getApiUrl();
    return base + (path.startsWith("/") ? path : "/" + path);
  },
};

const API_BASE_URL = API_CONFIG.getApiUrl();

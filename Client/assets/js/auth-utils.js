// Utility function để tự động refresh token khi hết hạn
async function getValidAccessToken() {
  let token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");

  if (!token || !refreshToken) {
    console.warn("No tokens found");
    return null;
  }

  try {
    // Decode token để check expiration
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiresIn = payload.exp * 1000; // Convert to ms
    const now = Date.now();
    const timeLeft = expiresIn - now;

    // Nếu token còn lại < 5 phút, refresh ngay
    if (timeLeft < 5 * 60 * 1000) {
      console.log("Access token expiring soon, refreshing...");
      const newToken = await refreshAccessToken(refreshToken);
      if (newToken) {
        localStorage.setItem("token", newToken);
        token = newToken;
      }
    }
  } catch (err) {
    console.error("Error checking token expiration:", err);
  }

  return token;
}

// Function để refresh access token
async function refreshAccessToken(refreshToken) {
  try {
    const response = await fetch("/auth/refresh-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Refresh token cũng hết hạn, cần login lại
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login.html";
        return null;
      }
      throw new Error("Failed to refresh token");
    }

    const data = await response.json();
    return data.accessToken;
  } catch (err) {
    console.error("Refresh token error:", err);
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login.html";
    return null;
  }
}

// Wrapper cho fetch API để tự động handle token refresh
async function fetchWithAuth(url, options = {}) {
  let token = await getValidAccessToken();

  if (!token) {
    throw new Error("No valid token available");
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  let response = await fetch(url, { ...options, headers });

  // Nếu 401 (token expired), thử refresh
  if (response.status === 401) {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      token = await refreshAccessToken(refreshToken);
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        response = await fetch(url, { ...options, headers });
      }
    }
  }

  return response;
}

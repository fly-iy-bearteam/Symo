document.addEventListener("DOMContentLoaded", () => {
  loadFiles();
  loadPosts();
  loadNotifications();
});

/* ========================================================
   1. CHUYỂN TAB & TẢI DỮ LIỆU TỰ ĐỘNG
   ======================================================== */
function switchTab(tabId, element) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
  
  document.getElementById(tabId).classList.add("active");
  element.classList.add("active");

  if (tabId === 'sec-notifications') loadNotifications();
  else if (tabId === 'sec-social') loadPosts();
  else if (tabId === 'sec-home') loadFiles();
}

/* ========================================================
   2. TẢI DANH SÁCH FILE & XỬ LÝ NÚT TẢI VỀ CHUẨN TRÌNH DUYỆT
   ======================================================== */
async function loadFiles() {
  const container = document.getElementById("files-list");
  if (!container) return;

  container.innerHTML = "<p class='loading'>Đang tải danh sách file...</p>";

  const { data, error } = await supabaseClient
    .from("files")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    container.innerHTML = "<p class='loading'>📭 Chưa có bộ file nào được cập nhật.</p>";
    return;
  }

  container.innerHTML = data.map(item => {
    let fileUrl = "#";
    try {
      if (typeof item.urls === "string" && item.urls.startsWith("[")) {
        const parsed = JSON.parse(item.urls);
        fileUrl = Array.isArray(parsed) ? parsed[0] : item.urls;
      } else {
        fileUrl = item.urls;
      }
    } catch (e) {
      fileUrl = item.urls;
    }

    return `
      <div class="card">
        <div class="card-header">
          <span class="card-title">${escapeHtml(item.name)}</span>
          <span class="badge">📦 File Tài Nguyên</span>
        </div>
        <p class="card-meta" style="margin-bottom:12px;">${escapeHtml(item.description) || "Bộ tài nguyên chất lượng cao."}</p>
        <a href="${fileUrl}" 
           download 
           target="_blank" 
           rel="noopener noreferrer" 
           class="btn btn-primary"
           style="text-decoration:none; text-align:center; display:block;">
          📥 Tải File Ngay
        </a>
      </div>
    `;
  }).join("");
}

/* ========================================================
   3. TẢI BÀI VIẾT SOCIAL KÈM AVATAR VÀ TÊN ADMIN
   ======================================================== */
async function loadPosts() {
  const container = document.getElementById("social-list");
  if (!container) return;

  container.innerHTML = "<p class='loading'>Đang tải bài viết...</p>";

  const { data: posts, error } = await supabaseClient
    .from("posts")
    .select(`
      *,
      profiles (
        display_name,
        avatar_url
      )
    `)
    .order("created_at", { ascending: false });

  if (error || !posts || posts.length === 0) {
    container.innerHTML = "<p class='loading'>📭 Chưa có bài viết nào.</p>";
    return;
  }

  container.innerHTML = "";
  posts.forEach(post => {
    const card = document.createElement("div");
    card.className = "card";

    const authorName = post.profiles?.display_name || "Admin Symo";
    const authorAvatar = post.profiles?.avatar_url || "https://via.placeholder.com/40";

    card.innerHTML = `
      <div class="post-author-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
        <img src="${authorAvatar}" 
             alt="Avatar Admin" 
             onerror="this.src='https://via.placeholder.com/40'"
             style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--primary);">
        <div>
          <div style="font-weight: bold; font-size: 0.95rem; color: var(--text-color);">${escapeHtml(authorName)}</div>
          <div class="card-meta" style="font-size: 0.75rem; color: var(--text-sub);">📅 ${new Date(post.created_at).toLocaleString("vi-VN")}</div>
        </div>
      </div>
    `;

    // 1. Văn bản bài viết
    if (post.content) {
      const textDiv = document.createElement("div");
      textDiv.className = "card-text";
      textDiv.textContent = post.content;
      card.appendChild(textDiv);
    }

    // 2. Ảnh bài viết
    if (post.image_url) {
      let url = post.image_url;
      if (url.startsWith("[")) {
        try { url = JSON.parse(url)[0]; } catch (e) {}
      }
      if (url) {
        const imgDiv = document.createElement("div");
        imgDiv.className = "card-media-single";
        imgDiv.innerHTML = `<img src="${url}" loading="lazy" alt="Ảnh bài viết" onerror="this.style.display='none'">`;
        card.appendChild(imgDiv);
      }
    }

    // 3. Video bài viết
    if (post.video_url) {
      const vidDiv = document.createElement("div");
      vidDiv.className = "card-media-single";
      vidDiv.innerHTML = `<video src="${post.video_url}" controls preload="metadata"></video>`;
      card.appendChild(vidDiv);
    }

    // 4. Liên kết đính kèm
    if (post.link_url) {
      const linkDiv = document.createElement("div");
      linkDiv.style.marginTop = "8px";
      linkDiv.innerHTML = `<a href="${encodeURI(post.link_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline">🔗 Mở liên kết</a>`;
      card.appendChild(linkDiv);
    }

    container.appendChild(card);
  });
}

/* ========================================================
   4. TẢI DANH SÁCH THÔNG BÁO
   ======================================================== */
async function loadNotifications() {
  const container = document.getElementById("notifications-list");
  if (!container) return;

  container.innerHTML = "<p class='loading'>Đang tải thông báo mới nhất...</p>";

  const { data, error } = await supabaseClient
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    container.innerHTML = "<p class='loading'>📭 Không có thông báo mới.</p>";
    return;
  }

  container.innerHTML = data.map(item => `
    <div class="card">
      <div class="card-header">
        <span class="card-title">🔔 ${escapeHtml(item.title)}</span>
        <span class="card-meta">${new Date(item.created_at).toLocaleDateString("vi-VN")}</span>
      </div>
      <p class="card-text">${escapeHtml(item.content)}</p>
    </div>
  `).join("");
}

/* ========================================================
   5. HÀM XỬ LÝ AN TOÀN CHUỖI VĂN BẢN (XSS Protection)
   ======================================================== */
function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

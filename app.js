document.addEventListener("DOMContentLoaded", () => {
  loadFiles();
  loadPosts();
  loadNotifications();
});

/* 1. CHUYỂN TAB & TẢI LẠI DỮ LIỆU TỰ ĐỘNG */
function switchTab(tabId, element) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
  
  document.getElementById(tabId).classList.add("active");
  element.classList.add("active");

  // Truy vấn dữ liệu mới nhất từ CSDL khi bấm chuyển Tab
  if (tabId === 'sec-notifications') {
    loadNotifications();
  } else if (tabId === 'sec-social') {
    loadPosts();
  } else if (tabId === 'sec-home') {
    loadFiles();
  }
}

/* 2. TẢI VÀ NÉN FILE ZIP CLIENT-SIDE */
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

  container.innerHTML = data.map(item => `
    <div class="card">
      <div class="card-header">
        <span class="card-title">${escapeHtml(item.name)}</span>
        <span class="badge">${item.png_count || 0} PNG</span>
      </div>
      <p class="card-meta" style="margin-bottom:10px;">${escapeHtml(item.description) || "Bộ tài nguyên PNG chất lượng cao."}</p>
      <button onclick="downloadZip('${escapeJsString(item.urls)}', '${item.png_count}')" class="btn btn-primary">
        📥 Tải ZIP (Symo-fan-${String(item.png_count).padStart(2, '0')}.zip)
      </button>
    </div>
  `).join("");
}

async function downloadZip(urlsJson, count) {
  try {
    const urls = JSON.parse(urlsJson);
    const zip = new JSZip();
    const zipFileName = `Symo-fan-${String(count).padStart(2, '0')}.zip`;

    alert("⚙️ Đang tiến hành đóng gói file ZIP, vui lòng đợi giây phút...");

    for (let i = 0; i < urls.length; i++) {
      const response = await fetch(urls[i]);
      const blob = await response.blob();
      zip.file(`image_${i + 1}.png`, blob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = zipFileName;
    a.click();
  } catch (err) {
    console.error("Lỗi tải zip:", err);
    alert("❌ Lỗi trong quá trình tạo file ZIP.");
  }
}

/* 3. TẢI BÀI VIẾT SOCIAL */
async function loadPosts() {
  const container = document.getElementById("social-list");
  if (!container) return;

  container.innerHTML = "<p class='loading'>Đang tải bài viết...</p>";

  const { data, error } = await supabaseClient
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    container.innerHTML = "<p class='loading'>📭 Chưa có bài viết nào.</p>";
    return;
  }

  container.innerHTML = "";
  data.forEach(post => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-header">
        <span class="card-meta">📅 ${new Date(post.created_at).toLocaleString("vi-VN")}</span>
      </div>
    `;

    if (post.content) {
      const textDiv = document.createElement("div");
      textDiv.className = "card-text";
      textDiv.textContent = post.content; // Chống XSS bằng textContent
      card.appendChild(textDiv);
    }

    if (post.image_url) {
      const imgDiv = document.createElement("div");
      imgDiv.className = "card-media";
      imgDiv.innerHTML = `<img src="${post.image_url}" loading="lazy" alt="Ảnh bài viết">`;
      card.appendChild(imgDiv);
    }

    if (post.video_url) {
      const vidDiv = document.createElement("div");
      vidDiv.className = "card-media";
      vidDiv.innerHTML = `<video src="${post.video_url}" controls preload="metadata"></video>`;
      card.appendChild(vidDiv);
    }

    if (post.link_url) {
      const linkDiv = document.createElement("div");
      linkDiv.style.marginTop = "8px";
      linkDiv.innerHTML = `<a href="${encodeURI(post.link_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline">🔗 Mở liên kết</a>`;
      card.appendChild(linkDiv);
    }

    container.appendChild(card);
  });
}

/* 4. TẢI THÔNG BÁO TỪ CSDL (MỚI NHẤT TRÊN CÙNG) */
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

/* HÀM HỖ TRỢ AN TOÀN CHUỖI */
function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeJsString(str) {
  if (!str) return "";
  return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

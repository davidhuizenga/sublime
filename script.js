(() => {
  const config = window.ANON_ROOM_CONFIG || {};
  const form = document.getElementById("post-form");
  const titleInput = document.getElementById("post-title");
  const bodyInput = document.getElementById("post-body");
  const count = document.getElementById("char-count");
  const message = document.getElementById("form-message");
  const postsEl = document.getElementById("posts");
  const submitButton = document.getElementById("submit-button");
  const refreshButton = document.getElementById("refresh-button");
  const telegramLink = document.getElementById("telegram-link");
  const hasConfig = () =>
    config.supabaseUrl &&
    config.supabaseAnonKey &&
    !config.supabaseUrl.includes("PASTE_YOUR") &&
    !config.supabaseAnonKey.includes("PASTE_YOUR");

  telegramLink.href = config.telegramUrl || "https://t.me/";
  bodyInput.addEventListener("input", () => {
    count.textContent = `${bodyInput.value.length} / 2000`;
  });

  function showMessage(text, type = "") {
    message.textContent = text;
    message.className = `form-message ${type}`;
  }

  function escapeText(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function timeAgo(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "just now";
    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  }

  function renderPosts(posts) {
    if (!posts.length) {
      postsEl.innerHTML = '<div class="empty-state"><div class="empty-icon">✳</div><h3>No posts yet.</h3><p>Be the first to share something with the community.</p></div>';
      return;
    }
    postsEl.innerHTML = posts.map((post) => {
      const title = (post.title || "").trim() || "Untitled thought";
      return `<article class="post-card">
        <div class="post-top"><h3>${escapeText(title)}</h3></div>
        <p class="post-body">${escapeText(post.body)}</p>
        <div class="post-meta"><span>Anonymous</span><span class="dot">•</span><time>${escapeText(timeAgo(post.created_at))}</time></div>
      </article>`;
    }).join("");
  }

  async function loadPosts() {
    if (!hasConfig()) {
      postsEl.innerHTML = '<div class="empty-state"><div class="empty-icon">⚙</div><h3>One quick setup step left.</h3><p>Follow README.md to connect Supabase. The live feed will load here when configured.</p></div>';
      return;
    }
    try {
      const url = `${config.supabaseUrl.replace(/\/$/, "")}/rest/v1/posts?select=id,title,body,created_at&order=created_at.desc&limit=50`;
      const response = await fetch(url, {
        headers: { apikey: config.supabaseAnonKey, Authorization: `Bearer ${config.supabaseAnonKey}` }
      });
      if (!response.ok) throw new Error("Could not load posts. Check your Supabase settings and SQL policies.");
      renderPosts(await response.json());
    } catch (error) {
      postsEl.innerHTML = `<div class="empty-state"><h3>Couldn't load the feed.</h3><p>${escapeText(error.message)} Try Refresh after checking your setup.</p></div>`;
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();
    if (!body) return showMessage("Please write something before publishing.", "error");
    if (body.length > 2000 || title.length > 90) return showMessage("Your post is longer than the allowed limit.", "error");
    if (!hasConfig()) return showMessage("The database isn't connected yet. Follow the setup guide in README.md.", "error");

    submitButton.disabled = true;
    submitButton.textContent = "Publishing…";
    showMessage("");
    try {
      const response = await fetch(`${config.supabaseUrl.replace(/\/$/, "")}/rest/v1/posts`, {
        method: "POST",
        headers: {
          apikey: config.supabaseAnonKey,
          Authorization: `Bearer ${config.supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify({ title: title || null, body })
      });
      if (!response.ok) {
        const details = await response.text();
        throw new Error(response.status === 429 ? "Too many requests. Please wait and try again." : `Publish failed (${response.status}). ${details.slice(0, 180)}`);
      }
      titleInput.value = "";
      bodyInput.value = "";
      count.textContent = "0 / 2000";
      showMessage("Your post is live. Thanks for sharing.", "success");
      await loadPosts();
      document.getElementById("latest").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      showMessage(error.message || "Something went wrong. Please try again.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = 'Publish post <span aria-hidden="true">↗</span>';
    }
  });

  refreshButton.addEventListener("click", loadPosts);
  loadPosts();
})();

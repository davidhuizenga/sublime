
(() => {
  const config = window.ANON_ROOM_CONFIG || {};
  const $ = id => document.getElementById(id);

  const posts = $("posts");
  const backdrop = $("backdrop");
  const body = $("body");
  const file = $("photo");
  const preview = $("preview");
  const previewImg = $("preview-img");
  const message = $("message");
  const publish = $("publish");

  const ready = () =>
    config.supabaseUrl &&
    config.supabaseAnonKey &&
    !config.supabaseUrl.includes("PASTE_YOUR") &&
    !config.supabaseAnonKey.includes("PASTE_YOUR");

  const base = () => config.supabaseUrl.replace(/\/$/, "");

  const headers = () => ({
    apikey: config.supabaseAnonKey,
    Authorization: `Bearer ${config.supabaseAnonKey}`
  });

  let selected = null;

  const safe = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  const say = (text, success = false) => {
    message.textContent = text;
    message.style.color = success ? "#a8e6c2" : "#ff9999";
  };

  $("open").onclick = () => {
    backdrop.hidden = false;
    body.focus();
  };

  $("close").onclick = () => backdrop.hidden = true;

  backdrop.onclick = event => {
    if (event.target === backdrop) backdrop.hidden = true;
  };

  document.onkeydown = event => {
    if (event.key === "Escape") backdrop.hidden = true;
  };

  body.oninput = () => {
    $("count").textContent = `${body.value.length} / 5000`;
  };

  file.onchange = () => {
    const image = file.files?.[0];
    if (!image) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(image.type)) {
      say("Choose a JPG, PNG, WEBP, or GIF image.");
      file.value = "";
      return;
    }

    if (image.size > 5 * 1024 * 1024) {
      say("Images must be 5 MB or smaller.");
      file.value = "";
      return;
    }

    selected = image;
    previewImg.src = URL.createObjectURL(image);
    preview.hidden = false;
    say("", true);
  };

  $("remove").onclick = () => {
    if (previewImg.src.startsWith("blob:")) {
      URL.revokeObjectURL(previewImg.src);
    }

    selected = null;
    file.value = "";
    preview.hidden = true;
    previewImg.removeAttribute("src");
  };

  async function load() {
    if (!ready()) {
      posts.innerHTML = '<div class="empty">Connect Supabase in config.js to load the feed.</div>';
      return;
    }

    try {
      const response = await fetch(
        `${base()}/rest/v1/posts?select=id,body,image_path,created_at&order=created_at.desc&limit=100`,
        { headers: headers() }
      );

      if (!response.ok) throw Error(`Feed error (${response.status})`);

      const data = await response.json();

      if (!data.length) {
        posts.innerHTML = '<div class="empty">Nothing here yet. Leave the first message.</div>';
        return;
      }

      const imageBase = `${base()}/storage/v1/object/public/anon-images/`;

      posts.innerHTML = data.map(post => `
        <article class="post">
          <p class="post-text">${safe(post.body)}</p>
          ${post.image_path ? `
            <img class="post-image"
              src="${imageBase}${encodeURIComponent(post.image_path)}"
              alt="Image attached to anonymous post"
              loading="lazy">
          ` : ""}
          <div class="meta">
            <b>ANON</b>
            <span>/</span>
            <time>${safe(new Intl.DateTimeFormat(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit"
            }).format(new Date(post.created_at)))}</time>
          </div>
        </article>
      `).join("");

    } catch (error) {
      posts.innerHTML = `<div class="empty">${safe(error.message)}. Check Supabase setup.</div>`;
    }
  }

  $("form").onsubmit = async event => {
    event.preventDefault();

    if (!ready()) return say("Connect Supabase first in config.js.");

    const text = body.value.trim();

    if (!text && !selected) {
      return say("Write something or attach a picture.");
    }

    publish.disabled = true;
    publish.textContent = "Publishing…";

    try {
      let imagePath = null;

      if (selected) {
        const extension = (selected.name.split(".").pop() || "jpg")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");

        imagePath = `${crypto.randomUUID()}.${extension}`;

        const upload = await fetch(
          `${base()}/storage/v1/object/anon-images/${imagePath}`,
          {
            method: "POST",
            headers: {
              ...headers(),
              "Content-Type": selected.type
            },
            body: selected
          }
        );

        if (!upload.ok) {
          throw Error(`Image upload failed (${upload.status}). Check storage policies.`);
        }
      }

      const response = await fetch(`${base()}/rest/v1/posts`, {
        method: "POST",
        headers: {
          ...headers(),
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          body: text,
          image_path: imagePath
        })
      });

      if (!response.ok) {
        throw Error(`Post failed (${response.status}). Check database policies.`);
      }

      body.value = "";
      $("count").textContent = "0 / 5000";

      if (previewImg.src.startsWith("blob:")) {
        URL.revokeObjectURL(previewImg.src);
      }

      selected = null;
      file.value = "";
      preview.hidden = true;
      previewImg.removeAttribute("src");

      say("Posted.", true);
      await load();

      setTimeout(() => {
        backdrop.hidden = true;
        say("", true);
      }, 650);

      scrollTo({ top: 0, behavior: "smooth" });

    } catch (error) {
      say(error.message);

    } finally {
      publish.disabled = false;
      publish.textContent = "Publish anonymously ↗";
    }
  };

  load();
  setInterval(load, 30000);
})();


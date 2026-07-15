// ========================================== API CONFIGURATION ==========================================
const API_URL = "media_data.js";

let galleries = { ugc: [], videos: [], static: [] };

// ========================================== DOM ELEMENTS ==========================================
// Gallery Modal Elements
const modal = document.querySelector('.gallery-modal');
const grid = document.querySelector('#media-grid');
const title = document.querySelector('#gallery-title');

// Lightbox Modal Elements
const lightbox = document.querySelector('.lightbox');
const lightboxContent = document.querySelector('#lightbox-content');

// Helper to determine if a file is a video
const isVideo = (src) => /\.(mp4|mov)$/i.test(src);

// ========================================== LIGHTBOX FUNCTIONS ==========================================
// Open Lightbox for media
function openLightbox(src, isVideo, isPortrait = false) {
  if (isVideo) {
    const klass = isPortrait ? 'class="portrait-video"' : '';
    // Show standard video player for direct Dropbox media link
    lightboxContent.innerHTML = `<video src="${src}" ${klass} controls autoplay loop playsinline width="100%" height="100%"></video>`;
  } else {
    lightboxContent.innerHTML = `<img src="${src}" alt="Enlarged BY ZIRU work">`;
  }
  lightbox.showModal();
}

// ========================================== INITIALIZE SYSTEM ==========================================
function initializePortfolio() {
  // Set main card covers and handle category clicks to generate gallery grid
  document.querySelectorAll('[data-gallery]').forEach(card => {
    const key = card.dataset.gallery;
    const items = galleries[key];
    if (!items || items.length === 0) return;
    
    // (The card covers are written directly in HTML so they loop/autoplay natively)

    card.addEventListener('click', () => {
      title.textContent = card.querySelector('strong').textContent.replace(/\n/g, ' ');
      
      // Generate grid markup dynamically (videos use fast image thumbnails + play icons)
      grid.innerHTML = items.map((file, i) => {
        let mediaHtml;
        if (file.isVideo) {
          const isVideoUrl = file.thumbnail && (/\.(mp4|mov)/i.test(file.thumbnail) || file.thumbnail.includes('.mp4?') || file.thumbnail.includes('.mov?'));
          if (isVideoUrl) {
            mediaHtml = `<div class="media-container video-item"><video src="${file.thumbnail}#t=0.001" preload="metadata" muted playsinline></video></div>`;
          } else {
            mediaHtml = `<div class="media-container video-item"><img src="${file.thumbnail}" alt="${title.textContent} work ${i + 1}" loading="lazy" onerror="this.onerror=null; this.src='https://placehold.co/600x600/101010/e00d18?text=Play+Video';"></div>`;
          }
        } else {
          mediaHtml = `<img src="${file.src}" alt="${title.textContent} work ${i + 1}" loading="lazy" onerror="this.onerror=null; this.src='https://placehold.co/600x600/101010/e00d18?text=Image';">`;
        }
        return `
        <figure data-src="${file.src}" data-video="${file.isVideo}">
          ${mediaHtml}
        </figure>
        `;
      }).join('');
      
      // Add click triggers on newly created figures to open lightbox
      grid.querySelectorAll('figure').forEach((item, index) => {
        item.addEventListener('click', () => {
          const src = item.dataset.src;
          const isVid = item.dataset.video === 'true';
          const file = items[index];
          const name = file ? file.name.toLowerCase() : '';
          // Detect landscape videos vs portrait videos
          const isLandscape = name.includes('dooh') || name.includes('hoh') || name.includes('teaser') || name.includes('0529') || name.includes('interview');
          const isPortraitVideo = isVid && (key === 'ugc' || !isLandscape);
          openLightbox(src, isVid, isPortraitVideo);
        });
      });
      
      modal.showModal();
    });
  });
}

// ========================================== LOAD MEDIA DATA ==========================================
function loadGalleries() {
  const data = JSON.parse(JSON.stringify(window.portfolioData || galleries));
  const pathPrefix = API_URL.includes("../") ? "../" : "";
  
  // Normalize paths if they are local relative paths
  for (const categoryKey in data) {
    data[categoryKey] = data[categoryKey].map(file => {
      if (file.src && file.src.startsWith("Files/")) {
        file.src = pathPrefix + file.src;
      }
      if (file.thumbnail && file.thumbnail.startsWith("Files/")) {
        file.thumbnail = pathPrefix + file.thumbnail;
      }
      return file;
    });
  }

  galleries = data;

  // Dynamically set category card cover sources from fetched data
  // UGC Card (Heypresso Coffee Machine Ad.mp4)
  const ugcVideo = data.ugc.find(f => f.name === "Heypresso Coffee Machine Ad.mp4");
  if (ugcVideo) {
    const el = document.querySelector('.category-ugc video');
    if (el) el.src = ugcVideo.src;
  }
  
  // Videos Card (w.mp4)
  const videosVideo = data.videos.find(f => f.name === "w.mp4");
  if (videosVideo) {
    const el = document.querySelector('.category-card[data-gallery="videos"] video');
    if (el) el.src = videosVideo.src;
  }
  
  // Static Posts Card (ramadhan.png)
  const staticImg = data.static.find(f => f.name === "ramadhan.png");
  if (staticImg) {
    const el = document.querySelector('.category-card[data-gallery="static"] img');
    if (el) el.src = staticImg.src;
  }

  initializePortfolio();
}

loadGalleries();

// ========================================== MODAL CLOSE EVENT HANDLERS ==========================================
// Close Gallery Modal handlers
document.querySelector('.close-modal').addEventListener('click', () => modal.close());

modal.addEventListener('click', event => {
  if (event.target === modal) modal.close();
});

modal.addEventListener('close', () => {
  grid.innerHTML = ''; // Clear the grid to free up memory
});

// Close Lightbox Modal handlers
document.querySelector('.close-lightbox').addEventListener('click', () => lightbox.close());

lightbox.addEventListener('click', event => {
  if (event.target === lightbox) lightbox.close();
});

lightbox.addEventListener('close', () => {
  lightboxContent.innerHTML = ''; // Clear media when closing lightbox to stop playback
});

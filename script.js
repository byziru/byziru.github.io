// ========================================== API CONFIGURATION ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbzHtufV6mmdda-225P6WCxa_TYap2R1rF-avwlSAFLMZ0BOqRQ1e-uTqe54TYF4oPSbSg/exec";

let galleries = { ugc: [], videos: [], static: [] };

// ========================================== DOM ELEMENTS ==========================================
// Gallery Modal Elements
const modal = document.querySelector('.gallery-modal');
const grid = document.querySelector('#media-grid');
const title = document.querySelector('#gallery-title');

// Lightbox Modal Elements
const lightbox = document.querySelector('.lightbox');
const lightboxContent = document.querySelector('#lightbox-content');

// ========================================== LIGHTBOX FUNCTIONS ==========================================
// Open Lightbox for media
function openLightbox(fileId, isVideo, isPortrait = false) {
  if (isVideo) {
    const klass = isPortrait ? 'class="portrait-iframe"' : '';
    // Show Google Drive's built-in preview player in a responsive iframe
    lightboxContent.innerHTML = `<iframe src="https://drive.google.com/file/d/${fileId}/preview" ${klass} width="100%" height="100%" allow="autoplay" frameborder="0"></iframe>`;
  } else {
    lightboxContent.innerHTML = `<img src="https://lh3.googleusercontent.com/d/${fileId}" alt="Enlarged BY ZIRU work">`;
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
        const mediaHtml = file.isVideo 
          ? `<div class="media-container video-item"><img src="https://drive.google.com/thumbnail?id=${file.id}" alt="${title.textContent} work ${i + 1}" loading="lazy" onerror="this.onerror=null; this.src='https://placehold.co/600x600/101010/e00d18?text=Play+Video';"></div>`
          : `<img src="https://lh3.googleusercontent.com/d/${file.id}" alt="${title.textContent} work ${i + 1}" loading="lazy" onerror="this.onerror=null; this.src='https://placehold.co/600x600/101010/e00d18?text=Image';">`;
        return `
        <figure data-id="${file.id}" data-video="${file.isVideo}">
          ${mediaHtml}
        </figure>
        `;
      }).join('');
      
      // Add click triggers on newly created figures to open lightbox
      grid.querySelectorAll('figure').forEach((item, index) => {
        item.addEventListener('click', () => {
          const id = item.dataset.id;
          const isVid = item.dataset.video === 'true';
          const file = items[index];
          const name = file ? file.name.toLowerCase() : '';
          // Detect landscape videos vs portrait videos
          const isLandscape = name.includes('dooh') || name.includes('hoh') || name.includes('teaser') || name.includes('0529') || name.includes('interview');
          const isPortraitVideo = isVid && (key === 'ugc' || !isLandscape);
          openLightbox(id, isVid, isPortraitVideo);
        });
      });
      
      modal.showModal();
    });
  });
}

// ========================================== FETCH LIVE MEDIA DATA ==========================================
fetch(API_URL)
  .then(res => res.json())
  .then(data => {
    galleries = data;
    initializePortfolio();
  })
  .catch(err => {
    console.error("Failed to load portfolio media from Google Drive:", err);
  });

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

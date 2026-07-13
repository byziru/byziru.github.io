// ========================================== GALLERY DATA & IMAGES ==========================================
const galleries = {
  // UGC Talent
  ugc: [
    'Files/Talent/Heypresso Coffee Machine Ad.mp4',
    'Files/Talent/Father_s Day Heypresso Coffee Machine.mov',
    'Files/Talent/Ramadhan Nutriblend Ad.MOV',
    'Files/Talent/Vitamin C Filled Morning with Yuzu.mov',
    'Files/Talent/04.Marketing Suruh buat 1000 content.mov',
    'Files/Talent/make mocktail with me.mov',
    'Files/Talent/Perut Tak Selesa film.mp4',
    'Files/Talent/Jaya Grocer.mov'
  ],
  // Moving Stories / Videos
  videos: [
    'Files/Videos/w.mp4',
    'Files/Videos/Heypresso Coffee Machine Ad.mov',
    'Files/Videos/Comedy Ad for Blender.mov',
    'Files/Videos/Cucumber Lemonade.mov',
    'Files/Videos/Heypresso Conversion Video.mov',
    'Files/Videos/How does Heypresso Work.mov',
    'Files/Videos/HiJug Max Dropshipping.mov',
    'Files/Videos/Blue Spirulina Smoothie.mov',
    'Files/Videos/blue spirulina AI.mov',
    'Files/Videos/GreenWeightLoss.mov',
    'Files/Videos/03.Interview Pt2.mov',
    'Files/Videos/04.Tastetest.mov',
    'Files/Videos/03.Interview Pt1 (1).mov',
    'Files/Videos/10.PCV PA (not post on TikTok.mov',
    'Files/Videos/Vitamin C Filled Morning with Yuzu.mov',
    'Files/Videos/03.Interview Pt1.mov',
    'Files/Videos/02.BaristaMaking.mov',
    'Files/Videos/04.Marketing Suruh buat 1000 content.mov',
    'Files/Videos/DOOH Visual Maluri(Surya Malaysia).mp4',
    'Files/Videos/Third Mile Rush teaser.mov',
    'Files/Videos/HOH Overview.mov',
    'Files/Videos/make mocktail with me.mov',
    'Files/Videos/Perut Tak Selesa film.mp4',
    'Files/Videos/Jaya Grocer.mov',
    'Files/Videos/0529.mp4',
    'Files/Videos/clean making pomegranate.mov',
    'Files/Videos/Maggi Goreng Food Hook .mov',
    'Files/Videos/Maggi Goreng Food Hook.mov',
    'Files/Videos/Draft POV Promoter.mov',
    'Files/Videos/Digestion Problem UGC.mov',
    'Files/Videos/AGC Nibbs 1.mov'
  ],
  // Static Posts / Still Loud
  static: [
    'Files/Static Posts/How to use ACV.png',
    'Files/Static Posts/TMRF.png',
    'Files/Static Posts/ramadhan.png',
    'Files/Static Posts/Hari Raya Aidiladha.png',
    'Files/Static Posts/Flavours.png',
    'Files/Static Posts/Halal.png',
    'Files/Static Posts/FIFA with Dad Hook 2.png',
    'Files/Static Posts/Roti Canai.png',
    'Files/Static Posts/Template.png',
    'Files/Static Posts/77.png',
    'Files/Static Posts/Terima Kaish NU Sentral.png',
    'Files/Static Posts/Sunway Multicare.png'
  ]
};

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
function openLightbox(src) {
  if (isVideo(src)) {
    lightboxContent.innerHTML = `<video src="${src}" controls autoplay playsinline></video>`;
  } else {
    lightboxContent.innerHTML = `<img src="${src}" alt="Enlarged BY ZIRU work">`;
  }
  lightbox.showModal();
}

// ========================================== INTERACTION EVENT LISTENERS ==========================================

// Set main card covers and handle category clicks to generate gallery grid
document.querySelectorAll('[data-gallery]').forEach(card => {
  const key = card.dataset.gallery;
  const coverSrc = galleries[key][0];
  
  // Create video or img tag for the card cover
  const oldMedia = card.querySelector('img, video');
  if (oldMedia) {
    if (isVideo(coverSrc)) {
      if (oldMedia.tagName.toLowerCase() !== 'video') {
        const vid = document.createElement('video');
        vid.src = coverSrc;
        vid.muted = true;
        vid.loop = true;
        vid.autoplay = true;
        vid.playsInline = true;
        if (oldMedia.className) vid.className = oldMedia.className;
        vid.setAttribute('alt', oldMedia.getAttribute('alt') || '');
        card.replaceChild(vid, oldMedia);
      } else {
        oldMedia.src = coverSrc;
      }
    } else {
      if (oldMedia.tagName.toLowerCase() !== 'img') {
        const img = document.createElement('img');
        img.src = coverSrc;
        if (oldMedia.className) img.className = oldMedia.className;
        img.setAttribute('alt', oldMedia.getAttribute('alt') || '');
        card.replaceChild(img, oldMedia);
      } else {
        oldMedia.src = coverSrc;
      }
    }
  }

  card.addEventListener('click', () => {
    title.textContent = card.querySelector('strong').textContent.replace(/\n/g, ' ');
    
    // Generate grid markup dynamically
    grid.innerHTML = galleries[key].map((src, i) => {
      const mediaHtml = isVideo(src) 
        ? `<video src="${src}#t=0.001" muted playsinline preload="metadata"></video>`
        : `<img src="${src}" alt="${title.textContent} work ${i + 1}" loading="lazy">`;
      return `
      <figure data-src="${src}">
        ${mediaHtml}
      </figure>
      `;
    }).join('');
    
    // Add click triggers on newly created figures to open lightbox
    grid.querySelectorAll('figure').forEach(item => {
      item.addEventListener('click', () => openLightbox(item.dataset.src));
    });
    
    modal.showModal();
  });
});

// Close Gallery Modal handlers
document.querySelector('.close-modal').addEventListener('click', () => modal.close());

modal.addEventListener('click', event => {
  if (event.target === modal) modal.close();
});

modal.addEventListener('close', () => {
  grid.innerHTML = ''; // Clear the grid to free up massive memory from video tags
});

// Close Lightbox Modal handlers
document.querySelector('.close-lightbox').addEventListener('click', () => lightbox.close());

lightbox.addEventListener('click', event => {
  if (event.target === lightbox) lightbox.close();
});

lightbox.addEventListener('close', () => {
  lightboxContent.innerHTML = ''; // Clear media when closing lightbox to stop playback
});

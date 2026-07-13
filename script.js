// ========================================== GALLERY DATA & IMAGES ==========================================
const galleries = {
  // UGC Talent Images
  ugc: [
    'https://instagram.fszb2-1.fna.fbcdn.net/v/t51.82787-15/702910476_17947078788078318_4612554982588152110_n.jpg?stp=dst-jpg_e15_tt6&_nc_cat=107&ig_cache_key=MzkwMjM5ODAwMzk3ODE0ODM5NzE3OTQ3MDc4NzgyMDc4MzE4.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNMSVBTLnhwaWRzLjU0MC5zZHIudmlkZW9fZGVmYXVsdF9jb3Zlcl9mcmFtZS5DMyJ9&_nc_ohc=jrvy2MnHCLIQ7kNvwGjCKOI&_nc_oc=AdqlV48amPvNsZC0iEGbDtwaX5PpK4Q2a4CAeYrt8yXHX44gyQ92sAKlAl3iXukiw0I&_nc_ad=z-m&_nc_cid=1213&_nc_zt=23&_nc_ht=instagram.fszb2-1.fna&_nc_gid=WztrdoIKuVBK9YkGCXNRDw&_nc_ss=7a22e&oh=00_AQDIXrdIZd6R5g6acbtdGuATaJisLiTEdr3e8YgArDm6ew&oe=6A5A35D4',
    'https://instagram.fszb2-1.fna.fbcdn.net/v/t51.71878-15/705938940_1717721739673732_7711951157124373396_n.jpg?stp=dst-jpg_e15_tt6&_nc_cat=100&ig_cache_key=MzkwNDA4NDU2NTkzNzgzMjkyMA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNMSVBTLnhwaWRzLjY0MC5zZHIudmlkZW9fbmZyYW1lX2NvdmVyX2ZyYW1lLkMzIn0&_nc_ohc=_x5SLcq6QPAQ7kNvwH1EcgM&_nc_oc=AdqK1dJRYD1QlkdGrWpzVRaI9KE0w3egHRq5Amj-ujJ5AxZZVKYQpnb3u0wk034vWYo&_nc_ad=z-m&_nc_cid=1213&_nc_zt=23&_nc_ht=instagram.fszb2-1.fna&_nc_gid=WztrdoIKuVBK9YkGCXNRDw&_nc_ss=7a22e&oh=00_AQCJ0nRdE_VHiIQ3vwsjuHQMtwbMIdpaX4jY8Iy3VsRtkQ&oe=6A5A338D'
  ],
  // Moving Stories / Videos Images
  videos: [
    'https://instagram.fszb2-1.fna.fbcdn.net/v/t51.82787-15/709882764_17948035866078318_725004733280097393_n.jpg?stp=dst-jpg_e15_tt6&_nc_cat=108&ig_cache_key=MzkwODMzMzU1OTcxNTQ0NDQwNQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuNzIwLnNkci52aWRlb19kZWZhdWx0X2NvdmVyX2ZyYW1lLkMzIn0%3D&_nc_ohc=LisU3a06jOEQ7kNvwE2I8b1&_nc_oc=AdoWhOP3TCCdC0_I6BADqFXZzKnFizilNgFSS2-NtBq2i0jcAXVb1C435gMwwGl-Nv4&_nc_ad=z-m&_nc_cid=1213&_nc_zt=23&_nc_ht=instagram.fszb2-1.fna&_nc_gid=WztrdoIKuVBK9YkGCXNRDw&_nc_ss=7a22e&oh=00_AQD7q4373HyZhzgrqs-X6JuCtWk6RvJV3H-QNqz0XGM9XQ&oe=6A5A387F',
    'https://instagram.fszb2-1.fna.fbcdn.net/v/t51.71878-15/705938940_1717721739673732_7711951157124373396_n.jpg?stp=dst-jpg_e15_tt6&_nc_cat=100&ig_cache_key=MzkwNDA4NDU2NTkzNzgzMjkyMA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNMSVBTLnhwaWRzLjY0MC5zZHIudmlkZW9fbmZyYW1lX2NvdmVyX2ZyYW1lLkMzIn0&_nc_ohc=_x5SLcq6QPAQ7kNvwH1EcgM&_nc_oc=AdqK1dJRYD1QlkdGrWpzVRaI9KE0w3egHRq5Amj-ujJ5AxZZVKYQpnb3u0wk034vWYo&_nc_ad=z-m&_nc_cid=1213&_nc_zt=23&_nc_ht=instagram.fszb2-1.fna&_nc_gid=WztrdoIKuVBK9YkGCXNRDw&_nc_ss=7a22e&oh=00_AQCJ0nRdE_VHiIQ3vwsjuHQMtwbMIdpaX4jY8Iy3VsRtkQ&oe=6A5A338D',
    'https://instagram.fszb2-1.fna.fbcdn.net/v/t51.82787-15/702910476_17947078788078318_4612554982588152110_n.jpg?stp=dst-jpg_e15_tt6&_nc_cat=107&ig_cache_key=MzkwMjM5ODAwMzk3ODE0ODM5NzE3OTQ3MDc4NzgyMDc4MzE4.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNMSVBTLnhwaWRzLjU0MC5zZHIudmlkZW9fZGVmYXVsdF9jb3Zlcl9mcmFtZS5DMyJ9&_nc_ohc=jrvy2MnHCLIQ7kNvwGjCKOI&_nc_oc=AdqlV48amPvNsZC0iEGbDtwaX5PpK4Q2a4CAeYrt8yXHX44gyQ92sAKlAl3iXukiw0I&_nc_ad=z-m&_nc_cid=1213&_nc_zt=23&_nc_ht=instagram.fszb2-1.fna&_nc_gid=WztrdoIKuVBK9YkGCXNRDw&_nc_ss=7a22e&oh=00_AQDIXrdIZd6R5g6acbtdGuATaJisLiTEdr3e8YgArDm6ew&oe=6A5A35D4'
  ],
  // Static Posts / Still Loud Images
  static: [
    'https://instagram.fszb2-1.fna.fbcdn.net/v/t51.82787-15/684693173_17945274372078318_1034137597458539325_n.webp?_nc_cat=101&ig_cache_key=Mzg5MDc3ODEwNjMyODQ2MDcwNQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=PguMCNKSg2wQ7kNvwFA_Ko&_nc_oc=AdpujjlvfEzgZjHkfTop0Qhx8Rfu2FI1jlbCEmi4DGiz-lCZukHek7tIkwB-NMiP0rg&_nc_ad=z-m&_nc_cid=1213&_nc_zt=23&_nc_ht=instagram.fszb2-1.fna&_nc_gid=WztrdoIKuVBK9YkGCXNRDw&_nc_ss=7a22e&oh=00_AQDPbjdK_1acYsC5Gm8PcYefyoi122ETtxG4D-jilVs6bw&oe=6A5A3D43',
    'https://instagram.fszb2-1.fna.fbcdn.net/v/t51.82787-15/573677096_17927019699078318_772947377581211212_n.webp?_nc_cat=103&ig_cache_key=Mzc1NzY1MDE0MDkxNzM1NzYzMA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=0NFDtMzkUZIQ7kNvwFGdjiw&_nc_oc=AdrUN8l3fSBtns2qma9j7aFIIVRR-4x5SNKHPIkhtRyOYvGx1roU7UlVjYqd4wboJRc&_nc_ad=z-m&_nc_cid=1213&_nc_zt=23&_nc_ht=instagram.fszb2-1.fna&_nc_gid=WztrdoIKuVBK9YkGCXNRDw&_nc_ss=7a22e&oh=00_AQCQdF0ZnQwjWIGl71Fm6vjmrDtfovxP3yGcs8gVnoqv_Q&oe=6A5A50D6',
    'https://instagram.fszb2-1.fna.fbcdn.net/v/t51.82787-15/572553692_17927014095078318_8965812435134238395_n.webp?_nc_cat=104&ig_cache_key=Mzc1NzYwMjgwNTU0NTkwMzUxOQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=Iu4pMt-Te34Q7kNvwErcpJ-&_nc_oc=AdoLQ1pQs4MyvWGkrdJjuCQj5xJL7zd6Fy-7Yrn_oqaZcBUfySaMtxLIQRnZwmeg-nQ&_nc_ad=z-m&_nc_cid=1213&_nc_zt=23&_nc_ht=instagram.fszb2-1.fna&_nc_gid=WztrdoIKuVBK9YkGCXNRDw&_nc_ss=7a22e&oh=00_AQCtgVFFTWs3zgiHriwPA8xvjWLLUYG1-WGt_A0wfyWbgg&oe=6A5A4BA9'
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

// ========================================== VIDEO EMBED LINKS ==========================================
// Instagram Reel embeds mapped to the Videos gallery items
const videoEmbeds = [
  'https://www.instagram.com/reel/DYuGDpdz0PY/embed/',
  'https://www.instagram.com/reel/DYoGk8PT5ot/embed/',
  'https://www.instagram.com/reel/DYuGDpdz0PY/embed/'
];

// ========================================== LIGHTBOX FUNCTIONS ==========================================
// Open Lightbox for either images or video iframes
function openLightbox(src, video) {
  lightboxContent.innerHTML = video
    ? `<iframe src="${video}" title="BY ZIRU video" frameborder="0" scrolling="no" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe>`
    : `<img src="${src}" alt="Enlarged BY ZIRU work">`;
  lightbox.showModal();
}

// ========================================== INTERACTION EVENT LISTENERS ==========================================

// Set main card covers and handle category clicks to generate gallery grid
document.querySelectorAll('[data-gallery]').forEach(card => {
  const key = card.dataset.gallery;
  card.querySelector('img').src = galleries[key][0];
  card.addEventListener('click', () => {
    title.textContent = card.querySelector('strong').textContent.replace(/\n/g, ' ');
    
    // Generate grid markup dynamically
    grid.innerHTML = galleries[key].map((src, i) => `
      <figure data-src="${src}" data-video="${key === 'videos' ? videoEmbeds[i] : ''}">
        <img src="${src}" alt="${title.textContent} work ${i + 1}" loading="lazy">
      </figure>
    `).join('');
    
    // Add click triggers on newly created figures to open lightbox
    grid.querySelectorAll('figure').forEach(item => {
      item.addEventListener('click', () => openLightbox(item.dataset.src, item.dataset.video));
    });
    
    modal.showModal();
  });
});

// Close Gallery Modal handlers
document.querySelector('.close-modal').addEventListener('click', () => modal.close());

modal.addEventListener('click', event => {
  if (event.target === modal) modal.close();
});

// Close Lightbox Modal handlers
document.querySelector('.close-lightbox').addEventListener('click', () => lightbox.close());

lightbox.addEventListener('click', event => {
  if (event.target === lightbox) lightbox.close();
});

lightbox.addEventListener('close', () => {
  lightboxContent.innerHTML = ''; // Clear iframe src when closing lightbox to stop playback
});

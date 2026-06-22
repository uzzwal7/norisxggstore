// ============================================================================
// HOMEPAGE CAROUSEL SLIDES CONFIG
// ============================================================================
// To ADD a new slide: copy one of the objects below, paste it as a new entry,
// and change the values. The carousel automatically adjusts to however many
// slides are in this array — no other file needs to change.
//
// To CHANGE an image: put your image file inside public/images/carousel/
// and set "image" below to "images/carousel/yourfile.jpg"
//
// If "image" is left empty (""), a fallback icon design is shown instead,
// so the homepage never looks broken while you're preparing artwork.
// ============================================================================

const carouselSlides = [
  {
    id: 'fc26',
    themeClass: 'layout-fc26',                 // controls slide background gradient styling
    sphereClass: 'grad-sphere-green',           // fallback icon-circle color (used while no image is set)
    image: 'images/carousel/slide1-fc26.jpg',  // put your image here
    badgeIcon: 'fa-trophy',
    badgeText: 'WORLD CUP OFFER',
    badgeClass: 'gold-tag',
    limitedText: 'LIMITED SPECIAL DEAL',
    title: 'EA SPORTS',
    titleAccent: 'FC26',
    accentClass: 'accent-text-blue',
    subtitle: 'FIFA World Cup Edition 2026',
    desc: 'Step into the greatest football tournament on Earth. Lifetime Steam account access with online multiplayer support. Fully trusted by 5000+ gamers globally!',
    originalPrice: 'Rs. 2,999',
    currentPrice: 'Rs. 500',
    buttonText: 'BUY NOW',
    buttonClass: '',
    buttonAction: 'FC26 Standard Edition',     // must match a product "name" exactly
    features: [
      { icon: 'fa-shield-halved', text: 'Private Account With Online' },
      { icon: 'fa-bolt', text: 'Instant Automated Keys' }
    ],
    fallbackIcon: 'fa-trophy',
    fallbackGlowClass: ''
  },
  {
    id: 'resident-evil',
    themeClass: 'layout-re',
    sphereClass: 'grad-sphere-red',
    image: 'images/carousel/slide2-residentevil.jpg',
    badgeIcon: 'fa-skull',
    badgeText: 'NEW RELEASE',
    badgeClass: 'horror-tag',
    limitedText: '30% DISCOUNT',
    limitedIsBadge: true,
    title: 'RESIDENT EVIL',
    titleAccent: 'REQUIEM',
    accentClass: 'accent-text-pink',
    subtitle: 'Absolute Nightmare Survival',
    desc: 'Face pure dread in the newest story mode chapter. Includes standard activation CD-keys and special pre-order digital bonus caches.',
    originalPrice: 'Rs. 1,999',
    currentPrice: 'Rs. 1,399',
    buttonText: 'ADD TO CART',
    buttonClass: 'btn-action-pink',
    buttonAction: 'Resident Evil Requiem',
    features: [
      { icon: 'fa-key', text: 'Deluxe Steam Key' },
      { icon: 'fa-ghost', text: 'Survival Pack Preloaded' }
    ],
    fallbackIcon: 'fa-skull-crossbones',
    fallbackGlowClass: 'horror-glow'
  },
  {
    id: 'cs2-iem',
    themeClass: 'layout-esports',
    sphereClass: 'grad-sphere-orange',
    image: 'images/carousel/slide3-cs2.jpg',
    badgeIcon: 'fa-crosshairs',
    badgeText: 'CS2 SPECIAL',
    badgeClass: 'orange-tag',
    limitedText: 'ESPORTS MAJOR SALE',
    title: 'CS2',
    titleAccent: 'IEM COLOGNE',
    accentClass: 'accent-text-orange',
    subtitle: 'Prime Accounts & Keys Bundle',
    desc: 'Unlock instant Prime competitive matchmaking status and exclusive loot keys. Elevate your CS2 gaming ranking today during the IEM playoffs.',
    originalPrice: 'Rs. 1,500',
    currentPrice: 'Rs. 899',
    buttonText: 'VIEW OFFERS',
    buttonClass: 'btn-action-orange',
    buttonAction: 'CS2 Prime Accounts Key',
    features: [
      { icon: 'fa-award', text: 'Verified Prime Keys' },
      { icon: 'fa-bolt', text: 'Instant Account Transfer' }
    ],
    fallbackIcon: 'fa-crosshairs',
    fallbackGlowClass: 'esports-glow'
  }

  // ── To add slide 4, copy this and edit it: ──────────────────────────────
  // {
  //   id: 'my-new-slide',
  //   themeClass: 'layout-fc26',           // reuse fc26 / re / esports styles, or add a new one in css/03-carousel.css
  //   sphereClass: 'grad-sphere-green',    // grad-sphere-green / grad-sphere-red / grad-sphere-orange
  //   image: 'images/carousel/slide4.jpg',
  //   badgeIcon: 'fa-fire',
  //   badgeText: 'NEW',
  //   badgeClass: 'gold-tag',
  //   limitedText: 'LIMITED TIME',
  //   title: 'YOUR GAME',
  //   titleAccent: 'TITLE',
  //   accentClass: 'accent-text-blue',
  //   subtitle: 'Subtitle here',
  //   desc: 'Description here.',
  //   originalPrice: 'Rs. 0',
  //   currentPrice: 'Rs. 0',
  //   buttonText: 'BUY NOW',
  //   buttonClass: '',
  //   buttonAction: 'Exact Product Name From Database',
  //   features: [ { icon: 'fa-bolt', text: 'Feature one' }, { icon: 'fa-key', text: 'Feature two' } ],
  //   fallbackIcon: 'fa-gamepad',
  //   fallbackGlowClass: ''
  // }
];

module.exports = carouselSlides;

import confetti from 'canvas-confetti';
import { KeyTier, CAROUSEL_REWARD_TIERS, GiftReward } from '../constants/terminology';

export interface CarouselItem {
  id: string;
  name: string;
  tier: keyof typeof CAROUSEL_REWARD_TIERS;
  rewardType: 'points' | 'ingredient' | 'key' | 'gift';
  value: string;
  icon: string;
  isPhysicalGift?: boolean;
}

// Pool of items for the Carousel
const REWARD_POOL: CarouselItem[] = [
  // Common / Uncommon
  { id: 'p_100', name: '100 Points', tier: 'COMMON', rewardType: 'points', value: '+100 Điểm', icon: '⭐' },
  { id: 'p_250', name: '250 Points', tier: 'UNCOMMON', rewardType: 'points', value: '+250 Điểm', icon: '🌟' },
  { id: 'ing_charcoal_1', name: '1x Than Củi', tier: 'COMMON', rewardType: 'ingredient', value: 'Nạp Đài Lửa', icon: '🪵' },
  { id: 'ing_charcoal_3', name: '3x Than Củi', tier: 'UNCOMMON', rewardType: 'ingredient', value: 'Nạp Đài Lửa', icon: '🔥' },
  { id: 'p_500', name: '500 Points', tier: 'UNCOMMON', rewardType: 'points', value: '+500 Điểm', icon: '💫' },

  // Rare / Epic
  { id: 'key_gold', name: 'Key - Gold', tier: 'RARE', rewardType: 'key', value: 'Chìa Khóa Vàng', icon: '🗝️' },
  { id: 'buff_speed', name: 'Buff Khai Phá +50%', tier: 'RARE', rewardType: 'ingredient', value: 'Bán kính R=8 ô', icon: '⚡' },
  { id: 'key_plat', name: 'Key - Platinum', tier: 'EPIC', rewardType: 'key', value: 'Chìa Bạch Kim', icon: '💎' },
  { id: 'p_2000', name: '2.000 Points', tier: 'EPIC', rewardType: 'points', value: 'Kho báu tri thức', icon: '👑' },

  // Legendary Physical Gifts (Quà Thật / Hiện Vật)
  { id: 'gift_tshirt', name: 'Áo Thun R2PL Cyberpunk', tier: 'LEGENDARY', rewardType: 'gift', value: 'Quà Thật R2PL', icon: '👕', isPhysicalGift: true },
  { id: 'gift_keychain', name: 'Móc Khóa Predator Titan', tier: 'LEGENDARY', rewardType: 'gift', value: 'Quà Thật R2PL', icon: '🔑', isPhysicalGift: true },
  { id: 'gift_socks', name: 'Vớ Gaming Predator Speed', tier: 'LEGENDARY', rewardType: 'gift', value: 'Quà Thật R2PL', icon: '🧦', isPhysicalGift: true },
  { id: 'gift_mouse', name: 'Chuột Gaming Predator Cestus', tier: 'LEGENDARY', rewardType: 'gift', value: 'Quà Hiện Vật Khủng', icon: '🖱️', isPhysicalGift: true },
];

export interface CarouselOpenCallback {
  (wonItem: CarouselItem): void;
}

/**
 * CarouselModal: CS:GO Style Horizontal Gacha Carousel for opening Chests.
 */
export class CarouselModal {
  private modal: HTMLDivElement;
  private isSpinning: boolean = false;
  private onWinCallback?: CarouselOpenCallback;

  constructor() {
    this.modal = document.createElement('div');
    this.modal.id = 'carousel-gacha-modal';
    this.modal.className = 'cyber-modal-backdrop';
    this.modal.style.display = 'none';
    document.body.appendChild(this.modal);

    this.render();
  }

  public open(keyTier: KeyTier = KeyTier.SILVER, onWin?: CarouselOpenCallback): void {
    this.onWinCallback = onWin;
    this.modal.style.display = 'flex';
    this.setupCarouselTrack(keyTier);
  }

  public close(): void {
    if (this.isSpinning) return;
    this.modal.style.display = 'none';
  }

  private render(): void {
    this.modal.innerHTML = `
      <div class="carousel-window">
        <!-- Header -->
        <div class="carousel-header">
          <div class="carousel-title-row">
            <span class="predator-badge">GACHA CAROUSEL</span>
            <h2 id="carousel-title">VÒNG QUAY MỞ RƯƠNG PREDATOR</h2>
          </div>
          <button id="btn-close-carousel" class="cyber-btn-close">✕</button>
        </div>

        <!-- Key Tier Selector -->
        <div class="key-tier-selector">
          <button class="tier-tab-btn active" data-tier="${KeyTier.SILVER}">
            🗝️ ${KeyTier.SILVER}
          </button>
          <button class="tier-tab-btn" data-tier="${KeyTier.GOLD}">
            🏆 ${KeyTier.GOLD}
          </button>
          <button class="tier-tab-btn" data-tier="${KeyTier.PLATINUM}">
            💎 ${KeyTier.PLATINUM}
          </button>
        </div>

        <!-- The CS:GO Spinning Carousel Reel -->
        <div class="carousel-viewport-wrapper">
          <div class="carousel-center-indicator"></div>
          <div class="carousel-track" id="carousel-track">
            <!-- Dynamic item cards will be generated here -->
          </div>
        </div>

        <!-- Action / Controls -->
        <div class="carousel-footer">
          <div id="carousel-reward-announcement" class="reward-announcement" style="display: none;"></div>
          <button id="btn-spin-carousel" class="cyber-btn cyber-btn-spin">
            ⚡ XOAY VÒNG QUAY (SPIN)
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const btnClose = this.modal.querySelector('#btn-close-carousel');
    btnClose?.addEventListener('click', () => this.close());

    const btnSpin = this.modal.querySelector('#btn-spin-carousel');
    btnSpin?.addEventListener('click', () => this.startSpin());

    const tierBtns = this.modal.querySelectorAll('.tier-tab-btn');
    tierBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        if (this.isSpinning) return;
        tierBtns.forEach((b) => b.classList.remove('active'));
        const target = e.currentTarget as HTMLElement;
        target.classList.add('active');
        const tier = target.getAttribute('data-tier') as KeyTier;
        this.setupCarouselTrack(tier);
      });
    });
  }

  private setupCarouselTrack(tier: KeyTier): void {
    const track = this.modal.querySelector('#carousel-track') as HTMLElement;
    const announce = this.modal.querySelector('#carousel-reward-announcement') as HTMLElement;
    if (!track) return;

    announce.style.display = 'none';
    announce.innerHTML = '';
    track.style.transition = 'none';
    track.style.transform = 'translateX(0px)';

    // Generate 60 cards for the long CS:GO strip
    let cardsHtml = '';
    const pool = this.filterPoolForTier(tier);

    for (let i = 0; i < 60; i++) {
      const item = pool[Math.floor(Math.random() * pool.length)];
      const tierStyle = CAROUSEL_REWARD_TIERS[item.tier];

      cardsHtml += `
        <div class="carousel-card tier-${item.tier.toLowerCase()}" style="border-bottom: 4px solid ${tierStyle.colorHex}">
          <div class="card-glow" style="background: radial-gradient(circle, ${tierStyle.bgColor} 0%, transparent 70%);"></div>
          <div class="card-icon">${item.icon}</div>
          <div class="card-name" style="color: ${tierStyle.colorHex}">${item.name}</div>
          <div class="card-val">${item.value}</div>
          ${item.isPhysicalGift ? '<div class="gift-tag">QUÀ THẬT</div>' : ''}
        </div>
      `;
    }

    track.innerHTML = cardsHtml;
  }

  private filterPoolForTier(tier: KeyTier): CarouselItem[] {
    if (tier === KeyTier.PLATINUM) {
      // Much higher chance of Legendary physical gifts and Epic rewards
      return [
        ...REWARD_POOL.filter((i) => i.tier === 'LEGENDARY'),
        ...REWARD_POOL.filter((i) => i.tier === 'EPIC'),
        ...REWARD_POOL.filter((i) => i.tier === 'RARE'),
      ];
    } else if (tier === KeyTier.GOLD) {
      return [
        ...REWARD_POOL.filter((i) => i.tier === 'LEGENDARY'),
        ...REWARD_POOL.filter((i) => i.tier === 'RARE'),
        ...REWARD_POOL.filter((i) => i.tier === 'UNCOMMON'),
      ];
    }
    // Silver: standard pool
    return REWARD_POOL;
  }

  /**
   * Triggers the CS:GO deceleration spin animation
   */
  public startSpin(): void {
    if (this.isSpinning) return;
    this.isSpinning = true;

    const track = this.modal.querySelector('#carousel-track') as HTMLElement;
    const btnSpin = this.modal.querySelector('#btn-spin-carousel') as HTMLButtonElement;
    const announce = this.modal.querySelector('#carousel-reward-announcement') as HTMLElement;

    if (btnSpin) btnSpin.disabled = true;
    if (announce) announce.style.display = 'none';

    // Winning card index (between 42 and 52)
    const winningIndex = 45;
    const cardWidth = 140; // width + gap
    const randomOffset = Math.floor(Math.random() * 80) - 40; // Random offset inside the card

    // Center offset of the viewport
    const viewportWidth = track.parentElement?.clientWidth || 700;
    const targetOffset = winningIndex * cardWidth + cardWidth / 2 - viewportWidth / 2 + randomOffset;

    // Reset position
    track.style.transition = 'none';
    track.style.transform = 'translateX(0px)';

    // Force reflow
    void track.offsetHeight;

    // Trigger smooth CS:GO cubic-bezier deceleration
    track.style.transition = 'transform 6.5s cubic-bezier(0.12, 0.8, 0.22, 1.0)';
    track.style.transform = `translateX(-${targetOffset}px)`;

    setTimeout(() => {
      this.isSpinning = false;
      if (btnSpin) btnSpin.disabled = false;

      const winningCard = track.children[winningIndex] as HTMLElement;
      if (winningCard) {
        winningCard.classList.add('winner-bounce');
        const itemName = winningCard.querySelector('.card-name')?.textContent || 'Vật phẩm';
        const isGift = winningCard.querySelector('.gift-tag') !== null;

        // Celebrate!
        if (isGift) {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#00FFE8', '#0077FE', '#FFB800', '#FFFFFF'],
          });
        }

        announce.style.display = 'block';
        announce.innerHTML = `
          <div class="announcement-glow ${isGift ? 'gift-glow' : ''}">
            🎉 CHÚC MỪNG BẠN ĐÃ NHẬN ĐƯỢC: <strong>${itemName}</strong>!
            ${isGift ? '<div class="gift-banner">✨ QUÀ HIỆN VẬT SẼ ĐƯỢC GỬI VỀ TRỤ SỞ TRƯỜNG CỦA BẠN! ✨</div>' : ''}
          </div>
        `;

        if (this.onWinCallback) {
          const won = REWARD_POOL.find((r) => r.name === itemName) || REWARD_POOL[0];
          this.onWinCallback(won);
        }
      }
    }, 6700);
  }
}

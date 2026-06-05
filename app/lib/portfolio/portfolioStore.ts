// app/lib/portfolio/portfolioStore.ts
export interface PortfolioItem {
  symbol: string;
  companyName: string;
  shares: number;
  buyPrice: number;
  buyDate: string;
  notes: string;
}

export interface WatchlistItem {
  symbol: string;
  companyName: string;
  addedDate: string;
  notes: string;
}

class PortfolioStore {
  private portfolios: PortfolioItem[] = [];
  private watchlist: WatchlistItem[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    if (typeof window !== 'undefined') {
      const savedPortfolio = localStorage.getItem('portfolio');
      const savedWatchlist = localStorage.getItem('watchlist');
      if (savedPortfolio) this.portfolios = JSON.parse(savedPortfolio);
      if (savedWatchlist) this.watchlist = JSON.parse(savedWatchlist);
    }
  }

  private saveToLocalStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('portfolio', JSON.stringify(this.portfolios));
      localStorage.setItem('watchlist', JSON.stringify(this.watchlist));
    }
  }

  getPortfolio(): PortfolioItem[] {
    return this.portfolios;
  }

  getWatchlist(): WatchlistItem[] {
    return this.watchlist;
  }

  addToPortfolio(item: PortfolioItem) {
    this.portfolios.push(item);
    this.saveToLocalStorage();
  }

  removeFromPortfolio(symbol: string) {
    this.portfolios = this.portfolios.filter(p => p.symbol !== symbol);
    this.saveToLocalStorage();
  }

  addToWatchlist(item: WatchlistItem) {
    if (!this.watchlist.find(w => w.symbol === item.symbol)) {
      this.watchlist.push(item);
      this.saveToLocalStorage();
    }
  }

  removeFromWatchlist(symbol: string) {
    this.watchlist = this.watchlist.filter(w => w.symbol !== symbol);
    this.saveToLocalStorage();
  }

  updatePortfolio(symbol: string, updates: Partial<PortfolioItem>) {
    const index = this.portfolios.findIndex(p => p.symbol === symbol);
    if (index !== -1) {
      this.portfolios[index] = { ...this.portfolios[index], ...updates };
      this.saveToLocalStorage();
    }
  }

  getTotalValue(currentPrices: Record<string, number>): number {
    return this.portfolios.reduce((total, item) => {
      const currentPrice = currentPrices[item.symbol] || item.buyPrice;
      return total + (currentPrice * item.shares);
    }, 0);
  }

  getTotalProfit(currentPrices: Record<string, number>): number {
    return this.portfolios.reduce((total, item) => {
      const currentPrice = currentPrices[item.symbol] || item.buyPrice;
      const cost = item.buyPrice * item.shares;
      const value = currentPrice * item.shares;
      return total + (value - cost);
    }, 0);
  }
}

export const portfolioStore = new PortfolioStore();
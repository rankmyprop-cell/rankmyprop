type PlatformAsset = {
  name: string
  src: string
}

const platformAssets: Record<string, PlatformAsset> = {
  mt4: {
    name: 'MetaTrader 4',
    src: '/assets/platforms/metatrader-4.ico',
  },
  metatrader4: {
    name: 'MetaTrader 4',
    src: '/assets/platforms/metatrader-4.ico',
  },
  mt5: {
    name: 'MetaTrader 5',
    src: '/assets/platforms/metatrader-5.svg',
  },
  metatrader5: {
    name: 'MetaTrader 5',
    src: '/assets/platforms/metatrader-5.svg',
  },
  ctrader: {
    name: 'cTrader',
    src: '/assets/platforms/ctrader-icon.svg',
  },
  matchtrader: {
    name: 'Match-Trader',
    src: '/assets/platforms/match-trader.png',
  },
  tradelocker: {
    name: 'TradeLocker',
    src: '/assets/platforms/tradelocker.png',
  },
  dxtrade: {
    name: 'DXtrade',
    src: '/assets/platforms/dxtrade-icon.png',
  },
}

const normalizePlatform = (platform: string) => platform.toLowerCase().replace(/[^a-z0-9]/g, '')

export function getPlatformAsset(platform: string) {
  return platformAssets[normalizePlatform(platform)]
}

export function PlatformLogo({ platform }: { platform: string }) {
  const asset = getPlatformAsset(platform)
  if (!asset) return null

  return (
    <span
      className="platform-logo"
      data-tooltip={asset.name}
      aria-label={asset.name}
      title={asset.name}
      role="img"
      tabIndex={0}
    >
      <img src={asset.src} alt="" aria-hidden="true" />
    </span>
  )
}

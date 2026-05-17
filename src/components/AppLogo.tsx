import { ASSETS } from '../constants/assets'

type AppLogoProps = {
  size?: number
}

export function AppLogo({ size = 120 }: AppLogoProps) {
  return (
    <img
      src={ASSETS.logoRobyn}
      alt="Round-Robyn"
      width={size}
      style={{
        display: 'block',
        width: size,
        height: 'auto',
        margin: '0 auto',
      }}
    />
  )
}

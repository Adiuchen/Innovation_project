import type { ReactNode } from "react";
import type { ColorValue } from "react-native";
import Svg, { Path } from "react-native-svg";

type IconProps = { color: ColorValue; size?: number };

function ink(color: ColorValue) {
  return typeof color === "string" ? color : "#1e4d38";
}

function Icon({ size = 24, children }: IconProps & { children: ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {children}
    </Svg>
  );
}

const stroke = { strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function HomeTabIcon({ color, size }: IconProps) {
  return (
    <Icon color={color} size={size}>
      <Path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1Z" stroke={ink(color)} {...stroke} />
    </Icon>
  );
}

export function RecordsTabIcon({ color, size }: IconProps) {
  return (
    <Icon color={color} size={size}>
      <Path d="M7 3.5h7.2L18.5 8v12a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z" stroke={ink(color)} {...stroke} />
      <Path d="M14 3.6V8h4.4" stroke={ink(color)} {...stroke} />
      <Path d="M9 12.5h6M9 16h6" stroke={ink(color)} {...stroke} />
    </Icon>
  );
}

export function PlantsTabIcon({ color, size }: IconProps) {
  return (
    <Icon color={color} size={size}>
      <Path d="M5 19.5c7.5-1 11.5-7.2 12.5-14.5-6.2.8-12.2 4.6-12.5 14.5Z" stroke={ink(color)} {...stroke} />
      <Path d="M9.2 15.2c1.8-2.2 3.8-4.6 6-7.2" stroke={ink(color)} {...stroke} />
    </Icon>
  );
}

export function ScanTabIcon({ color, size }: IconProps) {
  return (
    <Icon color={color} size={size}>
      <Path d="M4 8V5.8A1.8 1.8 0 0 1 5.8 4H8" stroke={ink(color)} {...stroke} />
      <Path d="M16 4h2.2A1.8 1.8 0 0 1 20 5.8V8" stroke={ink(color)} {...stroke} />
      <Path d="M20 16v2.2a1.8 1.8 0 0 1-1.8 1.8H16" stroke={ink(color)} {...stroke} />
      <Path d="M8 20H5.8A1.8 1.8 0 0 1 4 18.2V16" stroke={ink(color)} {...stroke} />
      <Path d="M7 12h10" stroke={ink(color)} {...stroke} />
    </Icon>
  );
}

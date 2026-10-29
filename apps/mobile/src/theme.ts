export const colors = {
  paper: "#f3efe4",
  field: "#e7f0e8",
  card: "#fffdf8",
  forest: "#1e4d38",
  forestDark: "#143528",
  leaf: "#2f6d4f",
  sand: "#e7d7b1",
  ink: "#1c1915",
  muted: "#5e584e",
  line: "#e4dccb",
  danger: "#8f2d2d",
  dangerBg: "#f8e6e6",
  warning: "#8a5a12",
  warningBg: "#f8efd8",
  info: "#1e4a6d",
  infoBg: "#e7eef6",
  okBg: "#e5f2ea",
  tab: "#f7fbf8",
  sheet: "#f7fbf8",
};

export const darkColors: typeof colors = {
  paper: "#101614",
  field: "#101614",
  card: "#1b2822",
  forest: "#1e4d38",
  forestDark: "#0e241c",
  leaf: "#8fbfa0",
  sand: "#d5e6c8",
  ink: "#e7f2ea",
  muted: "#a8b7ae",
  line: "#2c3b33",
  danger: "#e7b4b4",
  dangerBg: "#3a2222",
  warning: "#e6c48a",
  warningBg: "#3a2e1c",
  info: "#b7d4ee",
  infoBg: "#1a2c3a",
  okBg: "#1c3328",
  tab: "#18241e",
  sheet: "#1b2822",
};

export type Palette = typeof colors;

export const headerOptions = {
  headerStyle: { backgroundColor: colors.paper },
  headerTintColor: colors.forest,
  headerTitleStyle: { fontWeight: "600" as const },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.paper },
};

export function statusColors(status: string) {
  switch (status) {
    case "approved":
      return { background: colors.okBg, text: colors.forest };
    case "submitted":
      return { background: colors.infoBg, text: colors.info };
    case "needs_revision":
      return { background: colors.warningBg, text: colors.warning };
    case "rejected":
    case "cancelled":
      return { background: colors.dangerBg, text: colors.danger };
    case "published":
      return { background: colors.okBg, text: colors.forest };
    default:
      return { background: "#eeeae2", text: colors.muted };
  }
}

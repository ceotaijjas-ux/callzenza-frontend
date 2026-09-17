// Order here drives the sidebar list AND the panel render order.
// `title` / `subtitle` populate the topbar when that tab is active
// (mirrors the `titles` lookup object in the original vanilla-JS demo).
export const NAV_ITEMS = [
  {
    key: "connections",
    label: "Connections",
    title: "Connections",
    subtitle:
      "Link your WhatsApp Business number and outbound email so this page can actually send and receive on both channels.",
    icon: "connections",
  },
  {
    key: "identity",
    label: "Business Identity",
    title: "Business Identity",
    subtitle: "What the customer sees — separate from how the agent dashboard looks.",
    icon: "identity",
  },
  {
    key: "templates",
    label: "Templates & Canned Responses",
    title: "Templates & Canned Responses",
    subtitle: "Quick-reply snippets and saved email replies your team can reuse.",
    icon: "templates",
  },
  {
    key: "notifications",
    label: "Notifications",
    title: "Notifications",
    subtitle: "Choose how and when you hear about new activity.",
    icon: "notifications",
  },
  {
    key: "crm",
    label: "Contacts & CRM Sync",
    title: "Contacts & CRM Sync",
    subtitle: "Both panels read from your CRM lead list — configure how fields map.",
    icon: "crm",
  },
  {
    key: "team",
    label: "Team & Permissions",
    title: "Team & Permissions",
    subtitle: "Who can see Messages, and how conversations get distributed.",
    icon: "team",
  },
  {
    key: "compliance",
    label: "Compliance & Retention",
    title: "Compliance & Retention",
    subtitle: "Retention windows, consent tracking, and the audit trail.",
    icon: "compliance",
  },
];

export const DEFAULT_TAB = "connections";

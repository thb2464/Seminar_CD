// Shared locale type. Lives in its own file so neither the tour entity nor the
// query service has to import from a sibling that happens to also declare it.
export type SupportedLocale = 'vi' | 'en' | 'zh';

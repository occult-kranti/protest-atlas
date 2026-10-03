// Search, quick chips, active chips and filter sheet controls (WP2). Phase-0 stub; QUICK_CHIPS is final (SPEC C-10). DOM-free when loaded.

export const QUICK_CHIPS = [{key: 'window', value: '7', label: 'Last 7 days'}, {key: 'window', value: '30', label: 'Last 30 days'},
  {key: 'status', value: 'ended', label: 'Ended / suspended'}, {key: 'outcome', value: 'documented', label: 'Outcome documented'}];

export function mountFilters(ctx) { return {render() {}}; }

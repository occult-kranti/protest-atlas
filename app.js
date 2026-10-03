// Bootstrap and controller (WP2). Phase-0 scaffold: the static module graph below is final (SPEC §19.0, C-48);
// the page stays static until WP2 implements boot().
import './explore.js';
import './freshness.js';
import './js/html.js';
import './js/model.js';
import './js/store.js';
import './js/router.js';
import './js/data.js';
import './js/actions.js';
import './js/filters.js';
import './js/list.js';
import './js/stamps.js';
import './js/notice.js';
import './js/sheet.js';
import './js/record-facts.js';
import './js/detail.js';
import './js/ahead.js';
import './js/countries.js';
import './js/about.js';

export {getDisplayStatus, dateLabel} from './js/model.js';

async function boot() {}

if (typeof document !== 'undefined') boot();

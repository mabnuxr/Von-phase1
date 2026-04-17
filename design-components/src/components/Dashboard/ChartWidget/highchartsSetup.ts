/**
 * Centralized Highcharts module initialization via side-effect imports.
 *
 * Load order matters — dependencies must be imported before dependents:
 *   - highcharts-more FIRST (solidgauge, bubble, arearange depend on it)
 *   - xrange before gantt
 *   - sankey before dependency-wheel, organization, arc-diagram
 *   - heatmap before tilemap
 *   - dumbbell before lollipop
 */
import Highcharts from 'highcharts';

// ── Foundation modules (order-sensitive) ────────────────────────
import 'highcharts/highcharts-more'; // FIRST — solidgauge depends on it
import 'highcharts/modules/xrange';
import 'highcharts/modules/gantt'; // after xrange
import 'highcharts/modules/funnel';
import 'highcharts/modules/heatmap';
import 'highcharts/modules/treemap';
import 'highcharts/modules/sankey';
import 'highcharts/modules/sunburst';
import 'highcharts/modules/solid-gauge'; // after highcharts-more
import 'highcharts/modules/drilldown';
import 'highcharts/modules/no-data-to-display';

// ── Dependent modules (sankey, heatmap, dumbbell loaded above) ──
import 'highcharts/modules/arc-diagram'; // after sankey
import 'highcharts/modules/bullet';
import 'highcharts/modules/dependency-wheel'; // after sankey
import 'highcharts/modules/dumbbell';
import 'highcharts/modules/histogram-bellcurve';
import 'highcharts/modules/item-series';
import 'highcharts/modules/lollipop'; // after dumbbell
import 'highcharts/modules/networkgraph';
import 'highcharts/modules/organization'; // after sankey
import 'highcharts/modules/parallel-coordinates';
import 'highcharts/modules/pareto';
import 'highcharts/modules/pictorial';
import 'highcharts/modules/streamgraph';
import 'highcharts/modules/tilemap'; // after heatmap
import 'highcharts/modules/timeline';
import 'highcharts/modules/treegraph';
import 'highcharts/modules/variable-pie';
import 'highcharts/modules/variwide';
import 'highcharts/modules/venn';
import 'highcharts/modules/wordcloud';

export default Highcharts;

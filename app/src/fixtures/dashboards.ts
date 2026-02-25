import type { DashboardMetadataResponse, WidgetDataResponse } from '../types/dashboard';

// ─── Dashboard 1: Sales Executive Summary (3 Widgets) ───────────

export const salesExecDashboard: DashboardMetadataResponse = {
  success: true,
  data: {
    dashboard: {
      id: 'dash_sales_exec_001',
      title: 'Sales Executive Summary',
      description: 'Key sales KPIs and quarterly revenue trend for GTM leadership',
      gridConfig: {
        cols: 12,
        rowHeight: 80,
        margin: [8, 8],
        containerPadding: [0, 0],
        compactType: 'vertical',
      },
      layout: [
        { i: 'w_total_arr', x: 0, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
        { i: 'w_new_bookings', x: 4, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
        { i: 'w_revenue_trend', x: 0, y: 2, w: 12, h: 5, minW: 6, minH: 3 },
      ],
      widgets: {
        w_total_arr: {
          id: 'w_total_arr',
          type: 'counter',
          title: 'Total ARR',
          config: {
            value: 18750000,
            format: 'currency',
            prefix: '$',
            decimals: 0,
            trend: {
              value: 14.2,
              direction: 'up',
              sentiment: 'positive',
              label: 'vs last quarter',
            },
            sparkline: {
              data: [14200000, 15100000, 15800000, 16500000, 17200000, 18750000],
              type: 'line',
            },
          },
        },
        w_new_bookings: {
          id: 'w_new_bookings',
          type: 'counter',
          title: 'New Bookings (Q4)',
          config: {
            value: 3250000,
            format: 'currency',
            prefix: '$',
            decimals: 0,
            trend: {
              value: 22.6,
              direction: 'up',
              sentiment: 'positive',
              label: 'vs Q3',
            },
            sparkline: {
              data: [1800000, 2100000, 2650000, 3250000],
              type: 'bar',
            },
          },
        },
        w_revenue_trend: {
          id: 'w_revenue_trend',
          type: 'chart',
          title: 'Monthly Recurring Revenue',
          subtitle: 'Last 12 months',
          config: {
            chartType: 'line',
            highchartsOptions: {
              chart: { type: 'line' },
              title: { text: null },
              xAxis: {
                categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
                labels: { style: { fontSize: '12px' } },
              },
              yAxis: [{ title: { text: 'MRR ($)' }, labels: { format: '${value:,.0f}' }, min: 0 }],
              series: [{
                name: 'MRR',
                data: [1180000, 1220000, 1265000, 1310000, 1355000, 1390000, 1420000, 1465000, 1510000, 1540000, 1575000, 1562500],
                marker: { enabled: true, radius: 4 },
              }],
              tooltip: { shared: true, valuePrefix: '$', headerFormat: '<b>{point.key}</b><br/>' },
              legend: { enabled: false },
              credits: { enabled: false },
            },
          },
        },
      },
      filters: [
        {
          id: 'filter_period',
          label: 'Time Period',
          field: 'period',
          type: 'select',
          options: [
            { value: '6m', label: 'Last 6 months' },
            { value: '1y', label: 'Last year' },
            { value: 'ytd', label: 'Year to date' },
          ],
          defaultValue: '1y',
        },
      ],
      createdAt: '2025-01-10T09:00:00Z',
      updatedAt: '2025-02-24T11:30:00Z',
      createdBy: 'user_vp_sales',
      analysisId: 'analysis_sales_exec_q4',
    },
    refreshInfo: {
      lastRefreshedAt: '2025-02-24T11:00:00Z',
      refreshStatus: 'idle',
      nextScheduledRefresh: '2025-02-24T12:00:00Z',
      refreshIntervalMinutes: 60,
      dataSource: {
        analysisId: 'analysis_sales_exec_q4',
        analysisName: 'Sales Executive Metrics',
        dataFreshness: 'fresh',
      },
    },
  },
};

// ─── Dashboard 2: GTM Performance (8 Widgets) ───────────────────

export const gtmPerfDashboard: DashboardMetadataResponse = {
  success: true,
  data: {
    dashboard: {
      id: 'dash_gtm_perf_002',
      title: 'GTM Performance Dashboard',
      description: 'Pipeline, win rates, rep performance, and deal flow for the GTM team',
      gridConfig: {
        cols: 12,
        rowHeight: 80,
        margin: [8, 8],
        containerPadding: [0, 0],
        compactType: 'vertical',
      },
      layout: [
        { i: 'w_header_text', x: 0, y: 0, w: 12, h: 1, static: true },
        { i: 'w_pipeline_value', x: 0, y: 1, w: 3, h: 2 },
        { i: 'w_win_rate', x: 3, y: 1, w: 3, h: 2 },
        { i: 'w_avg_deal_size', x: 6, y: 1, w: 3, h: 2 },
        { i: 'w_sales_cycle', x: 9, y: 1, w: 3, h: 2 },
        { i: 'w_pipeline_by_stage', x: 0, y: 3, w: 6, h: 5 },
        { i: 'w_revenue_by_segment', x: 6, y: 3, w: 6, h: 5 },
        { i: 'w_rep_leaderboard', x: 0, y: 8, w: 12, h: 5 },
      ],
      widgets: {
        w_header_text: {
          id: 'w_header_text',
          type: 'text',
          title: 'Dashboard Header',
          config: {
            content: 'Q4 FY2025 Go-To-Market Review — Updated daily from Salesforce sync',
            variant: 'subheading',
            alignment: 'left',
          },
        },
        w_pipeline_value: {
          id: 'w_pipeline_value',
          type: 'counter',
          title: 'Pipeline Value',
          config: {
            value: 12400000,
            format: 'currency',
            prefix: '$',
            decimals: 0,
            trend: { value: 18.3, direction: 'up', sentiment: 'positive', label: 'vs last quarter' },
            sparkline: { data: [8200000, 9100000, 10500000, 12400000], type: 'bar' },
          },
        },
        w_win_rate: {
          id: 'w_win_rate',
          type: 'counter',
          title: 'Win Rate',
          config: {
            value: 32.4,
            format: 'percentage',
            suffix: '%',
            decimals: 1,
            trend: { value: 3.1, direction: 'up', sentiment: 'positive', label: 'vs Q3' },
          },
        },
        w_avg_deal_size: {
          id: 'w_avg_deal_size',
          type: 'counter',
          title: 'Avg Deal Size',
          config: {
            value: 78500,
            format: 'currency',
            prefix: '$',
            decimals: 0,
            trend: { value: 5.2, direction: 'up', sentiment: 'positive', label: 'vs Q3' },
          },
        },
        w_sales_cycle: {
          id: 'w_sales_cycle',
          type: 'counter',
          title: 'Avg Sales Cycle',
          config: {
            value: 42,
            format: 'number',
            suffix: ' days',
            decimals: 0,
            trend: { value: 5, direction: 'down', sentiment: 'positive', label: 'vs Q3 (47 days)' },
          },
        },
        w_pipeline_by_stage: {
          id: 'w_pipeline_by_stage',
          type: 'chart',
          title: 'Pipeline by Stage',
          subtitle: 'Current open pipeline value ($)',
          config: {
            chartType: 'column',
            highchartsOptions: {
              chart: { type: 'column' },
              title: { text: null },
              xAxis: {
                categories: ['Prospecting', 'Discovery', 'Proposal', 'Negotiation', 'Closing'],
                labels: { style: { fontSize: '11px' } },
              },
              yAxis: [{ title: { text: 'Pipeline Value ($)' }, labels: { format: '${value:,.0f}' }, min: 0 }],
              series: [{
                name: 'Pipeline Value',
                data: [
                  { name: 'Prospecting', y: 3200000 },
                  { name: 'Discovery', y: 2850000 },
                  { name: 'Proposal', y: 2600000 },
                  { name: 'Negotiation', y: 2150000 },
                  { name: 'Closing', y: 1600000 },
                ],
              }],
              tooltip: { valuePrefix: '$', pointFormat: '<b>{point.name}</b>: ${point.y:,.0f}' },
              plotOptions: { column: { borderRadius: 4, dataLabels: { enabled: true, format: '${y:,.0f}' } } },
              legend: { enabled: false },
              credits: { enabled: false },
            },
          },
        },
        w_revenue_by_segment: {
          id: 'w_revenue_by_segment',
          type: 'chart',
          title: 'Revenue by Segment',
          subtitle: 'Current quarter closed-won',
          config: {
            chartType: 'pie',
            highchartsOptions: {
              chart: { type: 'pie' },
              title: { text: null },
              series: [{
                name: 'Revenue',
                data: [
                  { name: 'Enterprise', y: 1450000 },
                  { name: 'Mid-Market', y: 980000 },
                  { name: 'SMB', y: 520000 },
                  { name: 'Self-Serve', y: 300000 },
                ],
              }],
              tooltip: { pointFormat: '<b>{point.name}</b>: ${point.y:,.0f} ({point.percentage:.1f}%)' },
              plotOptions: {
                pie: {
                  allowPointSelect: true,
                  cursor: 'pointer',
                  dataLabels: { enabled: true, format: '{point.name}: {point.percentage:.1f}%' },
                  showInLegend: true,
                },
              },
              legend: { enabled: true, align: 'right', verticalAlign: 'middle', layout: 'vertical' },
              credits: { enabled: false },
            },
          },
        },
        w_rep_leaderboard: {
          id: 'w_rep_leaderboard',
          type: 'table',
          title: 'Sales Rep Leaderboard',
          subtitle: 'Q4 performance — ranked by closed-won revenue',
          config: {
            columns: [
              { id: 'col_rank', field: 'rank', header: '#', dataType: 'number', width: 50, sortable: false },
              { id: 'col_rep_name', field: 'repName', header: 'Rep', dataType: 'string', width: 180 },
              {
                id: 'col_team', field: 'team', header: 'Team', dataType: 'string', width: 120,
                format: {
                  badge: {
                    mapping: {
                      Enterprise: {},
                      'Mid-Market': {},
                      SMB: {},
                    },
                  },
                },
              },
              { id: 'col_closed_won', field: 'closedWon', header: 'Closed-Won', dataType: 'currency', format: { abbreviate: true, prefix: '$' }, sortable: true },
              {
                id: 'col_quota_attain', field: 'quotaAttainment', header: 'Quota %', dataType: 'percentage',
                format: {
                  suffix: '%', decimals: 0,
                  colorScale: {
                    type: 'threshold',
                    thresholds: [
                      { value: 60, label: 'Below' },
                      { value: 90, label: 'Near' },
                      { value: 200, label: 'Above' },
                    ],
                  },
                },
                sortable: true,
              },
              { id: 'col_deals_closed', field: 'dealsClosed', header: 'Deals', dataType: 'number', width: 80, sortable: true },
              { id: 'col_win_rate', field: 'winRate', header: 'Win Rate', dataType: 'percentage', format: { suffix: '%', decimals: 1 }, sortable: true },
              { id: 'col_pipeline', field: 'openPipeline', header: 'Open Pipeline', dataType: 'currency', format: { abbreviate: true, prefix: '$' }, sortable: true },
            ],
            pagination: { enabled: true, pageSize: 10, pageSizeOptions: [10, 25, 50] },
            sorting: { enabled: true, defaultSort: { field: 'closedWon', direction: 'desc' } },
            rowStyles: [
              { condition: { field: 'quotaAttainment', operator: 'gte', value: 100 }, sentiment: 'positive', style: {} },
            ],
          },
        },
      },
      filters: [
        {
          id: 'filter_quarter', label: 'Quarter', field: 'quarter', type: 'select',
          options: [
            { value: 'Q1-2025', label: 'Q1 FY2025' },
            { value: 'Q2-2025', label: 'Q2 FY2025' },
            { value: 'Q3-2025', label: 'Q3 FY2025' },
            { value: 'Q4-2025', label: 'Q4 FY2025' },
          ],
          defaultValue: 'Q4-2025',
        },
        {
          id: 'filter_segment', label: 'Segment', field: 'segment', type: 'multi-select',
          options: [
            { value: 'enterprise', label: 'Enterprise', count: 18 },
            { value: 'mid-market', label: 'Mid-Market', count: 34 },
            { value: 'smb', label: 'SMB', count: 52 },
          ],
        },
        {
          id: 'filter_region', label: 'Region', field: 'region', type: 'multi-select',
          options: [
            { value: 'na', label: 'North America', count: 45 },
            { value: 'emea', label: 'EMEA', count: 32 },
            { value: 'apac', label: 'APAC', count: 27 },
          ],
        },
      ],
      createdAt: '2025-01-05T08:00:00Z',
      updatedAt: '2025-02-24T14:00:00Z',
      createdBy: 'user_revops_lead',
      analysisId: 'analysis_gtm_perf_q4',
    },
    refreshInfo: {
      lastRefreshedAt: '2025-02-24T13:00:00Z',
      refreshStatus: 'idle',
      nextScheduledRefresh: '2025-02-24T14:00:00Z',
      refreshIntervalMinutes: 60,
      dataSource: {
        analysisId: 'analysis_gtm_perf_q4',
        analysisName: 'GTM Performance Analysis Q4',
        dataFreshness: 'fresh',
      },
    },
  },
};

// ─── Dashboard 3: Full Showcase (15 Widgets) ─────────────────────

export const fullShowcaseDashboard: DashboardMetadataResponse = {
  success: true,
  data: {
    dashboard: {
      id: 'dash_full_showcase_003',
      title: 'Sales & GTM Analytics — Full View',
      description: 'Comprehensive GTM dashboard covering all chart types with real sales data',
      gridConfig: {
        cols: 12,
        rowHeight: 80,
        margin: [8, 8],
        containerPadding: [0, 0],
        compactType: 'vertical',
      },
      layout: [
        { i: 'w_text_header', x: 0, y: 0, w: 12, h: 1, static: true },
        { i: 'w_counter_arr', x: 0, y: 1, w: 3, h: 2 },
        { i: 'w_counter_nrr', x: 3, y: 1, w: 3, h: 2 },
        { i: 'w_counter_cac', x: 6, y: 1, w: 3, h: 2 },
        { i: 'w_counter_churn', x: 9, y: 1, w: 3, h: 2 },
        { i: 'w_line_mrr', x: 0, y: 3, w: 6, h: 5 },
        { i: 'w_area_pipeline', x: 6, y: 3, w: 6, h: 5 },
        { i: 'w_column_bookings', x: 0, y: 8, w: 6, h: 5 },
        { i: 'w_bar_rep_perf', x: 6, y: 8, w: 6, h: 5 },
        { i: 'w_pie_revenue_source', x: 0, y: 13, w: 4, h: 5 },
        { i: 'w_donut_deal_stage', x: 4, y: 13, w: 4, h: 5 },
        { i: 'w_column_line_dual', x: 8, y: 13, w: 4, h: 5 },
        { i: 'w_line_line_multi', x: 0, y: 18, w: 6, h: 5 },
        { i: 'w_line_bar_combo', x: 6, y: 18, w: 6, h: 5 },
        { i: 'w_table_deals', x: 0, y: 23, w: 12, h: 6 },
      ],
      widgets: {
        w_text_header: {
          id: 'w_text_header', type: 'text', title: 'Header',
          config: { content: 'FY2025 Sales & GTM Analytics — All Regions, All Segments', variant: 'heading', alignment: 'left' },
        },
        w_counter_arr: {
          id: 'w_counter_arr', type: 'counter', title: 'Annual Recurring Revenue',
          config: {
            value: 24800000, format: 'currency', prefix: '$', decimals: 0,
            trend: { value: 18.6, direction: 'up', sentiment: 'positive', label: 'YoY growth' },
            sparkline: { data: [16800000, 18400000, 20100000, 21500000, 23200000, 24800000], type: 'line' },
          },
        },
        w_counter_nrr: {
          id: 'w_counter_nrr', type: 'counter', title: 'Net Revenue Retention',
          config: {
            value: 118, format: 'percentage', suffix: '%', decimals: 0,
            trend: { value: 4, direction: 'up', sentiment: 'positive', label: 'vs last year (114%)' },
          },
        },
        w_counter_cac: {
          id: 'w_counter_cac', type: 'counter', title: 'Customer Acquisition Cost',
          config: {
            value: 12400, format: 'currency', prefix: '$', decimals: 0,
            trend: { value: 8.2, direction: 'down', sentiment: 'positive', label: 'vs Q3 ($13,500)' },
          },
        },
        w_counter_churn: {
          id: 'w_counter_churn', type: 'counter', title: 'Gross Churn Rate',
          config: {
            value: 4.2, format: 'percentage', suffix: '%', decimals: 1,
            trend: { value: 0.8, direction: 'up', sentiment: 'negative', label: 'vs Q3 (3.4%)' },
            sparkline: { data: [3.1, 2.8, 3.4, 4.2], type: 'bar' },
          },
        },
        w_line_mrr: {
          id: 'w_line_mrr', type: 'chart', title: 'Monthly Recurring Revenue Trend', subtitle: 'Last 12 months',
          config: {
            chartType: 'line',
            highchartsOptions: {
              chart: { type: 'line' },
              title: { text: null },
              xAxis: { categories: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'] },
              yAxis: [{ title: { text: 'MRR ($)' }, labels: { format: '${value:,.0f}' }, min: 0 }],
              series: [{ name: 'MRR', data: [1680000, 1730000, 1790000, 1840000, 1890000, 1935000, 1980000, 2020000, 2050000, 2080000, 2060000, 2066000], marker: { enabled: true, radius: 3, symbol: 'circle' } }],
              tooltip: { shared: true, valuePrefix: '$' },
              legend: { enabled: false },
              credits: { enabled: false },
            },
          },
        },
        w_area_pipeline: {
          id: 'w_area_pipeline', type: 'chart', title: 'Pipeline Value Over Time', subtitle: 'Stacked by stage — last 6 months',
          config: {
            chartType: 'area',
            highchartsOptions: {
              chart: { type: 'area' },
              title: { text: null },
              xAxis: { categories: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'] },
              yAxis: [{ title: { text: 'Pipeline ($)' }, labels: { format: '${value:,.0f}' }, stackLabels: { enabled: false } }],
              series: [
                { name: 'Prospecting', data: [2800000, 3100000, 2900000, 3200000, 3400000, 3200000] },
                { name: 'Discovery', data: [2200000, 2400000, 2600000, 2500000, 2800000, 2850000] },
                { name: 'Proposal', data: [1800000, 1900000, 2100000, 2300000, 2400000, 2600000] },
                { name: 'Negotiation', data: [1200000, 1400000, 1500000, 1800000, 2000000, 2150000] },
              ],
              plotOptions: { area: { stacking: 'normal', lineWidth: 1, marker: { enabled: false } } },
              tooltip: { shared: true, valuePrefix: '$' },
              legend: { enabled: true, align: 'center', verticalAlign: 'bottom', layout: 'horizontal' },
              credits: { enabled: false },
            },
          },
        },
        w_column_bookings: {
          id: 'w_column_bookings', type: 'chart', title: 'New Bookings by Quarter', subtitle: 'FY2025 vs FY2024',
          config: {
            chartType: 'column',
            highchartsOptions: {
              chart: { type: 'column' },
              title: { text: null },
              xAxis: { categories: ['Q1', 'Q2', 'Q3', 'Q4'] },
              yAxis: [{ title: { text: 'Bookings ($)' }, labels: { format: '${value:,.0f}' }, min: 0 }],
              series: [
                { name: 'FY2024', data: [1800000, 2100000, 2400000, 2650000] },
                { name: 'FY2025', data: [2200000, 2700000, 3100000, 3250000] },
              ],
              plotOptions: { column: { borderRadius: 4, groupPadding: 0.15 } },
              tooltip: { shared: true, valuePrefix: '$' },
              legend: { enabled: true, align: 'center', verticalAlign: 'bottom', layout: 'horizontal' },
              credits: { enabled: false },
            },
          },
        },
        w_bar_rep_perf: {
          id: 'w_bar_rep_perf', type: 'chart', title: 'Top Reps by Closed-Won Revenue', subtitle: 'Q4 FY2025 — horizontal bar',
          config: {
            chartType: 'bar',
            highchartsOptions: {
              chart: { type: 'bar' },
              title: { text: null },
              xAxis: { categories: ['S. Chen', 'M. Johnson', 'P. Patel', 'A. Rivera', 'J. Lee', 'T. Williams', 'K. Nakamura'], labels: { style: { fontSize: '12px' } } },
              yAxis: [{ title: { text: 'Closed-Won ($)' }, labels: { format: '${value:,.0f}' }, min: 0 }],
              series: [{ name: 'Closed-Won', data: [820000, 710000, 485000, 420000, 310000, 285000, 220000] }],
              plotOptions: { bar: { borderRadius: 4, dataLabels: { enabled: true, format: '${y:,.0f}' } } },
              tooltip: { valuePrefix: '$' },
              legend: { enabled: false },
              credits: { enabled: false },
            },
          },
        },
        w_pie_revenue_source: {
          id: 'w_pie_revenue_source', type: 'chart', title: 'Revenue by Source', subtitle: 'Q4 closed-won attribution',
          config: {
            chartType: 'pie',
            highchartsOptions: {
              chart: { type: 'pie' },
              title: { text: null },
              series: [{ name: 'Revenue', data: [
                { name: 'Outbound Sales', y: 1350000 },
                { name: 'Inbound Marketing', y: 890000 },
                { name: 'Partner/Channel', y: 620000 },
                { name: 'Expansion/Upsell', y: 540000 },
                { name: 'Self-Serve', y: 180000 },
              ] }],
              plotOptions: { pie: { allowPointSelect: true, cursor: 'pointer', dataLabels: { enabled: true, format: '{point.name}: {point.percentage:.1f}%' } } },
              tooltip: { pointFormat: '{point.name}: <b>${point.y:,.0f}</b> ({point.percentage:.1f}%)' },
              legend: { enabled: false },
              credits: { enabled: false },
            },
          },
        },
        w_donut_deal_stage: {
          id: 'w_donut_deal_stage', type: 'chart', title: 'Open Deals by Stage', subtitle: 'Deal count distribution',
          config: {
            chartType: 'donut',
            highchartsOptions: {
              chart: { type: 'pie' },
              title: { text: null },
              series: [{ name: 'Deals', innerSize: '60%', data: [
                { name: 'Prospecting', y: 42 },
                { name: 'Discovery', y: 28 },
                { name: 'Proposal', y: 18 },
                { name: 'Negotiation', y: 12 },
                { name: 'Closing', y: 7 },
              ] }],
              plotOptions: { pie: { dataLabels: { enabled: true, format: '{point.name}: {point.y}' } } },
              tooltip: { pointFormat: '{point.name}: <b>{point.y} deals</b> ({point.percentage:.1f}%)' },
              legend: { enabled: false },
              credits: { enabled: false },
            },
          },
        },
        w_column_line_dual: {
          id: 'w_column_line_dual', type: 'chart', title: 'Bookings vs Win Rate', subtitle: 'Dual axis — column + line',
          config: {
            chartType: 'column-line',
            highchartsOptions: {
              chart: { type: 'column' },
              title: { text: null },
              xAxis: { categories: ['Q1', 'Q2', 'Q3', 'Q4'] },
              yAxis: [
                { title: { text: 'Bookings ($)' }, labels: { format: '${value:,.0f}' } },
                { title: { text: 'Win Rate (%)' }, labels: { format: '{value}%' }, opposite: true, min: 0, max: 50 },
              ],
              series: [
                { name: 'Bookings', type: 'column', data: [2200000, 2700000, 3100000, 3250000], yAxis: 0 },
                { name: 'Win Rate', type: 'line', data: [26.1, 28.5, 29.3, 32.4], yAxis: 1, marker: { enabled: true, radius: 5 } },
              ],
              tooltip: { shared: true },
              legend: { enabled: true, align: 'center', verticalAlign: 'bottom', layout: 'horizontal' },
              credits: { enabled: false },
            },
          },
        },
        w_line_line_multi: {
          id: 'w_line_line_multi', type: 'chart', title: 'Pipeline Created by Segment', subtitle: 'Monthly trend — multi-line',
          config: {
            chartType: 'line-line',
            highchartsOptions: {
              chart: { type: 'line' },
              title: { text: null },
              xAxis: { categories: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'] },
              yAxis: [{ title: { text: 'Pipeline Created ($)' }, labels: { format: '${value:,.0f}' }, min: 0 }],
              series: [
                { name: 'Enterprise', data: [1200000, 1350000, 1100000, 1500000, 1400000, 1650000], marker: { symbol: 'circle' } },
                { name: 'Mid-Market', data: [800000, 920000, 880000, 1050000, 1100000, 1020000], marker: { symbol: 'diamond' } },
                { name: 'SMB', data: [450000, 520000, 480000, 600000, 580000, 640000], marker: { symbol: 'square' } },
              ],
              tooltip: { shared: true, valuePrefix: '$' },
              legend: { enabled: true, align: 'center', verticalAlign: 'bottom', layout: 'horizontal' },
              credits: { enabled: false },
            },
          },
        },
        w_line_bar_combo: {
          id: 'w_line_bar_combo', type: 'chart', title: 'Outbound Activity vs Meetings Booked', subtitle: 'Dual axis — bar + line',
          config: {
            chartType: 'line-bar',
            highchartsOptions: {
              chart: { type: 'bar' },
              title: { text: null },
              xAxis: { categories: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'] },
              yAxis: [
                { title: { text: 'Emails Sent' }, labels: { format: '{value:,.0f}' } },
                { title: { text: 'Meetings Booked' }, labels: { format: '{value}' }, opposite: true },
              ],
              series: [
                { name: 'Outbound Emails', type: 'bar', data: [4200, 4800, 5100, 3900, 5500, 5800], yAxis: 0 },
                { name: 'Meetings Booked', type: 'line', data: [68, 82, 91, 64, 105, 112], yAxis: 1, marker: { enabled: true, radius: 5, symbol: 'circle' } },
              ],
              tooltip: { shared: true },
              legend: { enabled: true, align: 'center', verticalAlign: 'bottom', layout: 'horizontal' },
              credits: { enabled: false },
            },
          },
        },
        w_table_deals: {
          id: 'w_table_deals', type: 'table', title: 'Active Deals Pipeline', subtitle: 'All open opportunities — sorted by expected close date',
          config: {
            columns: [
              { id: 'col_deal_name', field: 'dealName', header: 'Deal', dataType: 'string', width: 220 },
              { id: 'col_account', field: 'accountName', header: 'Account', dataType: 'string', width: 180 },
              { id: 'col_rep', field: 'repName', header: 'Owner', dataType: 'string', width: 140 },
              {
                id: 'col_stage', field: 'stage', header: 'Stage', dataType: 'string', sortable: true, filterable: true,
                format: { badge: { mapping: {
                  Prospecting: {},
                  Discovery: {},
                  Proposal: {},
                  Negotiation: {},
                  Closing: {},
                } } },
              },
              { id: 'col_amount', field: 'amount', header: 'Amount', dataType: 'currency', format: { abbreviate: true, prefix: '$' }, sortable: true },
              {
                id: 'col_probability', field: 'probability', header: 'Prob %', dataType: 'percentage', sortable: true,
                format: { suffix: '%', decimals: 0, progressBar: { maxValue: 100, colorThresholds: [{ value: 30 }, { value: 60 }, { value: 100 }] } },
              },
              { id: 'col_close_date', field: 'expectedCloseDate', header: 'Expected Close', dataType: 'date', format: { dateFormat: 'MMM D, YYYY' }, sortable: true },
              {
                id: 'col_days_in_stage', field: 'daysInStage', header: 'Days in Stage', dataType: 'number', sortable: true,
                format: { colorScale: { type: 'threshold', thresholds: [{ value: 14, label: 'On Track' }, { value: 30, label: 'Slow' }, { value: 999, label: 'Stalled' }] } },
              },
              {
                id: 'col_segment', field: 'segment', header: 'Segment', dataType: 'string', filterable: true,
                format: { badge: { mapping: { Enterprise: {}, 'Mid-Market': {}, SMB: {} } } },
              },
            ],
            pagination: { enabled: true, pageSize: 15, pageSizeOptions: [10, 15, 25, 50] },
            sorting: { enabled: true, defaultSort: { field: 'expectedCloseDate', direction: 'asc' } },
            rowStyles: [
              { condition: { field: 'daysInStage', operator: 'gt', value: 30 }, sentiment: 'negative', style: {} },
              { condition: { field: 'probability', operator: 'gte', value: 80 }, sentiment: 'positive', style: { fontWeight: '600' } },
            ],
          },
        },
      },
      filters: [
        {
          id: 'filter_time', label: 'Time Period', field: 'period', type: 'select',
          options: [
            { value: '30d', label: 'Last 30 days' },
            { value: '90d', label: 'Last 90 days' },
            { value: 'q4', label: 'Q4 FY2025' },
            { value: 'ytd', label: 'Year to date' },
            { value: '1y', label: 'Last 12 months' },
          ],
          defaultValue: 'q4',
        },
        {
          id: 'filter_segment', label: 'Segment', field: 'segment', type: 'multi-select',
          options: [
            { value: 'enterprise', label: 'Enterprise', count: 18 },
            { value: 'mid-market', label: 'Mid-Market', count: 34 },
            { value: 'smb', label: 'SMB', count: 52 },
          ],
        },
        {
          id: 'filter_region', label: 'Region', field: 'region', type: 'multi-select',
          options: [
            { value: 'na', label: 'North America', count: 48 },
            { value: 'emea', label: 'EMEA', count: 35 },
            { value: 'apac', label: 'APAC', count: 21 },
          ],
        },
        {
          id: 'filter_deal_size', label: 'Deal Size', field: 'amount', type: 'range',
          range: { min: 0, max: 500000, step: 10000 },
        },
        {
          id: 'filter_owner', label: 'Deal Owner', field: 'repName', type: 'search',
          affectedWidgets: ['w_table_deals'],
        },
      ],
      createdAt: '2025-01-02T08:00:00Z',
      updatedAt: '2025-02-24T16:00:00Z',
      createdBy: 'user_revops_admin',
      analysisId: 'analysis_full_gtm_fy25',
    },
    refreshInfo: {
      lastRefreshedAt: '2025-02-24T15:30:00Z',
      refreshStatus: 'idle',
      nextScheduledRefresh: '2025-02-24T16:30:00Z',
      refreshIntervalMinutes: 60,
      cacheExpiresAt: '2025-02-25T03:30:00Z',
      dataSource: {
        analysisId: 'analysis_full_gtm_fy25',
        analysisName: 'Full GTM Analytics FY2025',
        dataFreshness: 'fresh',
      },
    },
  },
};

// ─── Widget Data Fixtures (API 2) ────────────────────────────────

export const gtmRepLeaderboardData: WidgetDataResponse = {
  success: true,
  data: {
    widgets: {
      w_rep_leaderboard: {
        widgetId: 'w_rep_leaderboard',
        tableData: {
          rows: [
            { rank: 1, repName: 'Sarah Chen', team: 'Enterprise', closedWon: 820000, quotaAttainment: 136, dealsClosed: 6, winRate: 42.9, openPipeline: 1450000 },
            { rank: 2, repName: 'Marcus Johnson', team: 'Enterprise', closedWon: 710000, quotaAttainment: 118, dealsClosed: 5, winRate: 38.5, openPipeline: 980000 },
            { rank: 3, repName: 'Priya Patel', team: 'Mid-Market', closedWon: 485000, quotaAttainment: 108, dealsClosed: 11, winRate: 35.5, openPipeline: 720000 },
            { rank: 4, repName: 'Alex Rivera', team: 'Mid-Market', closedWon: 420000, quotaAttainment: 93, dealsClosed: 9, winRate: 31.0, openPipeline: 650000 },
            { rank: 5, repName: 'Jordan Lee', team: 'SMB', closedWon: 310000, quotaAttainment: 86, dealsClosed: 18, winRate: 40.0, openPipeline: 380000 },
          ],
          totalRows: 24, page: 1, pageSize: 10, totalPages: 3,
        },
      },
    },
    meta: { fetchedAt: '2025-02-24T14:30:00Z', cacheHit: true, dataFreshness: 'fresh' },
  },
};

// ─── Fixture Lookup ──────────────────────────────────────────────

const fixtureMap: Record<string, DashboardMetadataResponse> = {
  dash_sales_exec_001: salesExecDashboard,
  dash_gtm_perf_002: gtmPerfDashboard,
  dash_full_showcase_003: fullShowcaseDashboard,
};

export function getDashboardFixture(dashboardId: string): DashboardMetadataResponse | null {
  return fixtureMap[dashboardId] ?? null;
}

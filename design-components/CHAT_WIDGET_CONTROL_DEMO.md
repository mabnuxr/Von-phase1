# Chat-Driven Dashboard Widget Control - Demo Guide

## Overview

The dashboard now supports **natural language widget management** directly from the chat interface. You can create, edit, and configure widgets using conversational commands without manually dragging components or clicking through menus.

## Key Features

### 1. Natural Language Widget Creation
Create widgets by simply describing what you want in the chat:

**Example Commands:**
- "Build me a bar chart showing data from the pipeline overview report"
- "Add a line chart from deals at risk"
- "Create a metric card from account health"
- "Make a pie chart"
- "Add a data table showing rep performance"

**What Happens:**
1. The system parses your intent (chart type + data source)
2. Shows an approval popover with full configuration details
3. Creates the widget on your dashboard after approval
4. Widget is immediately visible and interactive

### 2. Chat-Driven Widget Editing
Select any widget and ask to edit it:

**Example Commands:**
- "Edit this widget"
- "Change this chart"
- "Modify the widget"
- "Update this visualization"

**What Happens:**
1. Configuration panel opens in Pane1 (left side)
2. Live preview shows changes in real-time
3. Save or discard changes as needed
4. Widget updates immediately on save

### 3. Intelligent Intent Parsing

The system understands:

**Chart Types:**
- Bar chart / bar graph → Bar Chart
- Line chart / line graph → Line Chart
- Pie chart → Pie Chart
- Donut chart → Donut Chart
- Metric / KPI → Metric Card
- Table / data table → Data Table

**Data Sources:**
- "pipeline overview" → Pipeline Overview Report
- "deals at risk" → Deals at Risk Report
- "account health" → Account Health Scorecard
- "renewals at risk" → Renewals at Risk Report
- "rep performance" → Rep Performance Dashboard

**Actions:**
- add, create, build, make → Create new widget
- edit, change, modify, update → Edit existing widget

## Demo Flow

### Demo 1: Create Widget from Chat

1. **Open the dashboard** (Storybook: `3-Pane/Jan30/Manual Dashboard`)

2. **Type in chat:**
   ```
   Build me a bar chart showing data from the pipeline overview report
   ```

3. **Show the approval popover** that appears with:
   - Widget type (Bar Chart)
   - Data source (Pipeline Overview)
   - Configuration details
   - What the user will get

4. **Click "Add Widget"** to approve

5. **Widget appears** on the dashboard with:
   - Proper chart visualization
   - Connected to the correct data source
   - Interactive and resizable

### Demo 2: Create Different Chart Types

**Try these commands in sequence:**

```
Add a line chart from deals at risk
```
→ Creates a line chart

```
Create a metric card from account health
```
→ Creates a metric card

```
Make a pie chart
```
→ Creates a pie chart (defaults to pipeline overview)

```
Add a data table showing rep performance
```
→ Creates a full-width data table

### Demo 3: Edit Widget via Chat

1. **Click on any widget** to select it (shows blue border)

2. **Type in chat:**
   ```
   Edit this widget
   ```

3. **Configuration panel opens** in Pane1 showing:
   - Widget title field
   - Data source selector
   - Filter options
   - Live preview in Pane2

4. **Make changes:**
   - Change the title
   - Select different data source
   - Add filters

5. **Click "Save"** to apply changes

6. **Widget updates** immediately with new configuration

### Demo 4: End-to-End Workflow

**Show the complete workflow:**

1. **Start with empty dashboard**

2. **Chat command:**
   ```
   Build me a bar chart showing data from the pipeline overview report
   ```

3. **Approve** → Widget created

4. **Select the widget** (click on it)

5. **Chat command:**
   ```
   Edit this widget
   ```

6. **Modify** the title to "Q4 Pipeline Analysis"

7. **Save** changes

8. **Add another widget:**
   ```
   Add a metric card from account health
   ```

9. **Show** how both widgets work together

## Technical Implementation

### Widget Intent Parser
Located in `ManualDashboard.stories.tsx`:

```typescript
interface WidgetIntent {
  action: 'create' | 'edit' | 'none';
  chartType?: 'bar' | 'line' | 'pie' | 'donut' | 'metric' | 'table';
  reportId?: string;
  reportName?: string;
}

const parseWidgetIntent = (message: string): WidgetIntent => {
  // Parses natural language to extract:
  // - Action (create/edit)
  // - Chart type
  // - Data source reference
}
```

### Message Handler
Enhanced `handleSendMessage` function:

1. **Parses user message** for widget intent
2. **Creates approval popover** for widget creation
3. **Opens configuration panel** for widget editing
4. **Provides contextual responses** based on intent

### Approval Flow
- Uses existing `ChatPane` popover system
- Shows detailed configuration preview
- Allows user to approve or cancel
- Integrates with existing widget creation logic

## Benefits

### For Users
- **Faster workflow**: Create widgets in seconds with natural language
- **No learning curve**: Just describe what you want
- **Contextual**: System understands your current dashboard context
- **Flexible**: Still supports drag-and-drop for those who prefer it

### For Your Team
- **Impressive demo**: Shows AI-driven UI control
- **Scalable pattern**: Can extend to other dashboard operations
- **Production-ready**: Built on existing components and patterns
- **Fully integrated**: Works with all existing features

## Testing Commands

Copy-paste these to test:

```
Build me a bar chart showing data from the pipeline overview report
Add a line chart from deals at risk
Create a metric card from account health
Make a pie chart
Add a data table showing rep performance
Edit this widget
Change this chart
Modify the widget
```

## Future Enhancements

Potential extensions:
- "Delete this widget"
- "Move this widget to the top"
- "Resize this widget to full width"
- "Duplicate this widget"
- "Change this to a line chart"
- "Add a filter for region = West"
- "Show me widgets from pipeline overview"

## Files Modified

- `design-components/src/storybook/three-pane/Jan30/ManualDashboard.stories.tsx`
  - Added `parseWidgetIntent()` function
  - Added `getWidgetCreationApprovalContent()` function
  - Enhanced `handleSendMessage()` with intent parsing
  - Updated widget approval flow to include report data
  - Added edit widget flow triggered from chat

## Demo Tips

1. **Start with the problem**: "Manually creating widgets takes too many clicks"
2. **Show the solution**: "Just tell Von what you want"
3. **Demonstrate speed**: Create 3-4 widgets in under a minute
4. **Show editing**: Select and edit via chat
5. **Highlight intelligence**: System understands different phrasings
6. **End with vision**: "This is just the beginning - imagine controlling your entire dashboard through conversation"

---

**Ready to demo!** Open Storybook and navigate to `3-Pane/Jan30/Manual Dashboard` to start.

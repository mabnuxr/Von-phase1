**Von AI \+ Salesforce Tooling API**

# 

# **Summary**

The Salesforce Tooling API provides direct, queryable access to org metadata via REST endpoints. Unlike the file-based Metadata API, Tooling API enables **real-time, synchronous CRUD operations** on configuration components—making it ideal for building interactive admin tools within Von.

| Key Benefits for Von: • No Metadata API complexity—direct REST calls with JSON payloads • Synchronous responses—instant feedback for user actions • Granular access—modify single fields without deploying entire objects • Query-based discovery—SOQL-style queries against metadata |
| :---- |

# **How It Fits Into Von's Architecture**

| User Request | Von Processing | Tooling API Action |
| :---- | :---- | :---- |
| "Create a picklist field on Account for deal source" | Intent classification → Field creation tool → Parameter extraction | POST /tooling/sobjects/CustomField/ |
| "Turn off the validation rule blocking closed deals" | Search validation rules → Match by name/object → Confirm action | PATCH /tooling/sobjects/ValidationRule/{id} |
| "Show me all flows on Opportunity" | Query intent → Filter by object → Format results | GET /tooling/query?q=SELECT...FROM FlowDefinitionView |

# **Use Cases Enabled by Tooling API**

## **1\. Fields & Objects Management**

| Capability | User Prompt Example | Support |
| :---- | :---- | :---- |
| Create custom fields | "Add a currency field for expected revenue" | ✓ Full CRUD |
| Create custom objects | "Create an Invoice object with auto-number" | ✓ Full CRUD |
| Modify picklist values | "Add 'Partner Referral' to Lead Source" | ✓ Full CRUD |
| Delete unused fields | "Remove all custom fields not used in 6 months" | ✓ Full CRUD |
| Query field metadata | "Which fields on Contact are required?" | ✓ Read |

## **2\. Automation & Business Logic**

| Capability | User Prompt Example | Support |
| :---- | :---- | :---- |
| Create validation rules | "Require Amount when Stage is Closed Won" | ✓ Full CRUD |
| Toggle validation rules | "Disable the rule blocking incomplete accounts" | ✓ Full CRUD |
| Activate/deactivate flows | "Turn off the Opportunity update flow" | ✓ Update |
| View flow inventory | "List all record-triggered flows on Lead" | ✓ Read |
| Delete inactive flows | "Clean up all draft flows older than 90 days" | ⚠ Conditional |
| Manage workflow rules | "Show me all active workflow rules on Case" | ✓ Full CRUD |

## **3\. Security & Permissions**

| Capability | User Prompt Example | Support |
| :---- | :---- | :---- |
| View permission sets | "What permissions does Sales Rep PS have?" | ✓ Read/Update |
| Modify field-level security | "Grant read access to Revenue field for Sales" | ✓ Update |
| Query object permissions | "Who has delete access on Opportunities?" | ✓ Read |
| Create permission sets | "Create a new permission set for API users" | ✗ Metadata API |

## **4\. Code & Development Tools**

| Capability | User Prompt Example | Support |
| :---- | :---- | :---- |
| View Apex classes/triggers | "Show me all triggers on Account" | ✓ Full CRUD |
| Check code coverage | "What's our org-wide test coverage?" | ✓ Read |
| Run Apex tests | "Run tests for the AccountHandler class" | ✓ Execute |
| Access debug logs | "Get the latest debug logs for my user" | ✓ Read |
| Execute anonymous Apex | "Run this Apex to update records" | ✓ Execute |

## **5\. Org Analysis & Diagnostics**

| Capability | User Prompt Example | Support |
| :---- | :---- | :---- |
| Flow health analysis | "Which flows have DML in loops?" | ✓ Read \+ Parse |
| Unused field detection | "Find custom fields with no data" | ✓ Read |
| Validation rule audit | "List all validation rules with hardcoded IDs" | ✓ Read |
| Object relationship map | "Show me all lookups to Account" | ✓ Read |
| API usage monitoring | "What's our API call consumption?" | ✓ Read |

# **API Pattern**

All Tooling API operations follow a consistent REST pattern:

| Operation | Endpoint Pattern |
| :---- | :---- |
| Query | GET  /services/data/v60.0/tooling/query?q=SELECT...FROM {Object} |
| Create | POST /services/data/v60.0/tooling/sobjects/{Object}/ |
| Read | GET  /services/data/v60.0/tooling/sobjects/{Object}/{id} |
| Update | PATCH /services/data/v60.0/tooling/sobjects/{Object}/{id} |
| Delete | DELETE /services/data/v60.0/tooling/sobjects/{Object}/{id} |

# 

# **Required User Permissions**

Users performing admin actions via Von will need these Salesforce permissions:

| Permission | Enables |
| :---- | :---- |
| API Enabled | Any API access (required for all operations) |
| Customize Application | Create/modify fields, objects, validation rules, layouts |
| Manage Flows | Create, edit, activate, delete flows |
| View Setup and Configuration | Read metadata (required for queries) |
| Modify All Data | Some Tooling objects require this |
| Author Apex | Create/modify Apex classes and triggers |

# **Limitations (Requires Metadata API)**

The following operations are not available via Tooling API and would require Metadata API integration:

• Create or delete Permission Sets (read/update only)  
• Create or delete Profiles  
• Custom Labels and Translations  
• Bulk deployments (50+ components simultaneously)  
• Global Value Sets (standalone, not on fields)

# **Success Test Questions**

Sample prompts to validate each capability area is working correctly:

| Category | Test Questions |
| :---- | :---- |
| **Fields & Objects** | • "How many custom fields are on the Account object?" • "Create a picklist field called 'Priority' on Contact with values High, Medium, Low" • "Which custom fields on Opportunity were created in the last 30 days?" • "Delete the custom field Test\_Field\_\_c from Lead" |
| **Automation** | • "List all active flows in the org" • "How many validation rules are on the Opportunity object?" • "Deactivate the flow named 'Update\_Account\_Owner'" • "Create a validation rule on Case that requires Description when Status is Escalated" • "Show me all record-triggered flows on the Lead object" |
| **Security** | • "What object permissions does the Sales User permission set have?" • "Which profiles have delete access on Opportunities?" • "Show field-level security for the Revenue\_\_c field" • "Grant read access to Annual\_Revenue\_\_c for the Marketing permission set" |
| **Code & Dev** | • "What is the org-wide code coverage percentage?" • "List all Apex triggers on the Account object" • "Run all tests in the AccountHandlerTest class" • "Show me the most recent debug logs for my user" • "Which Apex classes have less than 75% coverage?" |
| **Org Analysis** | • "Which flows have DML operations inside loops?" • "Find all validation rules that contain hardcoded record IDs" • "List all lookup relationships pointing to the Account object" • "How many API calls have we used today?" • "Which custom fields have null values in more than 90% of records?" |

*Rattle Software | Von AI | Confidential*
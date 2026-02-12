# Salesforce Tooling Api
- I want to implement saleforce tooling Api in my agent v2.

- We already have tools provided by scalekit for the salesforce tooling api.    
    * We need to add this to `agent v2` following all the existing conditions.
    * All the tools avaialable for the listed in the `Scalekit Tooling Api` section.
    * Need to figure out how to add these to our agent v2 while following all the new paridgms introduced in V2 like skills.
    * Since there are many tools, we want to explore an idea about writing an tool that can accepts an action and expore the required request models for that action and inside we can invoke the appropraite tool. This reduces the number of tools in the agent right.
    * Also in the plan write a section about the use cases in which users of can use the salesforce tooling api. This would help me test it. 
    *We also need to make sure this fits seamlessly with the existing agent v2.  


## Scalekit Tooling Api

-  **Tooling API SOQL Query** - execute soql queries against salesforce tooling api to access metadata objects like ApexClass, ApexTrigger, CustomObject, and development metadata. Use this for querying metadata rather than data objects.

```python
response = scalekit.actions.execute_tool(
  tool_name="salesforce_tooling_query_execute",
  identifier="prudhvi@vonlabs.ai",
  tool_input={
    "soql_query": "SOQL query for metadata objects (e.g., SELECT Id, Name FROM ApexClass WHERE Status = 'Active')"
  }
)
```

- **Create Tooling SObject** - Create a new metadata record for any salesforce Tooling Api object type (ApexClass, ApexTrigger, CustomField rtc). Supports both simple and nested field structures. For customer filed use FullName & Metadata properties.

```python
#Provide the fields/structure required by the SObject type. Simple: {"Name": "MyApexClass", "Body": "public class MyApexClass { }"} or Nested: {"FullName": "Account.Field__c", "Metadata": {"type": "Text", "label": "Label", "length": 100}}

response = scalekit.actions.execute_tool(
  tool_name="salesforce_tooling_sobject_create",
  identifier="prudhvi@vonlabs.ai",
  tool_input={
    "fields": {
      "FullName": "Account.Field__c",
      "Metadata": {
        "type": "Text",
        "label": "Label",
        "length": 100
      }
    },
    "sobject_type": "test"
  }
)

```

- **Describe Tooling SObject** - Retrieve detailed metadata schema for specific Tooling API Object Type. Returns fields, relationships, and other metadata properties.

```python
response = scalekit.actions.execute_tool(
  tool_name="salesforce_tooling_sobject_describe",
  identifier="prudhvi@vonlabs.ai",
  tool_input={
    "sobject_type": "CustomField"
  }
)
```

- **Get Tooling SObject** - Retrieve a metadata record from any salesforce Api object type by ID. Optionally specify what fields to return.

```python
response = scalekit.actions.execute_tool(
  tool_name="salesforce_tooling_sobject_get",
  identifier="prudhvi@vonlabs.ai",
  tool_input={
    "sobject_type": "ApexClass",
    "record_id": "01pxx0000004XXXAAA",
    "fields": ["Id", "Name", "Body", "Status"]
  }
)
```

- **Update Tooling SObject** – Update an existing metadata record for any Salesforce Tooling API object type by ID. Supports both simple and nested field structures. Only the fields provided will be updated.

```python
response = scalekit.actions.execute_tool(
  tool_name="salesforce_tooling_sobject_update",
  identifier="prudhvi@vonlabs.ai",
  tool_input={
    "fields": {
      "Metadata": {
        "label": "New Label",
        "description": "Updated"
      }
    },
    "record_id": "test record",
    "sobject_type": "test object type"
  }
)
```

- **Delete Tooling SObject** – Delete a metadata record from any Salesforce Tooling API object type by ID. This is a destructive operation that permanently removes the metadata.

```python
    response = scalekit.actions.execute_tool(
      tool_name="salesforce_tooling_sobject_delete",
      identifier="prudhvi@vonlabs.ai",
      tool_input={
        "record_id": "aasdasd",
        "sobject_type": "sdasdas"
      }
    )
```
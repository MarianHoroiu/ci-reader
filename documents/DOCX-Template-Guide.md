# DOCX Template Guide

## Overview

This application uses [docx-templates](https://www.npmjs.com/package/docx-templates) to fill DOCX
documents with Romanian ID data. You can create Word templates with placeholders that get replaced
with actual person data.

## Available Data Fields

When creating templates, you have access to the following Romanian ID data fields:

### Personal Information

- `{nume}` - Last name (Nume)
- `{prenume}` - First name (Prenume)
- `{cnp}` - Personal Numeric Code (CNP)
- `{nationalitate}` - Nationality (Naționalitate)
- `{sex}` - Gender (Sex)
- `{data_nasterii}` - Birth date (Data nașterii) - **Note: Not visible on ID card, derived from
  CNP**
- `{locul_nasterii}` - Place of birth (Locul nașterii)

### Address Information

- `{domiciliul}` - Address (Domiciliul)

### Document Information

- `{tip_document}` - Document type (Tip document)
- `{seria_buletin}` - Series (Seria) - **Note: Use seria_buletin, not seria**
- `{numar_buletin}` - Number (Numărul) - **Note: Use numar_buletin, not numar**
- `{data_eliberarii}` - Issue date (Data eliberării)
- `{valabil_pana_la}` - Valid until (Valabil până la)
- `{eliberat_de}` - Issued by (Eliberat de)

## Template Creation Guide

### 1. Basic Field Insertion

Simply use curly braces around field names:

```
Name: {prenume} {nume}
CNP: {cnp}
Address: {domiciliul}
```

### 2. Conditional Content

Show content only if a field has a value:

```
{IF nationalitate}Nationality: {nationalitate}{END-IF}
{IF eliberat_de}Issued by: {eliberat_de}{END-IF}
```

### 3. Default Values

Provide fallback text for missing data:

```
{prenume || 'N/A'} {nume || 'Unknown'}
```

### 4. Date Formatting

You can format dates using JavaScript:

```
Issue Date: {new Date(data_eliberarii).toLocaleDateString('ro-RO')}
```

### 5. Text Transformation

Transform text using JavaScript functions:

```
Name (uppercase): {(prenume + ' ' + nume).toUpperCase()}
```

## Example Template

Here's a complete example for an official document:

```
DECLARATION

I, {prenume} {nume}, holder of Romanian ID card series {seria_buletin} number {numar_buletin},
Personal Numeric Code (CNP) {cnp}, {IF nationalitate}of {nationalitate} nationality, {END-IF}
residing at {domiciliul}, hereby declare that...

{IF data_eliberarii}
ID Card issued on: {new Date(data_eliberarii).toLocaleDateString('ro-RO')}
{END-IF}

{IF valabil_pana_la}
Valid until: {new Date(valabil_pana_la).toLocaleDateString('ro-RO')}
{END-IF}

Date: _______________

Signature: _______________
```

## Template Storage

1. Save your DOCX templates in: `/Users/mario/Desktop/CI-Reader/Documents/Templates/`
2. Templates must have the `.docx` extension
3. The application automatically scans this folder for available templates

## Important Field Name Notes

**⚠️ Common Field Name Errors:**

- Use `{seria_buletin}` instead of `{seria}`
- Use `{numar_buletin}` instead of `{numar}`
- Use `{domiciliul}` instead of `{domiciliu}` or `{address}`
- Use `{eliberat_de}` instead of `{emis_de}` or `{issued_by}`

**📋 Complete Field Reference:**

```
Personal Fields:
- {nume} - Last Name
- {prenume} - First Name
- {cnp} - Personal Numeric Code
- {nationalitate} - Nationality
- {sex} - Gender
- {data_nasterii} - Birth Date (derived from CNP)
- {locul_nasterii} - Birth Place
- {domiciliul} - Address

Document Fields:
- {tip_document} - Document Type
- {seria_buletin} - Series
- {numar_buletin} - Number
- {data_eliberarii} - Issue Date
- {valabil_pana_la} - Valid Until
- {eliberat_de} - Issued By
```

## Tips and Best Practices

1. **Test your templates** - Always test with sample data before using in production
2. **Use IF statements** - Not all ID cards may have all fields populated
3. **Format dates properly** - Use JavaScript date formatting for proper display
4. **Handle missing data** - Use default values or conditional statements
5. **Keep it simple** - Start with basic field replacement, then add complexity
6. **Use exact field names** - Field names are case-sensitive and must match exactly

## Troubleshooting

### Common Issues:

- **Template not appearing**: Check that the file is in the correct folder and has `.docx` extension
- **Fields not filling**: Ensure field names match exactly (case-sensitive)
- **Error processing**: Check that all IF statements have corresponding END-IF
- **Smart quotes**: The system automatically handles Word's smart quotes

### Field-Specific Errors:

- **Series not filling**: Use `{seria_buletin}` not `{seria}`
- **Number not filling**: Use `{numar_buletin}` not `{numar}`
- **Address not filling**: Use `{domiciliul}` not `{domiciliu}`
- **Issued by not filling**: Use `{eliberat_de}` not `{emis_de}`

### Error Messages:

- "Template file not found": Template path is incorrect
- "Template processing errors": Syntax errors in template commands
- "Failed to process document": General processing error
- "Field not found": Field name doesn't match the available fields

## Advanced Features

For more advanced templating features, refer to the
[docx-templates documentation](https://www.npmjs.com/package/docx-templates).

Available advanced features include:

- Loops (FOR/END-FOR)
- Complex JavaScript expressions
- Image insertion
- HTML content embedding
- Custom command delimiters

## Testing Your Templates

Before using templates in production, test them with sample data. You can use this sample data
structure:

```json
{
  "nume": "POPESCU",
  "prenume": "MARIA ELENA",
  "cnp": "2850315123456",
  "nationalitate": "ROMÂNĂ",
  "sex": "F",
  "data_nasterii": "15.03.1985",
  "locul_nasterii": "BUCUREȘTI",
  "domiciliul": "STR. FLORILOR NR. 123, BUCUREȘTI",
  "tip_document": "CARTE DE IDENTITATE",
  "seria_buletin": "RX",
  "numar_buletin": "123456",
  "data_eliberarii": "15.03.2020",
  "valabil_pana_la": "15.03.2030",
  "eliberat_de": "SPCLEP BUCUREȘTI"
}
```

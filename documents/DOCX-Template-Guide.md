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
- `{data_nasterii}` - Birth date (Data nașterii)
- `{locul_nasterii}` - Place of birth (Locul nașterii)

### Address Information

- `{domiciliul}` - Address (Domiciliul)

### Document Information

- `{tip_document}` - Document type (Tip document)
- `{seria}` - Series (Seria)
- `{numar}` - Number (Numărul)
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

I, {prenume} {nume}, holder of Romanian ID card series {seria} number {numar},
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

## Tips and Best Practices

1. **Test your templates** - Always test with sample data before using in production
2. **Use IF statements** - Not all ID cards may have all fields populated
3. **Format dates properly** - Use JavaScript date formatting for proper display
4. **Handle missing data** - Use default values or conditional statements
5. **Keep it simple** - Start with basic field replacement, then add complexity

## Troubleshooting

### Common Issues:

- **Template not appearing**: Check that the file is in the correct folder and has `.docx` extension
- **Fields not filling**: Ensure field names match exactly (case-sensitive)
- **Error processing**: Check that all IF statements have corresponding END-IF
- **Smart quotes**: The system automatically handles Word's smart quotes

### Error Messages:

- "Template file not found": Template path is incorrect
- "Template processing errors": Syntax errors in template commands
- "Failed to process document": General processing error

## Advanced Features

For more advanced templating features, refer to the
[docx-templates documentation](https://www.npmjs.com/package/docx-templates).

Available advanced features include:

- Loops (FOR/END-FOR)
- Complex JavaScript expressions
- Image insertion
- HTML content embedding
- Custom command delimiters

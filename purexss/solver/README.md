# PureXSS CTF - DOMPurify Bypass Challenge

## Overview

This repository contains my writeup and solution for the PureXSS CTF challenge, which focuses on finding bypasses for DOMPurify sanitization. This challenge demonstrates advanced techniques in web security research and XSS vulnerability analysis.

## Challenge Description

The PureXSS CTF presents a web application that uses DOMPurify to sanitize user input before rendering it in the DOM. The goal is to identify and exploit bypasses in the sanitization process to achieve cross-site scripting (XSS) execution.

## Solution Approach

#### Initial Analysis

1. **Target Analysis**: Examined the application's use of DOMPurify for input sanitization
2. **Version Detection**: Identified the specific DOMPurify version and configuration
3. **Parser Behavior Study**: Analyzed differences between DOMPurify's parser and browser HTML parsers
4. **Character Encoding Research**: Investigated how different character encodings affect HTML parsing

#### Methodology

- Research into ISO-2022-JP encoding bypass techniques
- Analysis of how escape sequences affect HTML tag parsing
- Testing of various character encoding combinations
- Exploitation of parser state confusion between sanitization and rendering phases

#### Technical Details

The bypass exploits a fundamental issue in how DOMPurify handles ISO-2022-JP character encoding escape sequences:

1. **Escape Sequence Injection**: `&#x1b;$B` switches to double-byte mode, `&#x1b;(B` switches back to ASCII
2. **Parser State Confusion**: DOMPurify and the browser interpret tag boundaries differently when these sequences are present
3. **Context Manipulation**: Using `<textarea>` tags to hide malicious content during sanitization
4. **Attribute Boundary Breaking**: The encoding confusion allows breaking out of attribute contexts

## Key Findings

The successful bypass exploited character encoding manipulation using ISO-2022-JP escape sequences to confuse DOMPurify's parsing logic.

### Primary Bypass Technique

The core vulnerability leveraged ISO-2022-JP character encoding escape sequences (`&#x1b;$B` and `&#x1b;(B`) to create parsing inconsistencies between DOMPurify and the browser's HTML parser.

### Successful Payloads

1. **Textarea-based bypass:**
```html
<textarea> &#x1b;$B </textarea> &#x1b;(B <a id="</textarea><script>"> </a> <textarea>";alert(1);" </textarea> <a id="</script>"> </a>
```

2. **Anchor tag manipulation:**
```html
<a id="&#x1b;$B"></a>&#x1b;(B<a id="><img src=1 onerror=alert(1)>"></a>
```

3. **Direct encoding variant:**
```html
<a id="\x1b$B"></a>\x1b(B<a id="><img src=x onerror=alert(1)>"></a>
```

### Why This Bypass Worked

- **Character Encoding Confusion**: ISO-2022-JP escape sequences caused DOMPurify to misinterpret tag boundaries
- **Context Switching**: The escape sequences created a context where the sanitizer and browser parsed the HTML differently
- **Tag Nesting Exploitation**: Used textarea elements to hide malicious content during sanitization
- **Attribute Injection**: Leveraged the parsing confusion to inject executable JavaScript in `onerror` handlers

## References

- [DOMPurify GitHub Repository](https://github.com/cure53/DOMPurify)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [great blog] (https://www.sonarsource.com/blog/encoding-differentials-why-charset-matters/)
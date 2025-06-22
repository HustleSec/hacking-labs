const axios = require('axios');

// List of tags to fuzz (from the provided list)
const tagsToTest = [
  'a', 'a2', 'abbr', 'acronym', 'address', 'applet', 'area', 'article', 'aside', 
  'audio', 'audio2', 'b', 'bdi', 'bdo', 'big', 'blink', 'blockquote', 'body', 
  'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code', 'col', 
  'colgroup', 'command', 'content', 'custom tags', 'data', 'datalist', 'dd', 
  'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl', 'dt', 'element', 
  'em', 'embed', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 
  'frame', 'frameset', 'h1', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 
  'iframe', 'iframe2', 'image', 'img', 'input', 'input2', 'input3', 'input4', 
  'ins', 'kbd', 'keygen', 'label', 'legend', 'li', 'link', 'listing', 'main', 
  'map', 'mark', 'marquee', 'menu', 'menuitem', 'meta', 'meter', 'multicol', 
  'nav', 'nextid', 'nobr', 'noembed', 'noframes', 'noscript', 'object', 'ol', 
  'optgroup', 'option', 'output', 'p', 'param', 'picture', 'plaintext', 'pre', 
  'progress', 'q', 'rb', 'rp', 'rt', 'rtc', 'ruby', 's', 'samp', 'script', 
  'section', 'select', 'shadow', 'slot', 'small', 'source', 'spacer', 'span', 
  'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'svg', 'table', 'tbody', 
  'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 
  'track', 'tt', 'u', 'ul', 'var', 'video', 'video2', 'wbr', 'xmp', 'animatetransform'
];

// Base URL for testing
const baseUrl = 'https://0ad400fe03c6316a81e19ee8005c004b.h1-web-security-academy.net/?search=';

// Function to test a single tag
async function testTag(tag) {
  try {
    const response = await axios.get(`${baseUrl}<${tag}>`);
    return {
      tag,
      status: response.status,
      allowed: response.status !== 400 ? 'Allowed' : 'Not Allowed'
    };
  } catch (error) {
    return {
      tag,
      status: error.response ? error.response.status : 'Error',
      allowed: error.response && error.response.status !== 400 ? 'Allowed' : 'Not Allowed'
    };
  }
}

// Main function to fuzz all tags
async function fuzzTags() {
  console.log('Starting tag fuzzing...\n');
  console.log('Tag'.padEnd(15) + 'Status'.padEnd(10) + 'Result');
  console.log('-'.repeat(35));

  const allowedTags = [];
  const notAllowedTags = [];

  for (const tag of tagsToTest) {
    const result = await testTag(tag);
    console.log(`${result.tag.padEnd(15)}${result.status.toString().padEnd(10)}${result.allowed}`);
    
    // Categorize tags
    if (result.allowed === 'Allowed') {
      allowedTags.push(result.tag);
    } else {
      notAllowedTags.push(result.tag);
    }

    // Add a small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\nFuzzing completed.\n');
  console.log('Summary:');
  console.log(`Allowed Tags (${allowedTags.length}):`, allowedTags.join(', '));
  console.log(`Not Allowed Tags (${notAllowedTags.length}):`, notAllowedTags.join(', '));
}

// Run the fuzzer
fuzzTags().catch(err => console.error('Error during fuzzing:', err));
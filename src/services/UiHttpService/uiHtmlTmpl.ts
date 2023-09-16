
export function uiHtml(js: string, style: string, errMsg?: string) {
  return `<html>
<head>
${style}
</head>
<body>
<div id="app-root"></div>
${(errMsg) ? `<div>${errMsg}</div>` : ''}

<script src="/assets/squidletUi.js"></script>
${js}
</body>
</html>
`
}

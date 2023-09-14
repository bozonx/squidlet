
export function uiHtml(js: string, style: string, body: string) {
  return `<html>
<head>
${style}
</head>
<body>
${body}

<script src="/assets/squidletUi.js"></script>
${js}
</body>
</html>
`
}

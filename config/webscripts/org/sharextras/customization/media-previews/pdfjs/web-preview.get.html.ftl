<@markup id="pdfjs-css-dependencies" target="css" action="after" scope="global">
  <@link rel="stylesheet" type="text/css" href="${url.context}/res/extras/components/preview/viewer-common.css" group="${dependencyGroup}" />
  <@link rel="stylesheet" type="text/css" href="${url.context}/res/extras/components/preview/PdfJs.css" group="${dependencyGroup}" />
</@>

<@markup id="pdfjs-js-dependencies" target="js" action="after" scope="global">
  <#-- Extend base web-preview with common methods -->
  <@script type="text/javascript" src="${url.context}/res/extras/components/preview/web-preview-extend.js" group="${dependencyGroup}" />
  <@script type="text/javascript" src="${url.context}/res/extras/components/preview/PdfJs.js" group="${dependencyGroup}" />
  <@script type="text/javascript" src="${url.context}/res/extras/components/preview/pdfjs/compatibility.js" group="${dependencyGroup}" />
  <@script type="text/javascript" src="${url.context}/res/extras/components/preview/pdfjs/pdf.js" group="${dependencyGroup}" />
  <@script type="text/javascript" src="${url.context}/res/extras/components/preview/pdfjs/pdf.worker.js" group="${dependencyGroup}" />
  <@script type="text/javascript" src="${url.context}/res/extras/components/preview/spin.js" group="${dependencyGroup}" />
</@>
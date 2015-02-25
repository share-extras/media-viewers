<@markup id="embed-css-dependencies" target="css" action="after" scope="global">
  <@link rel="stylesheet" type="text/css" href="${url.context}/res/extras/components/preview/viewer-common.css" group="${dependencyGroup}" />
</@>

<@markup id="embed-js-dependencies" target="js" action="after" scope="global">
  <@script type="text/javascript" src="${url.context}/res/extras/components/preview/web-preview-extend.js" group="${dependencyGroup}" />
  <@script type="text/javascript" src="${url.context}/res/extras/components/preview/Embed.js" group="${dependencyGroup}" />
</@>
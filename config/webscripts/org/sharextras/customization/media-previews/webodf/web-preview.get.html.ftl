<@markup id="webodf-css-dependencies" target="css" action="after" scope="global">
  <@link rel="stylesheet" type="text/css" href="${url.context}/res/extras/components/preview/WebODF.css" group="${dependencyGroup}" />
  <@link rel="stylesheet" type="text/css" href="${url.context}/res/extras/modules/webodf/webodf.css" group="${dependencyGroup}" />
</@>

<@markup id="webodf-js-dependencies" target="js" action="after" scope="global">
  <@script type="text/javascript" src="${url.context}/res/extras/components/preview/WebODF.js" group="${dependencyGroup}" />
  <script type="text/javascript" src="${url.context}/res/extras/modules/webodf/webodf.js" group="${dependencyGroup}" />
</@>
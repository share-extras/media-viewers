<@markup id="prettify-css-dependencies" target="css" action="after" scope="global">
  <@link rel="stylesheet" type="text/css" href="${url.context}/res/extras/components/preview/Prettify.css" group="${dependencyGroup}" />
  <@link rel="stylesheet" type="text/css" href="${url.context}/res/extras/modules/prettify/prettify.css" group="${dependencyGroup}" />
</@>

<@markup id="prettify-js-dependencies" target="js" action="after" scope="global">
  <@script type="text/javascript" src="${url.context}/res/extras/components/preview/Prettify.js" group="${dependencyGroup}" />
  <@script type="text/javascript" src="${url.context}/res/extras/modules/prettify/prettify.js" group="${dependencyGroup}" />
</@>
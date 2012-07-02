<#include "/org/alfresco/components/component.head.inc">
<#-- ODF Web Preview -->
<@script type="text/javascript" src="${page.url.context}/res/extras/components/preview/WebODF.js"></@script>
<@link rel="stylesheet" type="text/css" href="${page.url.context}/res/extras/components/preview/WebODF.css" />
<#-- WebODF core files from external JAR -->
<#-- TODO Detect non-DEBUG mode and serve up the non-compressed file webodf/lib/runtime.js -->
<script type="text/javascript" src="${page.url.context}/res/extras/modules/webodf/webodf.js"></script>
<@link rel="stylesheet" type="text/css" href="${page.url.context}/res/extras/modules/webodf/webodf.css" />

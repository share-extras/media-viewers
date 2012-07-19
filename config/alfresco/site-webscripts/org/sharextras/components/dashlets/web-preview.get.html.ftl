<script type="text/javascript">//<![CDATA[
(function() {
   var dashlet = new Alfresco.dashlet.VideoWidget("${args.htmlid}").setOptions(
   {
      "componentId": "${instance.object.id}",
      "siteId": "${page.url.templateArgs.site!""}",
      "nodeRef": "<#if args.nodeRef?exists>${args.nodeRef}<#else></#if>",
      "name": "<#if args.name?exists>${args.name}<#else></#if>"
   }).setMessages(${messages});
   var resizer = new Alfresco.widget.DashletResizer("${args.htmlid}", "${instance.object.id}");
   // Add end resize event handler
   var timer = YAHOO.lang.later(1000, this, function(dashlet, resizer) {
      if (resizer.widgets.resizer)
      {
         resizer.widgets.resizer.on("endResize", function(eventTarget)
         {
            dashlet.onEndResize(eventTarget.height);
         }, dashlet, true);
         timer.cancel();
      }
   }, [dashlet, resizer], true);
   
   var editDashletEvent = new YAHOO.util.CustomEvent("onDashletConfigure");
   editDashletEvent.subscribe(dashlet.onConfigVideoClick, dashlet, true);

   new Alfresco.widget.DashletTitleBarActions("${args.htmlid}").setOptions(
   {
      actions:
      [
<#if userIsSiteManager>
         {
            cssClass: "edit",
            eventOnClick: editDashletEvent,
            tooltip: "${msg("dashlet.edit.tooltip")?js_string}"
         },
</#if>
         {
            cssClass: "help",
            bubbleOnClick:
            {
               message: "${msg("dashlet.help")?js_string}"
            },
            tooltip: "${msg("dashlet.help.tooltip")?js_string}"
         }
      ]
   });
})();
//]]></script>
<div class="dashlet video">
   <div class="title" id="${args.htmlid}-title"><#if node??><a href="${url.context}/page/site/${page.url.templateArgs.site!''}/document-details?nodeRef=${args.nodeRef!''}">${args.name}</a><#else><#if args.name?exists>${args.name}<#else>${msg("header.video")}</#if></#if></div>
   <div class="body" id="${args.htmlid}-body" style="height: ${args.height!400}px;">
      <div class="msg dashlet-padding video-widget-msg" id="${args.htmlid}-msg"></div>
      <div class="video-preview" id="${args.htmlid}-preview"></div>
   </div>
</div>
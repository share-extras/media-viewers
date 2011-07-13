<script type="text/javascript">//<![CDATA[
   new Alfresco.dashlet.VideoWidget("${args.htmlid}").setOptions(
   {
      "componentId": "${instance.object.id}",
      "site": "${page.url.templateArgs.site!""}", 
      "nodeRef": "<#if args.nodeRef?exists>${args.nodeRef}<#else></#if>", 
      "name": "<#if node??>${node.name}</#if>",
      "icon": "<#if node??>${node.icon}</#if>",
      "mimeType": "<#if node??>${node.mimeType}</#if>",
      "size": "<#if node??>${node.size}</#if>"
   }).setMessages(${messages});
   new Alfresco.widget.DashletResizer("${args.htmlid}", "${instance.object.id}");
//]]></script>
<div class="dashlet video">
   <div class="title" id="${args.htmlid}-title"><#if node??><a href="${url.context}/page/site/${page.url.templateArgs.site!''}/document-details?nodeRef=${args.nodeRef!''}">${node.name}</a><#else>${msg("header.video")}</#if></div>
   <div class="toolbar">
      <a id="${args.htmlid}-configVideo-link" href="#" class="theme-color-1">${msg("link.configure")}</a>
   </div>
   <div class="body" id="${args.htmlid}-body" style="height: ${args.height!200}px;">
      <div class="msg video-widget-msg" id="${args.htmlid}-msg"></div>
      <div class="video-preview shadow" id="${args.htmlid}-preview" style="height: ${args.height!200}px;">
         <div class="bd">
            <div id="${args.htmlid}-preview-shadow-swf-div" class="preview-swf no-content">
               <div id="${args.htmlid}-preview-swfPlayerMessage-div" class="msg"></div>
            </div>
         </div>
      </div>
   </div>
</div>
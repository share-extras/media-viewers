<script type="text/javascript">//<![CDATA[
   new Alfresco.dashlet.VideoWidget("${args.htmlid}").setOptions(
   {
      "componentId": "${instance.object.id}",
      "site": "${page.url.templateArgs.site!""}", 
      "nodeRef": "<#if args.nodeRef?exists>${args.nodeRef}<#else></#if>", 
      "name": "<#if node??>${node.name}</#if>",
      "title": "<#if node??>${node.title}</#if>"
   }).setMessages(${messages});
   <#if node??>
   new Alfresco.VideoPreview("${args.htmlid}-preview").setOptions(
   {
      nodeRef: "${args.nodeRef}",
      name: "${node.name?js_string}",
      icon: "${node.icon}",
      mimeType: "${node.mimeType}",
      previews: [<#list node.previews as p>"${p}"<#if (p_has_next)>, </#if></#list>],
      availablePreviews: [<#list node.generatedPreviews as p>"${p.thumbnailName}"<#if (p_has_next)>, </#if></#list>],
      size: "${node.size}"
   }).setMessages(
      ${messages}
         );
   </#if>
   new Alfresco.widget.DashletResizer("${args.htmlid}", "${instance.object.id}");
//]]></script>
<div class="dashlet video">
   <div class="title"><#if node??>${node.title!node.name}<#else>${msg("header.video")}</#if></div>
   <div class="toolbar">
      <a id="${args.htmlid}-configVideo-link" href="#" class="theme-color-1">${msg("link.configure")}</a>
   </div>
   <div class="body" id="${args.htmlid}-body" style="height: ${args.height!200}px;">
      <div class="msg video-widget-msg" id="${args.htmlid}-msg"></div>
      <div class="video-preview shadow" id="${args.htmlid}-preview" style="height: ${args.height!200}px;">
         <div class="bd">
            <div id="${args.htmlid}-preview-shadow-swf-div" class="preview-swf">
               <div id="${args.htmlid}-preview-swfPlayerMessage-div">${msg("label.preparingPreviewer")}</div>
            </div>
         </div>
      </div>
   </div>
</div>
<div id="${args.htmlid}-configDialog" class="config-video">
   <div class="hd">${msg("label.header")}</div>
   <div class="bd">
      <form id="${args.htmlid}-form" action="" method="POST">
         <div class="yui-gd">
            <div class="yui-u first"><label for="${args.htmlid}-video">${msg("label.video")}:</label></div>
            <div class="yui-u" >
               <span id="${args.htmlid}-video" class="video-name"></span>
               <input type="button" id="${args.htmlid}-browse-button" value="${msg("label.browse")}" />
               <input type="hidden" name="nodeRef" id="${args.htmlid}-nodeRef" />
            </div>
         </div>
         <div class="bdft">
            <input type="submit" id="${args.htmlid}-ok" value="${msg("button.ok")}" />
            <input type="button" id="${args.htmlid}-cancel" value="${msg("button.cancel")}" />
         </div>
      </form>
   </div>
</div>
if (model.widgets)
{
   for (var i = 0; i < model.widgets.length; i++)
   {
      var widget = model.widgets[i];
      if (widget.id == "WebPreview")
      {
         var conditions = [];
         // Insert new pluginCondition(s) at start of the chain
         conditions.push({
            attributes: {
               mimeType: "video/mp4"
            },
            plugins: [{
               name: "FLVPlayer",
               attributes: {}
            }]
         });
         conditions.push({
            attributes: {
               mimeType: "video/x-m4v"
            },
            plugins: [{
               name: "FLVPlayer",
               attributes: {}
            }]
         });
         conditions.push({
            attributes: {
               mimeType: "video/m4v"
            },
            plugins: [{
               name: "FLVPlayer",
               attributes: {}
            }]
         });
         conditions.push({
            attributes: {
               mimeType: "x-flv"
            },
            plugins: [{
               name: "FLVPlayer",
               attributes: {}
            }]
         });
         conditions.push({
            attributes: {
               thumbnail: "h264preview"
            },
            plugins: [{
               name: "FLVPlayer",
               attributes: {}
            }]
         });
         var oldConditions = eval("("+jsonUtils.toObject("{\"tmp\":" + widget.options.pluginConditions + "}").tmp.toString()+")");
         // Add the other conditions back in
         for (var j = 0; j < oldConditions.length; j++)
         {
            conditions.push(oldConditions[j]);
         }
         // Override the original conditions
         model.pluginConditions = jsonUtils.toJSONString(conditions);
         widget.options.pluginConditions = model.pluginConditions;
      }
   }
}
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
               mimeType: "application/pdf"
            },
            plugins: [{
               name: "PdfJs",
               attributes: {}
            },
            {
               name: "Embed",
               attributes: {}
            }]
         });
         conditions.push({
            attributes: {
               thumbnail: "pdf"
            },
            plugins: [{
               name: "PdfJs",
               attributes: { src: "pdf" }
            },
            {
               name: "Embed",
               attributes: { src: "pdf" }
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
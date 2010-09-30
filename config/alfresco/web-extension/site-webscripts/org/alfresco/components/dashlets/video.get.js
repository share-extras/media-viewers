/**
 * Main entry point for component webscript logic
 *
 * @method main
 */
function main()
{
   // Check mandatory parameters
   var nodeRef = args.nodeRef;
   if (nodeRef != null)
   {
   // Call repo for node's metadata
      var json = remote.call("/api/metadata?nodeRef=" + nodeRef);
      if (json != null && json.toString().trim().length() != 0)
      {
         var node = {},
            n = eval('(' + json + ')');
            mcns = "{http://www.alfresco.org/model/content/1.0}",
            content = n.properties[mcns + "content"];

         // Call repo for available previews
         json = remote.call("/api/node/" + nodeRef.replace(":/", "") + "/content/thumbnaildefinitions");
         var previews =  eval('(' + json + ')');

         // Call repo for generated previews
         json = remote.call("/api/node/" + nodeRef.replace(":/", "") + "/content/thumbnails");
         var generatedPreviews =  eval('(' + json + ')');

         node.nodeRef = nodeRef;
         node.name = n.properties[mcns + "name"];
         node.title = n.properties[mcns + "title"] || "";
         node.icon = "/components/images/generic-file-32.png";
         node.mimeType = n.mimetype;
         node.previews = previews;
         node.generatedPreviews = generatedPreviews;
         if (content)
         {
            var size = content.substring(content.indexOf("size=") + 5);
            size = size.substring(0, size.indexOf("|"));
            node.size = size;
         }
         else
         {
            node.size = "0";
         }

         // Prepare the model
         model.node = node;
      }
   }
}

// Start the webscript
main();
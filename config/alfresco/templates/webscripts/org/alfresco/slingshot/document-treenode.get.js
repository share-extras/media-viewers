<import resource="classpath:/alfresco/templates/webscripts/org/alfresco/slingshot/documentlibrary/parse-args.lib.js">

/**
 * Document List Component: treenode
 */
model.treenode = getTreeNode();

/* Create collection of folders in the given space */
function getTreeNode()
{
   try
   {
      var items = new Array(),
         hasSubfolders = true,
         ignoredTypes =
         {
            "{http://www.alfresco.org/model/forum/1.0}forum": true,
            "{http://www.alfresco.org/model/forum/1.0}topic": true,
            "{http://www.alfresco.org/model/content/1.0}systemfolder": true
         },
         mimetype = args["mimetype"],
         evalChildFolders = args["children"] !== "false",
         resultsTrimmed = false,
         argMax = parseInt(args["max"], 10),
         maxItems = isNaN(argMax) ? -1 : argMax;
   
      // Use helper function to get the arguments
      var parsedArgs = ParseArgs.getParsedArgs();
      if (parsedArgs === null)
      {
         return;
      }

      // Look for folders in the pathNode
      for each (item in parsedArgs.parentNode.children)
      {
         if (item.isSubType("cm:folder") && !(item.type in ignoredTypes))
         {
            if (evalChildFolders)
            {
               hasSubfolders = item.childFileFolders(true, true, "fm:forum").length > 0;
            }
            
            items.push(
            {
               node: item,
               hasSubfolders: hasSubfolders
            });
         }
         
         if (item.isSubType("cm:content") && (mimetype == null || item.mimetype.indexOf(mimetype) == 0))
         {
            items.push(
            {
               node: item,
               hasSubfolders: false
            });
         }
      }
   
      items.sort(sortByName);
   
      return (
      {
         "parentNode": parsedArgs.parentNode,
         "items": items
      });
   }
   catch(e)
   {
      status.setCode(status.STATUS_INTERNAL_SERVER_ERROR, e.toString());
      return;
   }
}


/* Sort the results by case-insensitive name */
function sortByName(a, b)
{
   return (b.node.name.toLowerCase() > a.node.name.toLowerCase() ? -1 : 1);
}